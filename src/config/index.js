import axios from 'axios'

// API基础URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL

// 创建axios实例
export const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 从localStorage获取token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// API接口地址
export const API_URLS = {
  // 用户相关
  LOGIN: '/api/v1/user/login',
  REGISTER: '/api/v1/user/register',
  SEND_VERIFY_CODE: '/api/v1/email/verify_code',
  CHECK_VERIFY_CODE: '/api/v1/email/check_code',
  GET_CAPTCHA: '/api/v1/captcha/create'
} 