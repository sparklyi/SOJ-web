<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { message } from 'ant-design-vue'
import { removeToken, getRefreshToken } from '../utils/auth'
import { USER_MENU_ITEMS, USER_ROLES } from '../constants/menu'
import { logout } from '../api/user'

const router = useRouter()
const userStore = useUserStore()
const showDropdown = ref(false)
const expandedMenus = ref({}) // 记录展开状态的子菜单

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// 切换子菜单展开状态
const toggleSubMenu = (key) => {
  expandedMenus.value[key] = !expandedMenus.value[key]
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
    case 'contest-applies':
      router.push('/contest-applies')
      break
    case 'contest-manage':
      router.push('/contest-manage')
      break
    case 'problem-manage':
      router.push('/problem-manage')
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
      <div v-for="item in USER_MENU_ITEMS" :key="item.key">
        <!-- 检查权限要求 -->
        <template v-if="!item.requireAuth || userStore.userInfo.role >= item.requireAuth">
          <!-- 处理带子菜单的项目 -->
          <div v-if="item.children" class="dropdown-parent">
            <div class="dropdown-item parent-item" @click="toggleSubMenu(item.key)">
              <span>{{ item.label }}</span>
              <span class="dropdown-caret" :class="{ 'rotated': expandedMenus[item.key] }">▼</span>
            </div>
            <div class="dropdown-submenu" v-show="expandedMenus[item.key]">
              <div
                v-for="child in item.children.filter(c => !c.requireAuth || userStore.userInfo.role >= c.requireAuth)"
                :key="child.key"
                class="dropdown-item submenu-item"
                @click="handleMenuClick(child.key)"
              >
                <span>{{ child.label }}</span>
              </div>
            </div>
          </div>
          <!-- 处理普通菜单项 -->
          <div
            v-else
            class="dropdown-item"
            @click="handleMenuClick(item.key)"
          >
            <span>{{ item.label }}</span>
          </div>
        </template>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dropdown-item:hover {
  background: #f5f5f5;
}

.dropdown-parent {
  position: relative;
}

.parent-item {
  font-weight: 500;
}

.dropdown-caret {
  font-size: 10px;
  transition: transform 0.3s ease;
}

.dropdown-caret.rotated {
  transform: rotate(180deg);
}

.dropdown-submenu {
  padding-left: 16px;
  background: #f9f9f9;
}

.submenu-item {
  padding-left: 24px;
  font-size: 14px;
}
</style> 