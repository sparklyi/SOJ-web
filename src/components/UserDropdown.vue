<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { message } from 'ant-design-vue'
import { removeToken, getRefreshToken } from '../utils/auth'
import { USER_MENU_ITEMS } from '../constants/menu'
import { logout } from '../api/user'

const router = useRouter()
const userStore = useUserStore()
const showDropdown = ref(false)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

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
    removeToken()
    userStore.clearUserInfo()
    message.warning('退出登录可能未完全成功，请稍后再试')
    router.push('/login')
  }
}

onMounted(() => {
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
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
      <div
        v-for="item in USER_MENU_ITEMS"
        :key="item.key"
        class="dropdown-item"
        @click="handleMenuClick(item.key)"
      >
        <span>{{ item.label }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid;
  overflow: hidden;
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
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  margin-top: 8px;
  z-index: 1000;
}

.user-info {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}

.dropdown-username {
  display: block;
  font-weight: 500;
  margin-bottom: 4px;
}

.user-role {
  font-size: 12px;
}

.dropdown-divider {
  height: 1px;
  background: #eee;
  margin: 4px 0;
}

.dropdown-item {
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.dropdown-item:hover {
  background: #f5f5f5;
}
</style> 