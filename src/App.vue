<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { removeToken, isAuthenticated, getRefreshToken } from './utils/auth'
import { useUserStore } from './store/user'
import { message } from 'ant-design-vue'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const showDropdown = ref(false)

const menuItems = [
  { path: '/', label: '首页' },
  { path: '/problems', label: '题库' },
  { path: '/contests', label: '竞赛' }
]

// 监听路由变化，检查登录状态
watch(
  () => route.path,
  () => {
    // 如果已登录但没有用户信息，则获取用户信息
    if (isAuthenticated() && !userStore.isLoggedIn) {
      userStore.fetchUserInfo()
    }
  },
  { immediate: true }
)

// 切换下拉菜单显示状态
const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 处理用户菜单点击事件
const handleMenuClick = (key) => {
  showDropdown.value = false
  
  switch (key) {
    case 'profile':
      router.push('/profile')
      break
    case 'avatar':
      router.push('/avatar')
      break
    case 'submissions':
      router.push('/submissions')
      break
    case 'contests-record':
      router.push('/contests-record')
      break
    case 'logout':
      handleLogout()
      break
  }
}

// 点击其他区域关闭下拉菜单
const closeDropdown = (event) => {
  const dropdown = document.querySelector('.user-dropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    showDropdown.value = false
  }
}

const handleLogout = async () => {
  try {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      await axios.post('/api/v1/user/logout', {}, {
        headers: {
          'SOJ-Refresh-Token': refreshToken
        }
      })
    }
    
    removeToken()
    userStore.clearUserInfo()
    message.success('已成功退出登录')
    router.push('/login')
  } catch (error) {
    console.error('退出登录失败:', error)
    // 即使请求失败，也清除本地令牌和状态
    removeToken()
    userStore.clearUserInfo()
    message.warning('退出登录可能未完全成功，请稍后再试')
    router.push('/login')
  }
}

onMounted(() => {
  // 组件加载时获取用户信息
  if (isAuthenticated() && !userStore.isLoggedIn) {
    userStore.fetchUserInfo()
  }
  
  // 添加全局点击事件监听器
  document.addEventListener('click', closeDropdown)
})

// 组件卸载时移除事件监听器
onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <nav class="navbar">
      <div class="nav-brand">SOJ</div>
      <div class="nav-links">
        <router-link
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: route.path === item.path }"
        >
          {{ item.label }}
        </router-link>
        <router-link
          v-if="userStore.isAdmin"
          to="/admin"
          class="nav-link"
          :class="{ active: route.path === '/admin' }"
        >
          管理面板
        </router-link>
      </div>
      <div class="nav-auth">
        <template v-if="userStore.isLoggedIn">
          <!-- 用户头像下拉菜单 -->
          <div class="user-dropdown">
            <div class="user-dropdown-link" @click.stop="toggleDropdown">
              <div class="avatar-wrapper" :title="userStore.roleName" :style="{ borderColor: userStore.roleColor }">
                <img class="avatar" :src="userStore.avatar" :alt="userStore.username" />
              </div>
            </div>
            <div class="dropdown-menu" v-show="showDropdown">
              <div class="user-info">
                <span class="dropdown-username">{{ userStore.username }}</span>
                <small class="user-role" :style="{ color: userStore.roleColor }">{{ userStore.roleName }}</small>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" @click="handleMenuClick('profile')">
                <span>个人主页</span>
              </div>
              <div class="dropdown-item" @click="handleMenuClick('avatar')">
                <span>上传头像</span>
              </div>
              <div class="dropdown-item" @click="handleMenuClick('submissions')">
                <span>提交记录</span>
              </div>
              <div class="dropdown-item" @click="handleMenuClick('contests-record')">
                <span>比赛记录</span>
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item" @click="handleMenuClick('logout')">
                <span>退出登录</span>
              </div>
            </div>
          </div>
        </template>
        <router-link v-else to="/login" class="login-btn">登录</router-link>
      </div>
    </nav>

    <!-- 主要内容区域 -->
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: white;
  padding: 0 20px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-brand {
  font-size: 24px;
  font-weight: bold;
  color: #4CAF50;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #666;
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover {
  color: #4CAF50;
  background: #f5f5f5;
}

.nav-link.active {
  color: #4CAF50;
  background: #e8f5e9;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  position: relative;
  display: inline-block;
}

.user-dropdown-link {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s;
}

.user-dropdown-link:hover {
  background: #f5f5f5;
}

.avatar-wrapper {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 200px;
  background-color: #fff;
  box-shadow: 0 3px 6px rgba(0,0,0,0.16);
  border-radius: 4px;
  padding: 5px 0;
  z-index: 10;
  margin-top: 5px;
}

.user-info {
  padding: 10px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.dropdown-username {
  font-weight: 600;
  font-size: 16px;
  color: #333;
}

.user-role {
  margin-top: 3px;
  font-size: 12px;
}

.dropdown-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  justify-content: center;
}

.dropdown-item:hover {
  background-color: #f5f5f5;
}

.dropdown-divider {
  height: 1px;
  background-color: #e8e8e8;
  margin: 5px 0;
}

/* 移除图标样式 */
.icon-user:before,
.icon-settings:before,
.icon-logout:before {
  content: none;
}

.login-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background: #4CAF50;
  color: white;
  text-decoration: none;
  transition: all 0.3s;
}

.login-btn:hover {
  background: #45a049;
}

.main-content {
  flex: 1;
  padding: 20px;
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 15px;
  }
  
  .nav-links {
    display: none;
  }
  
  .nav-brand {
    font-size: 20px;
  }
}
</style>
