<script setup>
import { onMounted, watch, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { isAuthenticated } from './utils/auth'
import { useUserStore } from './store/user'
import Navbar from './layouts/Navbar.vue'
import Footer from './layouts/Footer.vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()


watch(
  () => route.path,
  () => {
    
    if (isAuthenticated() && !userStore.isLoggedIn) {
      userStore.fetchUserInfo()
    }
  },
  { immediate: true }
)

onMounted(() => {
  // 组件加载时获取用户信息
  if (isAuthenticated() && !userStore.isLoggedIn) {
    userStore.fetchUserInfo()
  }
})
</script>

<template>
  <div class="app-container">
    <Navbar />
    <main class="main-content">
      <router-view></router-view>
    </main>
    <Footer />
  </div>
</template>

<style>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9fafc;
}

.main-content {
  flex: 1;
  padding: 24px;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
  position: relative;
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 15px;
  }
}
</style>
