# backend/llm_model/implementations.py

import litellm
from litellm import completion as litellm_completion
from threading import Thread
from typing import Dict, Any, List, Union, AsyncGenerator
from langchain.schema import SystemMessage, HumanMessage
from transformers import pipeline

from llm_model.base import BaseLLM
from config.logging_config import logger
from utils.constants import MAX_TOKENS_DEFAULT, TEMPERATURE_DEFAULT


class CloudLLM(BaseLLM):
    """Cloud LLM implementation, routed through LiteLLM (OpenAI, Bedrock, Anthropic, Gemini, Vertex AI, ...)"""

    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)  # Call parent constructor first

    def validate_config(self) -> bool:
        """Validate model configuration"""
        if not self.model_config.get('name'):
            raise ValueError("Missing required configuration item: name")
        # Provider-prefixed models (e.g. "bedrock/...", "gemini/...") authenticate via
        # provider-specific env vars (AWS_ACCESS_KEY_ID, GEMINI_API_KEY, etc.), so only
        # plain OpenAI-style model names require an explicit api_key/api_base.
        if '/' not in self.model_config.get('name', ''):
            for field in ['api_key', 'api_base']:
                if not self.model_config.get(field):
                    raise ValueError(f"Missing required configuration item: {field}")
        return True

    def _build_litellm_kwargs(self) -> Dict[str, Any]:
        """Build common kwargs for a litellm.completion call from model_config"""
        kwargs = {
            'model': self.model_config.get('name'),
            'max_tokens': self.model_config.get('max_tokens', MAX_TOKENS_DEFAULT),
            'temperature': self.model_config.get('temperature', TEMPERATURE_DEFAULT),
        }
        if self.model_config.get('api_key'):
            kwargs['api_key'] = self.model_config.get('api_key')
        if self.model_config.get('api_base'):
            kwargs['api_base'] = self.model_config.get('api_base')
        if self.model_config.get('aws_region_name'):
            kwargs['aws_region_name'] = self.model_config.get('aws_region_name')
        return kwargs

    def chat(self, messages: List[Union[SystemMessage, HumanMessage]], **kwargs) -> str:
        """Chat with the model using LiteLLM (routes to OpenAI, Bedrock, Anthropic, Gemini, etc.)"""
        import time
        import random

        max_retries = kwargs.get('max_retries', 5)
        base_delay = kwargs.get('base_delay', 3)  # base delay time (seconds)

        # convert LangChain message format to OpenAI/LiteLLM format
        litellm_messages = []
        for msg in messages:
            if isinstance(msg, SystemMessage):
                litellm_messages.append({"role": "system", "content": msg.content})
            elif isinstance(msg, HumanMessage):
                litellm_messages.append({"role": "user", "content": msg.content})
            elif isinstance(msg, dict):
                litellm_messages.append(msg)
            else:
                litellm_messages.append({"role": "assistant", "content": msg.content})

        litellm_kwargs = self._build_litellm_kwargs()
        litellm_kwargs['messages'] = litellm_messages

        # retry mechanism
        for attempt in range(max_retries):
            try:
                # add a random delay to avoid overly concentrated requests
                if attempt > 0:
                    # exponential backoff strategy: delay grows exponentially as retries increase
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.info(
                        f"Rate limit reached, retrying in {delay:.2f} seconds (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(delay)

                completion = litellm_completion(**litellm_kwargs)
                response_format = {
                    "role": completion.choices[0].message.role,
                    "content": completion.choices[0].message.content,
                    "raw": completion.model_dump()
                }
                logger.info(f"Cloud LLM chat response: {response_format['content'][:100]}...")
                return response_format

            except litellm.RateLimitError as e:
                logger.warning(f"Rate limit error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt == max_retries - 1:  # final attempt
                    logger.error(f"Max retries reached. Cloud LLM chat error: {str(e)}")
                    raise
            except Exception as e:
                logger.error(f"Cloud LLM chat error: {str(e)}")
                raise

    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text"""
        import time
        import random

        max_retries = kwargs.get('max_retries', 3)
        base_delay = kwargs.get('base_delay', 2)  # base delay time (seconds)

        litellm_kwargs = self._build_litellm_kwargs()
        litellm_kwargs['messages'] = [{"role": "user", "content": prompt}]

        # retry mechanism
        for attempt in range(max_retries):
            try:
                # add a random delay to avoid overly concentrated requests
                if attempt > 0:
                    # exponential backoff strategy: delay grows exponentially as retries increase
                    delay = base_delay * (2 ** attempt) + random.uniform(0, 1)
                    logger.info(
                        f"Rate limit reached, retrying in {delay:.2f} seconds (attempt {attempt + 1}/{max_retries})...")
                    time.sleep(delay)

                completion = litellm_completion(**litellm_kwargs)
                response_format = {
                    "role": completion.choices[0].message.role,
                    "content": completion.choices[0].message.content,
                    "raw": completion.model_dump()
                }
                logger.info(f"Cloud LLM generate response: {response_format['content'][:100]}...")
                return response_format

            except litellm.RateLimitError as e:
                logger.warning(f"Rate limit error (attempt {attempt + 1}/{max_retries}): {str(e)}")
                if attempt == max_retries - 1:  # final attempt
                    logger.error(f"Max retries reached. Cloud LLM generate error: {str(e)}")
                    raise
            except Exception as e:
                logger.error(f"Cloud LLM generate error: {str(e)}")
                raise

    def release(self):
        """Release model resources"""
        # LiteLLM is stateless per-call, no special release operations needed
        pass


class LocalLLM(BaseLLM):
    """Local LLM implementation"""

    def __init__(self, model_config: Dict[str, Any]):
        super().__init__(model_config)
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer
        # Determine device
        if torch.cuda.is_available():
            device = "cuda"
            torch_dtype = torch.bfloat16
        elif hasattr(torch, 'mps') and torch.backends.mps.is_available():
            device = "mps"
            # MPS doesn't support bfloat16, use float16 or float32
            torch_dtype = torch.float16 if torch.backends.mps.is_built() else torch.float32
        else:
            device = "cpu"
            torch_dtype = torch.float32

        try:
            # Load model and tokenizer
            model_path = self.model_config.get('model_path')
            logger.info(f"Loading local model from {model_path} with device={device}, dtype={torch_dtype}")
            
            self.tokenizer = AutoTokenizer.from_pretrained(model_path)
            
            # load model using a pipeline
            self.model = pipeline(
                "text-generation",
                model=model_path,
                torch_dtype=torch_dtype,
                device_map="auto",
            )

            # Save configuration
            self.device = device
            self.max_tokens = self.model_config.get('max_tokens', MAX_TOKENS_DEFAULT)
            self.temperature = self.model_config.get('temperature', TEMPERATURE_DEFAULT)

        except Exception as e:
            logger.error(f"Failed to load local model: {str(e)}")
            raise

    def release(self):
        """Release model resources"""
        if hasattr(self, 'model'):
            # Release CUDA memory
            import torch
            if torch.cuda.is_available():
                torch.cuda.empty_cache()

            # Delete model reference
            del self.model
            self.model = None

        if hasattr(self, 'tokenizer'):
            del self.tokenizer
            self.tokenizer = None

    def validate_config(self) -> bool:
        """Validate model configuration"""
        if not self.model_config.get('model_path'):
            raise ValueError("Missing required configuration item: model_path")
        return True

    def chat(self,
             messages: List[Union[SystemMessage, HumanMessage]],
             **kwargs) -> str:
        """Chat using local model"""
        try:
            # Convert messages to format acceptable by the model
            prompt = self._format_messages(messages)

            full_response = self.model(
                messages,
                max_new_tokens=self.max_tokens,
            )
            assistant_response = full_response[0]["generated_text"][-1]
            # logger.info(f"Local LLM chat response: {assistant_response['content'][:100]}...")

            # build the same return format as CloudLLM
            response_format = {
                "role": "assistant",
                "content": assistant_response['content'],
                "raw": {
                    "full_response": full_response,
                    "model": self.model_config.get('model_path'),
                    "prompt": prompt
                }
            }

            return response_format
        except Exception as e:
            logger.error(f"Local LLM chat error: {str(e)}")
            raise

    def generate(self, prompt: str, **kwargs) -> str:
        """Generate text"""
        try:
            # generate a response using the local model
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=self.max_tokens,
                return_attention_mask=True
            ).to(self.device)

            import torch
            with torch.no_grad():
                output = self.model.generate(
                    **inputs,
                    max_new_tokens=self.max_tokens,
                    do_sample=True,
                    temperature=self.temperature,
                    top_p=0.9,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )

            response_text = self.tokenizer.decode(output[0], skip_special_tokens=True)
            logger.info(f"Local LLM generate response: {response_text[:100]}...")

            # build the same return format as CloudLLM
            response_format = {
                "role": "assistant",
                "content": response_text,
                "raw": {
                    "full_response": response_text,
                    "model": self.model_config.get('model_path'),
                    "prompt": prompt
                }
            }

            return response_format
        except Exception as e:
            logger.error(f"Local LLM generate error: {str(e)}")
            raise

    def _format_messages(self, messages: List[Union[SystemMessage, HumanMessage]]) -> str:
        """Format message list into a single prompt"""
        formatted_messages = []
        for msg in messages:
            if isinstance(msg, dict):  # Handle dictionary format messages
                role = msg.get('role', '')
                content = msg.get('content', '')
                if role == 'system':
                    formatted_messages.append(f"System: {content}")
                elif role == 'user':
                    formatted_messages.append(f"Human: {content}")
                elif role == 'assistant':
                    formatted_messages.append(f"Assistant: {content}")
            else:  # Handle LangChain message objects
                if isinstance(msg, SystemMessage):
                    formatted_messages.append(f"System: {msg.content}")
                elif isinstance(msg, HumanMessage):
                    formatted_messages.append(f"Human: {msg.content}")
                else:
                    formatted_messages.append(f"Assistant: {msg.content}")

        # Ensure there's an Assistant: marker after the last message
        prompt = "\n".join(formatted_messages)
        if not prompt.rstrip().endswith("Assistant:"):
            prompt += "\nAssistant:"

        return prompt
