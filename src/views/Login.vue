<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { setToken } from '../utils/auth'
import { loginByEmail, loginByPassword, register, sendVerifyCode, getCaptcha, getUserInfo } from '../api/user'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const isLogin = ref(true)
const loading = ref(false)
const countdown = ref(0)
const loginMode = ref('code') // 'code' 或 'password'

// 表单数据
const formData = ref({
  email: '',
  password: '',
  verifyCode: '',
  captcha: '',
  captcha_id: ''
})

// 表单验证
const emailError = ref('')
const passwordError = ref('')
const verifyCodeError = ref('')
const captchaError = ref('')

// 验证码图片
const captchaImg = ref('')

// 图形验证码弹窗
const showCaptchaModal = ref(false)
const modalCaptcha = ref('')
const modalCaptchaError = ref('')

// 添加密码可见性状态
const passwordVisible = ref(false)

// 邮箱格式验证
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 切换登录/注册
const toggleMode = () => {
  isLogin.value = !isLogin.value
  // 清空表单
  formData.value = {
    email: '',
    password: '',
    verifyCode: '',
    captcha_id: '',
    captcha: ''
  }
  // 清空错误信息
  emailError.value = ''
  passwordError.value = ''
  verifyCodeError.value = ''
  captchaError.value = ''
  // 重新获取验证码
  getCaptchaImage()
}

// 切换登录方式
const toggleLoginMode = () => {
  loginMode.value = loginMode.value === 'code' ? 'password' : 'code'
  formData.value.verifyCode = ''
  formData.value.password = ''
  formData.value.captcha = ''
  clearErrors()
}

// 清除错误信息
const clearErrors = () => {
  emailError.value = ''
  passwordError.value = ''
  verifyCodeError.value = ''
  captchaError.value = ''
}

// 获取验证码
const getCaptchaImage = async () => {
  try {
    const res = await getCaptcha()
    if (res.code === 200) {
      captchaImg.value = res.data.captcha_base64
      formData.value.captcha_id = res.data.captcha_id
    } else {
      captchaError.value = res.message || '获取验证码失败，请点击重试'
    }
  } catch (error) {
    console.error('获取验证码失败:', error)
    captchaError.value = '获取验证码失败，请点击重试'
  }
}

// 发送验证码
const sendCode = async () => {
  if (!formData.value.email || countdown.value > 0) return
  
  if (!validateEmail(formData.value.email)) {
    emailError.value = '请输入有效的邮箱地址'
    return
  }
  
  // 显示图形验证码弹窗
  showCaptchaModal.value = true
  modalCaptcha.value = ''
  modalCaptchaError.value = ''
}

