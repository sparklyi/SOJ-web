<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { removeToken, isAuthenticated, getRefreshToken } from './utils/auth'
import { useUserStore } from './store/user'
import { message } from 'ant-design-vue'
import { logout } from './api/user'
import Navbar from './layouts/Navbar.vue'

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
      await logout(refreshToken)
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
    <Navbar />
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

.main-content {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
</style>
