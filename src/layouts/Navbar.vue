<script setup>
import { useRoute } from 'vue-router'
import { useUserStore } from '../store/user'
import UserDropdown from '../components/UserDropdown.vue'
import { MAIN_MENU_ITEMS } from '../constants/menu'

const route = useRoute()
const userStore = useUserStore()
</script>

<template>
  <nav class="navbar">
    <div class="nav-brand">
      <img src="../assets/logo.svg" alt="SOJ Logo" class="brand-logo">
    </div>
    <div class="nav-links">
      <router-link
        v-for="item in MAIN_MENU_ITEMS"
        :key="item.path"
        :to="item.comingSoon ? '#' : item.path"
        class="nav-link"
        :class="{ 
          active: route.path === item.path,
          'coming-soon': item.comingSoon
        }"
        @click="item.comingSoon && $event.preventDefault()"
      >
        {{ item.label }}
        <span v-if="item.comingSoon" class="coming-soon-tag">即将上线</span>
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
        <UserDropdown />
      </template>
      <router-link v-else to="/login" class="login-btn">登录</router-link>
    </div>
  </nav>
</template>

<style scoped>
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
  display: flex;
  align-items: center;
}

.brand-logo {
  height: 40px;
  width: auto;
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
  position: relative;
}

.nav-link:hover {
  color: #4a90e2;
  background: #f5f5f5;
}

.nav-link.active {
  color: #4a90e2;
  background: #e6f7ff;
}

.nav-link.coming-soon {
  color: #999;
  cursor: default;
}

.nav-link.coming-soon:hover {
  background: #f9f9f9;
}

.coming-soon-tag {
  position: absolute;
  top: -8px;
  right: -10px;
  background: #ffab00;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-btn {
  padding: 8px 16px;
  background: #4a90e2;
  color: white;
  border-radius: 4px;
  text-decoration: none;
  transition: all 0.3s;
}

.login-btn:hover {
  background: #357dd8;
}
</style> 