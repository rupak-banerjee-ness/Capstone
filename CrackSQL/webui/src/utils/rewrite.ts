import type { RewriteHistory } from '@/types/database'

// user message template
export const userTemplate = 
    'Please convert the ***[originalDB]*** query:\n```sql\n[sql]\n```\nto a ***[type]*** query. The ***[type]*** connection info is <u>[user]@[host]:[port]/[database]</u>'

// format user message
export const formatUserMessage = (history: RewriteHistory) => {
  return userTemplate
      .replace('[originalDB]', history.source_db_type)
      .replace('[sql]', history.original_sql)
      .replace('[type]', history.target_db.db_type)
      .replace('[user]', history.target_db.username)
      .replace('[host]', history.target_db.host)
      .replace('[port]', history.target_db.port)
      .replace('[database]', history.target_db.database)
      .replace('[type]', history.target_db.db_type)
}

// get status tag type
export const getStatusType = (status: string) => {
  const types = {
    success: 'success',
    failed: 'danger',
    processing: 'warning'
  }
  return types[status as keyof typeof types]
}

// format date
export const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

// calculate duration
export const calculateDuration = (createdAt: string, updatedAt: string) => {
  if (!createdAt || !updatedAt) return 'Unknown'
  
  const start = new Date(createdAt).getTime()
  const end = new Date(updatedAt).getTime()
  
  // calculate the time difference (milliseconds)
  const diff = end - start
  
  // if the difference is negative or invalid, return Unknown
  if (diff < 0 || isNaN(diff)) return 'Unknown'
  
  // convert to seconds
  const seconds = Math.floor(diff / 1000)
  
  // if less than 1 minute
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  // if less than 1 hour
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m${remainingSeconds}s`
  }
  
  // if less than 1 day
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h${minutes}m`
  }
  
  // if 1 day or more
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}d${hours}h`
} 