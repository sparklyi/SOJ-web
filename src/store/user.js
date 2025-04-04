import { defineStore } from 'pinia'
import { getUserInfo } from '../api/user'
import { getUserId } from '../utils/auth'
import { USER_ROLES } from '../constants/menu'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: {},
    loading: false,
    error: null
  }),
  getters: {
    isAdmin: (state) => state.userInfo.role >= USER_ROLES.ADMIN,
    isRoot: (state) => state.userInfo.role === USER_ROLES.ROOT,
    isBanned: (state) => state.userInfo.role === USER_ROLES.BAN,
    role: (state) => state.userInfo.role || 0,
    isLoggedIn: (state) => !!state.userInfo.ID,
    username: (state) => state.userInfo.username || '',
    avatar: (state) => state.userInfo.avatar || '',
    notify: (state) => state.userInfo.notify || 1,
    roleColor: (state) => {
      switch (state.userInfo.role) {
        case USER_ROLES.BAN: return '#999999' // 封禁用户 - 灰色
        case USER_ROLES.USER: return '#1890ff' // 普通用户 - 蓝色
        case USER_ROLES.ADMIN: return '#52c41a' // 管理员 - 绿色
        case USER_ROLES.ROOT: return '#fa541c' // 超级管理员 - 红色
        default: return '#666666' // 默认颜色
      }
    },
    roleName: (state) => {
      switch (state.userInfo.role) {
        case USER_ROLES.BAN: return '封禁用户'
        case USER_ROLES.USER: return '普通用户'
        case USER_ROLES.ADMIN: return '管理员'
        case USER_ROLES.ROOT: return '超级管理员'
        default: return '用户'
      }
    }
  },
  actions: {
    // 获取用户信息
    async fetchUserInfo() {
      const userId = getUserId()
      if (!userId) return

      this.loading = true
      this.error = null
      
      try {
        const res = await getUserInfo(userId)
        if (res.code === 200) {
          this.userInfo = res.data
        } else {
          this.error = res.message || '获取用户信息失败'
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.error = error.message || '获取用户信息失败'
      } finally {
        this.loading = false
      }
    },
    
    // 清除用户信息
    clearUserInfo() {
      this.userInfo = {}
      this.error = null
    },
    
    // 设置用户信息
    setUserInfo(userInfo) {
      this.userInfo = userInfo
    },
    
    // 更新头像
    updateAvatar(avatar) {
      if (this.userInfo && avatar) {
        this.userInfo.avatar = avatar
      }
    },
    
    // 更新通知设置
    updateNotify(notify) {
      if (this.userInfo) {
        this.userInfo.notify = notify
      }
    },
    
    // 更新用户信息 - 统一的方法来更新各个属性
    updateUserData(data) {
      if (this.userInfo) {
        this.userInfo = {
          ...this.userInfo,
          ...data
        }
      }
    }
  }
}) 