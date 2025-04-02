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
  console.log('发送注册API请求:', {
    email: data.email,
    password: data.password,
    code: data.code
  });
  return request({
    url: '/api/v1/user/register',
    method: 'post',
    data: {
      email: data.email,
      password: data.password,
      code: data.code
    }
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

// 邮箱登录
export function loginByEmail(data) {
  return request({
    url: '/api/v1/user/login_email',
    method: 'post',
    data
  })
}

// 密码登录
export function loginByPassword(data) {
  return request({
    url: '/api/v1/user/login_password',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getUserInfo(userId) {
  return request({
    url: `/api/v1/user/${Number(userId)}`,
    method: 'get'
  })
}

// 更新用户信息
export function updateUserInfo(userId, data) {
  return request({
    url: '/api/v1/user/update',
    method: 'put',
    data: {
      id: Number(userId),
      ...data
    }
  })
}

// 更新用户通知设置
export function updateNotifySettings(userId, notify) {
  return request({
    url: '/api/v1/user/update',
    method: 'put',
    data: { 
      id: Number(userId),
      notify 
    }
  })
}

// 用于自动刷新token
export function refreshUserToken() {
  return request({
    url: '/api/v1/user/refresh_token',
    method: 'post'
  })
}

// 登出
export function logout(refreshToken) {
  return request({
    url: '/api/v1/user/logout',
    method: 'get',
    headers: {
      'SOJ-Refresh-Token': refreshToken
    }
  })
}

// 修改密码
export function updatePassword(data) {
  return request({
    url: '/api/v1/user/update_password',
    method: 'put',
    data
  })
} 