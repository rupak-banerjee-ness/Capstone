from functools import wraps
import time
from config.logging_config import logger
from typing import Optional, Type, Union, Tuple

def retry_on_error(
    max_retries: int = 3,
    delay: int = 1,
    exceptions: Optional[Union[Type[Exception], Tuple[Type[Exception], ...]]] = None,
    logger_name: str = None
):
    """Retry decorator
    
    Args:
        max_retries: maximum number of retries
        delay: retry delay time (seconds)
        exceptions: exception types that should trigger a retry, default is all exceptions
        logger_name: logger name, used to customize the error message prefix
    
    Returns:
        the decorator function
    
    Example:
        @retry_on_error(max_retries=3, delay=1, exceptions=(ValueError, KeyError))
        def my_function():
            pass
            
        @retry_on_error(logger_name="ChromaDB")
        def db_operation():
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            error_prefix = f"[{logger_name}] " if logger_name else ""
            
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    # if an exception type is specified and the current exception doesn't match, re-raise directly
                    if exceptions and not isinstance(e, exceptions):
                        raise
                        
                    if attempt == max_retries - 1:
                        logger.error(
                            f"{error_prefix}Operation failed, already retried {max_retries} times: {str(e)}"
                        )
                        raise
                        
                    logger.warning(
                        f"{error_prefix}Operation failed, retrying ({attempt + 1}/{max_retries}): {str(e)}"
                    )
                    # use an exponential backoff strategy
                    time.sleep(delay * (2 ** attempt))
            return None
        return wrapper
    return decorator 