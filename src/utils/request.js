import axios from 'axios'
import { getAccessToken, refreshToken, removeToken } from './auth'

// 创建 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000
})

// 是否正在刷新token
let isRefreshing = false
// 重试队列，每一项将是一个待执行的函数形式
let retryRequests = []

// 请求拦截器
service.interceptors.request.use(
  config => {
    const token = getAccessToken()
    if (token) {
      config.headers['SOJ-Access-Token'] = token
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 如果响应码不是200，也需要视为错误
    const res = response.data
    if (res.code !== 200) {
      // 401状态码特殊处理，由下面的错误拦截器处理
      if (res.code === 401) {
        return Promise.reject(new Error('Unauthorized'))
      }
      // 其他错误直接返回错误信息
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  async error => {
    const originalRequest = error.config
    
    // 如果请求失败，并且错误是由于401 Unauthorized造成的，且该请求没有被标记为retry
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // 标记该请求为已重试
      originalRequest._retry = true
      
      // 如果当前没有在刷新token
      if (!isRefreshing) {
        // 标记正在刷新
        isRefreshing = true
        
        try {
          // 调用刷新令牌的接口
          const newToken = await refreshToken()
          
          // 刷新成功，更新当前请求的token
          originalRequest.headers['SOJ-Access-Token'] = newToken
          
          // 执行队列中的所有请求
          retryRequests.forEach(cb => cb(newToken))
          // 清空队列
          retryRequests = []
          
          // 重新发送当前请求
          return service(originalRequest)
        } catch (refreshError) {
          // 如果刷新令牌失败，清除令牌并跳转到登录页面
          console.error('刷新令牌失败:', refreshError)
          removeToken()
          
          // 清空队列，所有请求都会失败
          retryRequests = []
          
          // 使用 window.location 重定向到登录页面
          const currentPath = window.location.pathname
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
          
          return Promise.reject(refreshError)
        } finally {
          // 标记刷新完成
          isRefreshing = false
        }
      } else {
        // 如果已经在刷新token，将请求加入队列
        return new Promise(resolve => {
          retryRequests.push(token => {
            // 使用新的token更新请求头
            originalRequest.headers['SOJ-Access-Token'] = token
            // 重新发送请求
            resolve(service(originalRequest))
          })
        })
      }
    }
    
    // 处理其他错误
    return Promise.reject(error)
  }
)

export default service