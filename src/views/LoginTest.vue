<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = () => {
  console.log('登录信息：', {
    email: email.value,
    password: password.value
  })
  // 模拟登录成功
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-test">
    <h2>登录测试</h2>
    <div class="form-group">
      <input
        v-model="email"
        type="email"
        placeholder="请输入邮箱"
        class="form-control"
      />
    </div>
    <div class="form-group">
      <input
        v-model="password"
        type="password"
        placeholder="请输入密码"
        class="form-control"
      />
    </div>
    <button @click="handleLogin" class="submit-btn">
      登录
    </button>
  </div>
</template>

<style scoped>
.login-test {
  max-width: 400px;
  margin: 100px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.form-group {
  margin-bottom: 15px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-btn:hover {
  background: #45a049;
}
</style> 