// 验证图形验证码并发送邮箱验证码
const verifyCaptchaAndSendCode = async () => {
  if (!modalCaptcha.value) {
    modalCaptchaError.value = '请输入图形验证码'
    return
  }
  
  try {
    const res = await sendVerifyCode({
      email: formData.value.email,
      captcha_id: formData.value.captcha_id,
      captcha: modalCaptcha.value
    })
    
    if (res.code === 200) {
      showCaptchaModal.value = false
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
    } else {
      modalCaptchaError.value = res.message || '验证失败，请重试'
      // 验证失败时刷新验证码
      getCaptchaImage()
    }
  } catch (error) {
    console.error('发送验证码失败:', error)
    modalCaptchaError.value = '发送验证码失败，请稍后重试'
    // 发生错误时也刷新验证码
    getCaptchaImage()
  }
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

// 表单验证
const validateForm = () => {
  let isValid = true
  clearErrors()

  if (!formData.value.email) {
    emailError.value = '请输入邮箱'
    isValid = false
  } else if (!validateEmail(formData.value.email)) {
    emailError.value = '请输入有效的邮箱地址'
    isValid = false
  }

  if (isLogin.value) {
    if (loginMode.value === 'code') {
      if (!formData.value.verifyCode) {
        verifyCodeError.value = '请输入验证码'
        isValid = false
      }
    } else {
      if (!formData.value.password) {
        passwordError.value = '请输入密码'
        isValid = false
      }
      if (!formData.value.captcha) {
        captchaError.value = '请输入图形验证码'
        isValid = false
      }
    }
  } else {
    // 注册验证
    if (!formData.value.password) {
      passwordError.value = '请输入密码'
      isValid = false
    }
    if (!formData.value.verifyCode) {
      verifyCodeError.value = '请输入验证码'
      isValid = false
    }
  }

  return isValid
}

// 提交表单
const handleSubmit = async () => {
  if (loading.value || !validateForm()) return
  
  loading.value = true
  try {
    if (isLogin.value) {
      // 登录
      const loginData = loginMode.value === 'code' 
        ? {
            email: formData.value.email,
            code: formData.value.verifyCode
          }
        : {
            email: formData.value.email,
            password: formData.value.password,
            captcha_id: formData.value.captcha_id,
            captcha: formData.value.captcha
          }

      const res = await (loginMode.value === 'code' ? loginByEmail(loginData) : loginByPassword(loginData))
      if (res.code === 200) {
        setToken(res.data)
        // 登录成功后获取用户信息
        try {
          const userRes = await getUserInfo(res.data.id)
          if (userRes.code === 200) {
            // 更新全局状态
            userStore.setUserInfo(userRes.data)
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
        }
        
        message.success('登录成功')
        
        // 重定向到之前的页面或默认页面
        const redirect = route.query.redirect || '/'
        router.push(redirect)
      } else {
        // 根据登录方式显示不同的错误信息
        if (loginMode.value === 'code') {
          verifyCodeError.value = res.message
        } else {
          passwordError.value = res.message
          // 密码登录失败时刷新验证码
          getCaptchaImage()
        }
      }
    } else {
      // 注册 - 现在使用邮箱验证码
      if (!formData.value.verifyCode) {
        verifyCodeError.value = '请输入验证码'
        return
      }
      
      console.log('注册表单数据:', formData.value)
      
      const registerData = {
        email: formData.value.email,
        password: formData.value.password,
        code: formData.value.verifyCode
      }
      
      console.log('发送到API的注册数据:', registerData)
      
      const res = await register(registerData)
      if (res.code === 200) {
        setToken(res.data)
        try {
          const userRes = await getUserInfo(res.data.id)
          if (userRes.code === 200) {
            userStore.setUserInfo(userRes.data)
          }
        } catch (error) {
          console.error('获取用户信息失败:', error)
        }
        
        message.success('注册成功')
        
        // 重定向到首页
        router.push('/')
      } else {
        // 显示注册错误信息
        if (res.message.includes('验证码')) {
          verifyCodeError.value = res.message
        } else if (res.message.includes('密码')) {
          passwordError.value = res.message
        } else if (res.message.includes('邮箱')) {
          emailError.value = res.message
        } else {
          // 其他错误信息显示在表单顶部
          verifyCodeError.value = res.message
        }
        // 注册失败时刷新验证码
        getCaptchaImage()
      }
    }
  } catch (error) {
    console.error('操作失败:', error)
    verifyCodeError.value = '操作失败，请稍后重试'
    // 发生错误时刷新验证码
    getCaptchaImage()
  } finally {
    loading.value = false
  }
}

// 页面加载时获取验证码
getCaptchaImage()
</script>

<template>
  <div class="auth-container">
    <div class="auth-box">
      <!-- 左侧图片 -->
      <div class="auth-image">
        <div class="auth-content">
          <img src="../assets/logo.svg" alt="SOJ Logo" class="auth-logo" />
          <div class="auth-text">SOJ在线测评系统</div>
        </div>
      </div>
      
      <!-- 右侧表单 -->
      <div class="auth-form">
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
        
        <!-- 邮箱输入 -->
        <div class="form-group">
          <input
            v-model="formData.email"
            type="email"
            placeholder="请输入邮箱"
            class="form-control"
            :class="{ 'error': emailError }"
          />
          <div class="error-message" v-if="emailError">{{ emailError }}</div>
        </div>
        
        <!-- 登录表单 -->
        <template v-if="isLogin">
          <!-- 验证码登录 -->
          <template v-if="loginMode === 'code'">
            <div class="form-group verify-code">
              <input
                v-model="formData.verifyCode"
                type="text"
                placeholder="请输入验证码"
                class="form-control"
                :class="{ 'error': verifyCodeError }"
              />
              <button
                @click="sendCode"
                :disabled="countdown > 0"
                class="send-code-btn"
              >
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </button>
            </div>
            <div class="error-message" v-if="verifyCodeError">{{ verifyCodeError }}</div>
          </template>
          
          <!-- 密码登录 -->
          <template v-else>
            <div class="form-group">
              <div class="password-input-container">
                <input
                  :type="passwordVisible ? 'text' : 'password'"
                  v-model="formData.password"
                  id="password"
                  placeholder="请输入密码"
                  class="form-control"
                  @keyup.enter="handleSubmit"
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
            
            <div class="form-group captcha">
              <input
                v-model="formData.captcha"
                type="text"
                placeholder="请输入图形验证码"
                class="form-control"
                :class="{ 'error': captchaError }"
              />
              <img
                :src="captchaImg"
                alt="验证码"
                @click="getCaptchaImage"
                class="captcha-img"
              />
            </div>
            <div class="error-message" v-if="captchaError">{{ captchaError }}</div>
          </template>
          
          <!-- 切换登录方式 -->
          <div class="toggle-login-mode">
            <a href="#" @click.prevent="toggleLoginMode">
              {{ loginMode === 'code' ? '使用密码登录' : '使用验证码登录' }}
            </a>
          </div>
        </template>
        
        <!-- 注册表单 -->
        <template v-else>
          <div class="form-group">
            <input
              v-model="formData.password"
              type="password"
              placeholder="请输入密码"
              class="form-control"
              :class="{ 'error': passwordError }"
            />
            <div class="error-message" v-if="passwordError">{{ passwordError }}</div>
          </div>
          
          <div class="form-group verify-code">
            <input
              v-model="formData.verifyCode"
              type="text"
              placeholder="请输入验证码"
              class="form-control"
              :class="{ 'error': verifyCodeError }"
            />
            <button
              @click="sendCode"
              :disabled="countdown > 0"
              class="send-code-btn"
            >
              {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </button>
          </div>
          <div class="error-message" v-if="verifyCodeError">{{ verifyCodeError }}</div>
        </template>
        
        <!-- 提交按钮 -->
        <button
          @click="handleSubmit"
          :disabled="loading"
          class="submit-btn"
        >
          {{ loading ? '处理中...' : (isLogin ? '登录' : '注册') }}
        </button>
        
        <!-- 切换模式 -->
        <div class="toggle-mode">
          {{ isLogin ? '没有账号？' : '已有账号？' }}
          <a href="#" @click.prevent="toggleMode">
            {{ isLogin ? '立即注册' : '立即登录' }}
          </a>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图形验证码弹窗 -->
  <div v-if="showCaptchaModal" class="modal-overlay">
    <div class="modal-content">
      <h3>请输入图形验证码</h3>
      <div class="form-group captcha">
        <input
          v-model="modalCaptcha"
          type="text"
          placeholder="请输入图形验证码"
          class="form-control"
          :class="{ 'error': modalCaptchaError }"
        />
        <img
          :src="captchaImg"
          alt="验证码"
          @click="getCaptchaImage"
          class="captcha-img"
        />
      </div>
      <div class="error-message" v-if="modalCaptchaError">{{ modalCaptchaError }}</div>
      <div class="modal-buttons">
        <button @click="showCaptchaModal = false" class="cancel-btn">取消</button>
        <button @click="verifyCaptchaAndSendCode" class="confirm-btn">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 20px;
}

.auth-box {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
}

.auth-image {
  flex: 1;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  position: relative;
  overflow: hidden;
  min-width: 50%;
  background: linear-gradient(45deg, #3ecc68, #b7fab5);
}

.auth-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 2;
  text-align: center;
}

.auth-logo {
  width: 200px;
  height: auto;
  margin-bottom: 30px;
}

.auth-text {
  color: white;
  font-size: 2rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.auth-form {
  flex: 1;
  padding: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 50%;
}

h2 {
  text-align: center;
  color: #333;
  margin-bottom: 40px;
  font-size: 28px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 24px;
  position: relative;
}

.form-control {
  width: 100%;
  padding: 14px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

.form-control.error {
  border-color: #ff4444;
}

.error-message {
  color: #ff4444;
  font-size: 13px;
  margin-top: 6px;
}

.verify-code {
  display: flex;
  gap: 12px;
}

.send-code-btn {
  padding: 0 24px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.3s;
  font-size: 14px;
  height: 46px;
}

.send-code-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.send-code-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.captcha {
  display: flex;
  gap: 12px;
}

.captcha-img {
  height: 46px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;
}

.submit-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.toggle-mode, .toggle-login-mode {
  text-align: center;
  margin-top: 24px;
  color: #666;
  font-size: 14px;
}

.toggle-mode a, .toggle-login-mode a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 500;
  margin-left: 4px;
}

.toggle-mode a:hover, .toggle-login-mode a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .auth-box {
    flex-direction: column;
    min-height: auto;
  }
  
  .auth-image {
    display: none;
  }
  
  .auth-form {
    padding: 40px 20px;
    min-width: 100%;
  }

  h2 {
    font-size: 24px;
    margin-bottom: 30px;
  }

  .form-control {
    padding: 12px;
  }

  .send-code-btn, .captcha-img {
    height: 42px;
  }
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-content h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 18px;
}

.modal-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-btn {
  padding: 8px 20px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.confirm-btn {
  padding: 8px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.confirm-btn:hover {
  background: #45a049;
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
</style> 