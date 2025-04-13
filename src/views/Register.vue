<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const form = ref({
  username: '',
  password: '',
  confirmPassword: ''
})

// 添加密码可见性状态
const passwordVisible = ref(false)
const confirmPasswordVisible = ref(false)

// 切换密码可见性
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

// 切换确认密码可见性
const toggleConfirmPasswordVisibility = () => {
  confirmPasswordVisible.value = !confirmPasswordVisible.value
}

// 提交注册
const register = () => {
  // 注册逻辑
}
</script>

<template>
  <div class="register-container">
    <h1>注册</h1>
    <form @submit.prevent="register">
      <!-- 用户名输入框 -->
      <div class="form-group">
        <label for="username">用户名</label>
        <input
          type="text"
          v-model="form.username"
          id="username"
          placeholder="请输入用户名"
          class="form-control"
        />
      </div>
      
      <!-- 密码输入框 -->
      <div class="form-group">
        <label for="password">密码</label>
        <div class="password-input-container">
          <input
            :type="passwordVisible ? 'text' : 'password'"
            v-model="form.password"
            id="password"
            placeholder="请输入密码"
            class="form-control"
          />
          <button 
            type="button" 
            class="toggle-password-btn" 
            @click="togglePasswordVisibility"
          >
            <i :class="[passwordVisible ? 'eye-open-icon' : 'eye-close-icon']"></i>
          </button>
        </div>
      </div>

      <!-- 确认密码输入框 -->
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <div class="password-input-container">
          <input
            :type="confirmPasswordVisible ? 'text' : 'password'"
            v-model="form.confirmPassword"
            id="confirmPassword"
            placeholder="请再次输入密码"
            class="form-control"
          />
          <button 
            type="button" 
            class="toggle-password-btn" 
            @click="toggleConfirmPasswordVisibility"
          >
            <i :class="[confirmPasswordVisible ? 'eye-open-icon' : 'eye-close-icon']"></i>
          </button>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn-register">注册</button>
        <p class="login-link">已有账号？<a @click="router.push('/login')">登录</a></p>
      </div>
    </form>
  </div>
</template>

<style scoped>
.register-container {
  max-width: 500px;
  margin: 3rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.toggle-password-btn {
  position: absolute;
  right: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
}

.eye-open-icon {
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971500" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 238.933333c179.2 0 341.333333 102.4 426.666667 256-85.333333 153.6-247.466667 256-426.666667 256S170.666667 648.533333 85.333333 494.933333c85.333333-153.6 247.466667-256 426.666667-256z m0 85.333334c-102.4 0-187.733333 76.8-187.733333 170.666666s85.333333 170.666667 187.733333 170.666667 187.733333-76.8 187.733333-170.666667-85.333333-170.666667-187.733333-170.666666z m0 68.266666c59.733333 0 102.4 42.666667 102.4 102.4s-42.666667 102.4-102.4 102.4-102.4-42.666667-102.4-102.4 42.666667-102.4 102.4-102.4z" fill="%23666666"/></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.eye-close-icon {
  width: 20px;
  height: 20px;
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971550" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 238.933333c179.2 0 341.333333 102.4 426.666667 256-35.2 59.733333-81.066667 110.933333-136.533334 149.333334l-76.8-76.8c42.666667-29.866667 81.066667-68.266667 110.933334-115.2-59.733333-93.866667-166.4-153.6-285.866667-153.6-29.866667 0-55.466667 4.266667-81.066667 8.533333l-89.6-89.6C430.933333 247.466667 469.333333 238.933333 512 238.933333z m-345.6 51.2l136.533333 136.533334c-38.4 38.4-68.266667 85.333333-93.866666 132.266666 55.466667 89.6 166.4 153.6 285.866666 153.6 51.2 0 98.133333-8.533333 140.8-25.6l38.4 38.4 110.933334 110.933334 59.733333-59.733334-618.666667-618.666666-59.733333 59.733333 59.733333 59.733333-59.733333 12.8z m258.133333 258.133334l55.466667 55.466666c-4.266667 0-8.533333 0-12.8 0-59.733333 0-102.4-42.666667-102.4-102.4 0-4.266667 0-8.533333 0-12.8l59.733333 59.733334z m76.8-174.933334l123.733334 123.733334c0-4.266667 0-8.533333 0-12.8 0-93.866667-76.8-170.666667-170.666667-170.666667-4.266667 0-8.533333 0-12.8 0l59.733333 59.733333z" fill="%23666666"/></svg>');
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.form-actions {
  margin-top: 2rem;
}

.btn-register {
  width: 100%;
  padding: 12px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-register:hover {
  background: #40a9ff;
}

.login-link {
  text-align: center;
  margin-top: 1rem;
  color: #666;
}

.login-link a {
  color: #1890ff;
  cursor: pointer;
  text-decoration: none;
}

.login-link a:hover {
  text-decoration: underline;
}
</style> 