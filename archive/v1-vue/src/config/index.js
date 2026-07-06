import axios from 'axios'

// API基础URL
export const BASE_URL = import.meta.env.VITE_API_BASE_URL

// API接口地址
export const API_URLS = {
  // 用户相关
  LOGIN: '/api/v1/user/login',
  REGISTER: '/api/v1/user/register',
  SEND_VERIFY_CODE: '/api/v1/email/verify_code',
  CHECK_VERIFY_CODE: '/api/v1/email/check_code',
  GET_CAPTCHA: '/api/v1/captcha/create'
} 