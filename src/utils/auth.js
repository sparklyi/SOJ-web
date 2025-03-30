import axios from 'axios'

// token 相关操作
const ACCESS_TOKEN_KEY = 'SOJ-Access-Token'
const REFRESH_TOKEN_KEY = 'SOJ-Refresh-Token'
const USER_ID_KEY = 'SOJ-User-ID'

// 设置 token
export function setToken(data) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data['SOJ-Access-Token'])
  // 如果有refresh token也存储
  if (data['SOJ-Refresh-Token']) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data['SOJ-Refresh-Token'])
  }
  // 如果有用户ID也存储
  if (data.id) {
    localStorage.setItem(USER_ID_KEY, data.id.toString())
  }
}

// 更新访问令牌
export function updateAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

// 获取 access token
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

// 获取 refresh token
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// 获取用户 ID
export function getUserId() {
  const userId = localStorage.getItem(USER_ID_KEY)
  return userId ? Number(userId) : null
}

// 移除 token
export function removeToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
}

// 刷新 token - 使用原生 fetch API 避免循环依赖
export async function refreshToken() {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('No refresh token')
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const response = await fetch(`${baseUrl}/api/v1/user/refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'SOJ-Refresh-Token': refreshToken
      }
    })

    const result = await response.json()
    console.log('Refresh token response:', result)
    
    if (result.code === 200 && result.data && result.data['SOJ-Access-Token']) {
      // 根据新的API格式，只更新访问令牌
      updateAccessToken(result.data['SOJ-Access-Token'])
      return result.data['SOJ-Access-Token']
    } else {
      throw new Error(result.message || 'Refresh token failed')
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    removeToken()
    throw error
  }
}

export function isAuthenticated() {
  return !!getAccessToken()
} 