<script setup>
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const router = useRouter()

const handleLogout = () => {
  localStorage.removeItem('access_token')
  router.push('/login')
}
</script>

<template>
  <div class="app">
    <nav class="nav">
      <router-link to="/">首页</router-link> |
      <router-link to="/about">关于</router-link> |
      <template v-if="isAuthenticated()">
        <router-link to="/dashboard">控制台</router-link> |
        <a href="#" @click.prevent="handleLogout">退出</a>
      </template>
      <template v-else>
        <router-link to="/login">登录</router-link>
      </template>
    </nav>
    <router-view></router-view>
  </div>
</template>

<style>
.app {
  font-family: Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.nav {
  padding: 30px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 0 10px;
}

.nav a.router-link-active {
  color: #42b983;
}

.nav a:hover {
  color: #42b983;
}
</style>
