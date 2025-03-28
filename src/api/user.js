import request from '../utils/request'

// 登录
export function login(data) {
  return request({
    url: '/api/v1/user/login',
    method: 'post',
    data
  })
}

// 注册
export function register(data) {
  return request({
    url: '/api/v1/user/register',
    method: 'post',
    data
  })
}

// 发送验证码
export function sendVerifyCode(data) {
  return request({
    url: '/api/v1/email/verify_code',
    method: 'post',
    data
  })
}

// 获取图形验证码
export function getCaptcha() {
  return request({
    url: '/api/v1/captcha/create',
    method: 'post'
  })
} 