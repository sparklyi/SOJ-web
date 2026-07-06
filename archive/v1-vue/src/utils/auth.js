// token 相关操作
const ACCESS_TOKEN_KEY = 'SOJ-Access-Token'
const REFRESH_TOKEN_KEY = 'SOJ-Refresh-Token'
const USER_ID_KEY = 'SOJ-User-ID'
const USER_AUTH_KEY = 'SOJ-User-Auth'

// 解析JWT token
function parseToken(token) {
  try {
    if (!token) return null;
    
    // 获取第二部分（payload）
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // 解码base64
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('解析token失败:', error);
    return null;
  }
}

// 设置 token
export function setToken(data) {
  localStorage.setItem(ACCESS_TOKEN_KEY, data['SOJ-Access-Token'])
  // 如果有refresh token也存储
  if (data['SOJ-Refresh-Token']) {
    localStorage.setItem(REFRESH_TOKEN_KEY, data['SOJ-Refresh-Token'])
  }
  
  // 从token中解析用户ID和Auth
  const token = data['SOJ-Access-Token'];
  const decoded = parseToken(token);
  
  if (decoded) {
    localStorage.setItem(USER_ID_KEY, decoded.ID.toString());
    localStorage.setItem(USER_AUTH_KEY, decoded.Auth.toString());
  } else if (data.id) {
    // 兼容旧方式
    localStorage.setItem(USER_ID_KEY, data.id.toString());
  }
}

// 更新访问令牌
export function updateAccessToken(token) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
  
  // 从token中更新用户ID和Auth
  const decoded = parseToken(token);
  if (decoded) {
    localStorage.setItem(USER_ID_KEY, decoded.ID.toString());
    localStorage.setItem(USER_AUTH_KEY, decoded.Auth.toString());
  }
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

// 获取用户权限等级
export function getUserAuth() {
  const userAuth = localStorage.getItem(USER_AUTH_KEY)
  return userAuth ? Number(userAuth) : null
}

// 判断用户是否为管理员
export function isAdmin() {
  const userAuth = getUserAuth();
  return userAuth !== null && userAuth >= 2;
}

// 判断用户是否为超级管理员
export function isSuperAdmin() {
  const userAuth = getUserAuth();
  return userAuth !== null && userAuth === 3;
}

// 移除 token
export function removeToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USER_AUTH_KEY)
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
    } else if (result.code === 401 || result.message?.includes('refresh token 已过期')) {
      // 刷新token过期，需要重新登录
      console.error('Refresh token expired')
      removeToken()
      const currentPath = window.location.pathname
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
      throw new Error('Refresh token expired')
    } else {
      throw new Error(result.message || 'Refresh token failed')
    }
  } catch (error) {
    console.error('Error refreshing token:', error)
    
    // 只有在确认refresh token失效时才清除token
    if (error.message?.includes('refresh token') || error.message?.includes('过期')) {
      removeToken()
      const currentPath = window.location.pathname
      window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
    }
    
    throw error
  }
}

// 检查用户是否已认证
export function isAuthenticated() {
  return !!getAccessToken()
}

// 清除本地缓存的代码和token
export function clearLocalStorage() {
  // 清除所有代码缓存
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    if (key.startsWith('soj_code_')) {
      localStorage.removeItem(key)
    }
  })
  
  // 清除token
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(USER_AUTH_KEY)
} 