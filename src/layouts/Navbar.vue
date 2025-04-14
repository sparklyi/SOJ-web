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
  background: rgba(255, 255, 255, 0.95);
  padding: 0 30px;
  height: 68px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-logo {
  height: 42px;
  width: auto;
  transition: transform 0.3s;
}

.brand-logo:hover {
  transform: scale(1.05);
}

.nav-links {
  display: flex;
  gap: 24px;
}

.nav-link {
  color: #555;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.3s;
  position: relative;
  font-weight: 500;
  font-size: 15px;
}

.nav-link:hover {
  color: #4a90e2;
  background: rgba(74, 144, 226, 0.08);
}

.nav-link.active {
  color: #4a90e2;
  background: rgba(74, 144, 226, 0.1);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background-color: #4a90e2;
  border-radius: 3px;
}

.nav-link.coming-soon {
  color: #999;
  cursor: default;
}

.nav-link.coming-soon:hover {
  background: rgba(0, 0, 0, 0.02);
}

.coming-soon-tag {
  position: absolute;
  top: -8px;
  right: -10px;
  background: linear-gradient(135deg, #ffab00, #ff7e00);
  color: white;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;
  box-shadow: 0 2px 5px rgba(255, 171, 0, 0.3);
}

.nav-auth {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-btn {
  padding: 10px 18px;
  background: linear-gradient(135deg, #4a90e2, #357dd8);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 4px 8px rgba(74, 144, 226, 0.2);
  font-weight: 500;
}

.login-btn:hover {
  background: linear-gradient(135deg, #357dd8, #2d6bc0);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(74, 144, 226, 0.3);
}

@media (max-width: 768px) {
  .navbar {
    padding: 0 15px;
    height: 60px;
  }
  
  .nav-links {
    gap: 10px;
  }
  
  .nav-link {
    padding: 6px 10px;
    font-size: 14px;
  }
  
  .brand-logo {
    height: 36px;
  }
}
</style> 