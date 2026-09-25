import axiosReq from '@/utils/axios-req'


// Get all embedding models
export const embeddingModelsReq = () => {
  return axiosReq({
    url: '/api/llm_model/llm_models',
    method: 'get',
    params: {
      category: 'embedding'
    },
    reqLoading: false
  })
}

// Get all LLM models
export const llmModelsReq = (params) => {
  return axiosReq({
    url: '/api/llm_model/llm_models',
    method: 'get',
    params: {
      category: 'llm',
      ...params
    },
    reqLoading: false
  })
}

// Create LLM model
export function createLLMModelReq(data) {
  return axiosReq({
    url: '/api/llm_model/create',
    method: 'post',
    data
  })
}

// Update LLM model
export function updateLLMModelReq(data) {
  return axiosReq({
    url: '/api/llm_model/update',
    method: 'post',
    data
  })
}

// Delete LLM model
export function deleteLLMModelReq(id) {
  return axiosReq({
    url: '/api/llm_model/delete',
    method: 'post',
    data: { id }
  })
}


