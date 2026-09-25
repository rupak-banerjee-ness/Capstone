import axiosReq from '@/utils/axios-req'

// Get database configuration list
export const databaseListReq = (pageSize = 10, page = 0, keyword = '') => {
  return axiosReq({
    url: 'api/database_config/list',
    data: {
      page_size: pageSize,
      page,
      keyword
    },
    method: 'post'
  })
}

// Get database type list
export const databaseTypesReq = () => {
  return axiosReq({
    url: 'api/database_config/types',
    method: 'get'
  })
}

// Create database configuration
export const createDatabaseReq = (config) => {
  return axiosReq({
    url: 'api/database_config/create',
    data: config,
    method: 'post'
  })
}

// Update database configuration
export const updateDatabaseReq = (config) => {
  return axiosReq({
    url: 'api/database_config/update',
    data: config,
    method: 'post'
  })
}

// Delete database configuration
export const deleteDatabaseReq = (id) => {
  return axiosReq({
    url: 'api/database_config/delete',
    data: { id },
    method: 'post'
  })
}


// Get list of supported database types
export const supportDatabaseReq = () => {
  return axiosReq({
    url: 'api/database_config/support',
    method: 'get'
  })
}