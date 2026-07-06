/**
 * 日期时间工具函数
 */

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm 格式
 * @param {string} dateStr - ISO格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  
  // 避免无效日期
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

/**
 * 格式化日期时间为 yyyy-MM-dd HH:mm:ss 格式
 * @param {string} dateStr - ISO格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDateTimeWithSeconds(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  
  // 避免无效日期
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 格式化日期为 yyyy-MM-dd 格式
 * @param {string} dateStr - ISO格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  
  // 避免无效日期
  if (isNaN(date.getTime())) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
} 