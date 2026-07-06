<script setup>
import { removeToken } from '../utils/auth'
import { useRouter } from 'vue-router'

const router = useRouter()

const handleLogout = () => {
  removeToken()
  router.push('/login')
}
</script>

<template>
  <div class="dashboard">
    <h1>仪表盘</h1>
    <button @click="handleLogout" class="logout-btn">
      退出登录
    </button>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 20px;
}

.logout-btn {
  margin-top: 20px;
  padding: 8px 16px;
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #ff6666;
}
</style> 