import axiosReq from '@/utils/axios-req'

// Get rewrite list
export const rewriteListReq = (pageSize = 20, page = 0, keyword = '') => {
  return axiosReq({
    url: 'api/rewrite/list',
    data: {
      page_size: pageSize,
      page,
      keyword
    },
    method: 'post'
  })
}

// Get rewrite detail
export const rewriteDetailReq = (id) => {
  return axiosReq({
    url: `api/rewrite/detail`,
    data: { id },
    method: 'post'
  })
}

// Get most recent rewrite
export const rewriteLatestReq = () => {
  return axiosReq({
    url: 'api/rewrite/latest',
    method: 'get'
  })
}

// Create rewrite history
export const createRewriteReq = (data) => {
  return axiosReq({
    url: 'api/rewrite/create',
    method: 'post',
    data
  })
}

// Stop rewrite task
export const stopRewriteReq = (data) => {
  return axiosReq({
    url: 'api/rewrite/stop',
    method: 'post',
    data
  })
}

// Delete rewrite history
export const deleteRewriteReq = (id) => {
  return axiosReq({
    url: 'api/rewrite/delete',
    method: 'post',
    data: { id }
  })
}
