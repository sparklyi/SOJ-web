<script setup>
import { ref, onMounted } from 'vue'
import { getUserId, removeToken } from '../utils/auth'
import { getUserInfo, sendVerifyCode, updatePassword, getCaptcha, updateUserInfo } from '../api/user'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import { useRouter } from 'vue-router'

const router = useRouter()
const userStore = useUserStore()
const userInfo = ref({})
const loading = ref(true)
const error = ref(null)
const activeTab = ref('info') // 'info' 或 'password'

// 编辑表单
const editForm = ref({
  username: '',
  profile: '',
  notify: 1
})

// 密码修改表单
const passwordForm = ref({
  email: '',
  password: '',
  code: ''
})
const formLoading = ref(false)
const editLoading = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
const passwordVisible = ref(false)

// 图形验证码相关
const captchaImg = ref('')
const captchaKey = ref('')
const captchaInput = ref('')
const showCaptchaModal = ref(false)

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '未知';
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// 获取角色名称
const getRoleName = (role) => {
  switch (role) {
    case -1: return '封禁用户';
    case 1: return '普通用户';
    case 2: return '管理员';
    case 3: return '超级管理员';
    default: return '用户';
  }
}

// 获取角色颜色
const getRoleColor = (role) => {
  switch (role) {
    case -1: return '#999999';
    case 1: return '#1890ff';
    case 2: return '#52c41a';
    case 3: return '#fa541c';
    default: return '#666666';
  }
}

// 获取图形验证码
const fetchCaptcha = async () => {
  try {
    const res = await getCaptcha()
    if (res.code === 200) {
      captchaImg.value = res.data.captcha_base64
      captchaKey.value = res.data.captcha_id
    }
  } catch (err) {
    message.error('获取图形验证码失败')
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!passwordForm.value.email) {
    message.warning('请输入邮箱地址')
    return
  }
  
  showCaptchaModal.value = true
  await fetchCaptcha()
}

// 确认发送验证码
const confirmSendCode = async () => {
  if (!captchaInput.value) {
    message.warning('请输入图形验证码')
    return
  }
  
  try {
    sendingCode.value = true
    const res = await sendVerifyCode({ 
      email: passwordForm.value.email,
      captcha: captchaInput.value,
      captcha_id: captchaKey.value
    })
    
    if (res.code === 200) {
      message.success('验证码已发送')
      countdown.value = 60
      const timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
          clearInterval(timer)
        }
      }, 1000)
      showCaptchaModal.value = false
      captchaInput.value = ''
    } else {
      message.error(res.message || '发送失败')
      fetchCaptcha() // 刷新图形验证码
    }
  } catch (err) {
    message.error('发送失败: ' + (err.message || '未知错误'))
    fetchCaptcha() // 刷新图形验证码
  } finally {
    sendingCode.value = false
  }
}

// 提交修改密码
const handleSubmit = async () => {
  if (!passwordForm.value.email || !passwordForm.value.password || !passwordForm.value.code) {
    message.warning('请填写完整信息')
    return
  }
  
  try {
    formLoading.value = true
    const res = await updatePassword(passwordForm.value)
    if (res.code === 200) {
      message.success('密码修改成功，请重新登录')
      // 修改密码成功后登出
      removeToken()
      userStore.clearUserInfo()
      // 延迟跳转
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } else {
      message.error(res.message || '修改失败')
    }
  } catch (err) {
    message.error('修改失败: ' + (err.message || '未知错误'))
  } finally {
    formLoading.value = false
  }
}

// 切换密码可见性
const togglePasswordVisibility = () => {
  passwordVisible.value = !passwordVisible.value
}

// 保存编辑
const saveEditing = async () => {
  if (!editForm.value.username) {
    message.warning('用户名不能为空')
    return
  }

  try {
    editLoading.value = true
    const userId = getUserId()
    const data = {
      id: Number(userId),
      username: editForm.value.username,
      profile: editForm.value.profile,
      notify: editForm.value.notify
    }
    
    const res = await updateUserInfo(userId, data)
    
    if (res.code === 200) {
      message.success('保存成功')
      // 更新本地数据
      userInfo.value.username = editForm.value.username
      userInfo.value.profile = editForm.value.profile
      userInfo.value.notify = editForm.value.notify
      // 更新全局状态
      userStore.updateUserData(data)
    } else {
      message.error(res.message || '保存失败')
    }
  } catch (err) {
    message.error('保存失败: ' + (err.message || '未知错误'))
  } finally {
    editLoading.value = false
  }
}

// 切换通知设置
const toggleNotify = () => {
  editForm.value.notify = editForm.value.notify === 1 ? 0 : 1;
}

onMounted(async () => {
  try {
    loading.value = true
    const userId = getUserId()
    if (userId) {
      const res = await getUserInfo(userId)
      if (res.code === 200) {
        userInfo.value = res.data
        // 初始化表单数据
        editForm.value.username = userInfo.value.username || ''
        editForm.value.profile = userInfo.value.profile || ''
        editForm.value.notify = userInfo.value.notify || 1
        
        if (userInfo.value.email) {
          passwordForm.value.email = userInfo.value.email
        }
      } else {
        error.value = res.message || '获取用户信息失败'
      }
    }
  } catch (err) {
    error.value = err.message || '发生错误'
    console.error('获取用户信息失败:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <h1>个人主页</h1>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else class="user-profile">
        <div class="profile-layout">
          <!-- 左侧头像区域 -->
          <div class="left-section">
            <img :src="userInfo.avatar" alt="用户头像" class="avatar" />
            <h2>{{ userInfo.username }}</h2>
            <div class="user-role">
              <span :style="{ color: getRoleColor(userInfo.role) }">{{ getRoleName(userInfo.role) }}</span>
            </div>
          </div>
          
          <!-- 右侧信息区域 -->
          <div class="right-section">
            <!-- 选项卡 -->
            <div class="tabs">
              <div 
                class="tab" 
                :class="{ active: activeTab === 'info' }"
                @click="activeTab = 'info'"
              >
                个人资料
              </div>
              <div 
                class="tab" 
                :class="{ active: activeTab === 'password' }"
                @click="activeTab = 'password'"
              >
                修改密码
              </div>
            </div>
            
            <!-- 个人资料 -->
            <div v-if="activeTab === 'info'" class="tab-content">
              <div class="info-form">
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon user-icon"></i>
                    <span>用户名</span>
                  </div>
                  <input 
                    type="text" 
                    v-model="editForm.username" 
                    placeholder="请输入用户名"
                    class="form-control"
                  />
                </div>
                
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon profile-icon"></i>
                    <span>个人简介</span>
                  </div>
                  <textarea 
                    v-model="editForm.profile" 
                    placeholder="请输入个人简介"
                    class="form-control"
                    rows="4"
                  ></textarea>
                </div>
                
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon notify-icon"></i>
                    <span>通知设置</span>
                  </div>
                  <div class="switch-container">
                    <span class="switch-label">{{ editForm.notify === 1 ? '接收所有竞赛通知' : '仅接收报名的比赛通知' }}</span>
                    <div class="switch" :class="{ active: editForm.notify === 1 }" @click="toggleNotify">
                      <div class="switch-handle"></div>
                    </div>
                  </div>
                </div>
                
                <div class="form-card readonly-card">
                  <div class="form-header">
                    <i class="form-icon time-icon"></i>
                    <span>注册时间</span>
                  </div>
                  <div class="readonly-value">{{ formatDate(userInfo.CreatedAt) }}</div>
                </div>
                
                <div class="form-actions">
                  <button 
                    class="save-btn" 
                    @click="saveEditing" 
                    :disabled="editLoading"
                  >
                    {{ editLoading ? '保存中...' : '保存修改' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- 修改密码 -->
            <div v-else-if="activeTab === 'password'" class="tab-content">
              <div class="info-form">
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon email-icon"></i>
                    <span>邮箱地址</span>
                  </div>
                  <input 
                    type="email" 
                    v-model="passwordForm.email" 
                    placeholder="请输入邮箱地址"
                    class="form-control"
                  />
                </div>
                
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon code-icon"></i>
                    <span>验证码</span>
                  </div>
                  <div class="code-input">
                    <input 
                      type="text" 
                      v-model="passwordForm.code" 
                      placeholder="请输入验证码"
                      class="form-control"
                    />
                    <button 
                      class="send-code-btn" 
                      @click="handleSendCode"
                      :disabled="sendingCode || countdown > 0"
                    >
                      {{ countdown > 0 ? `${countdown}s后重试` : '发送验证码' }}
                    </button>
                  </div>
                </div>
                
                <div class="form-card">
                  <div class="form-header">
                    <i class="form-icon password-icon"></i>
                    <span>新密码</span>
                  </div>
                  <div class="password-input-container">
                    <input 
                      :type="passwordVisible ? 'text' : 'password'" 
                      v-model="passwordForm.password" 
                      placeholder="请输入新密码"
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
                
                <div class="form-actions">
                  <button 
                    class="save-btn" 
                    @click="handleSubmit" 
                    :disabled="formLoading"
                  >
                    {{ formLoading ? '提交中...' : '确认修改' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 图形验证码弹窗 -->
  <div v-if="showCaptchaModal" class="captcha-modal">
    <div class="captcha-content">
      <h3>请输入图形验证码</h3>
      <div class="captcha-img">
        <img :src="captchaImg" alt="图形验证码" @click="fetchCaptcha" />
      </div>
      <div class="form-group">
        <input 
          type="text" 
          v-model="captchaInput" 
          placeholder="请输入图形验证码"
          class="form-control"
        />
      </div>
      <div class="modal-actions">
        <button class="cancel-btn" @click="showCaptchaModal = false">取消</button>
        <button class="confirm-btn" @click="confirmSendCode">确认</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.profile-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 30px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #f5222d;
}

.profile-layout {
  display: flex;
  flex-wrap: wrap;
  margin: 0 -15px;
}

.left-section {
  flex: 0 0 30%;
  max-width: 30%;
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.right-section {
  flex: 0 0 70%;
  max-width: 70%;
  padding: 0 15px;
}

.avatar {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 4px solid white;
}

h2 {
  margin: 10px 0;
  color: #333;
}

.user-role {
  margin: 5px 0 20px;
  font-size: 14px;
  font-weight: 500;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.tab {
  padding: 10px 20px;
  cursor: pointer;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.3s;
}

.tab:hover {
  color: #40a9ff;
}

.tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-content {
  padding: 10px 0;
}

.info-form {
  padding: 10px 0;
}

.form-card {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 15px;
  margin-bottom: 20px;
  transition: all 0.3s;
}

.form-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.form-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.form-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: contain;
}

.user-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650970575" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 512c123.776 0 224-100.224 224-224S635.776 64 512 64 288 164.224 288 288s100.224 224 224 224z m0-384c88.224 0 160 71.776 160 160s-71.776 160-160 160-160-71.776-160-160 71.776-160 160-160z" fill="%231890ff"/><path d="M704 768v-64c0-105.888-86.112-192-192-192s-192 86.112-192 192v64H704z m64 64H256v-128c0-141.184 114.816-256 256-256s256 114.816 256 256v128z" fill="%231890ff"/></svg>');
}

.profile-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650970777" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M864 144H160c-17.696 0-32 14.304-32 32v480c0 17.696 14.304 32 32 32h352v-64H192V208h640v416h-320v64h352c17.696 0 32-14.304 32-32V176c0-17.696-14.304-32-32-32z" fill="%231890ff"/><path d="M324.928 420.864l-11.072-30.56c-1.952-5.376-1.024-11.328 2.336-15.872 3.392-4.576 8.864-7.232 14.656-7.232H512v-64h-181.152a92.48 92.48 0 0 0-73.28 36.128 92.16 92.16 0 0 0-11.712 79.232l11.072 30.56L324.928 420.864zM240 612.8c0 39.744 32.256 72 72 72s72-32.256 72-72-32.256-72-72-72-72 32.256-72 72z m72-136c75.104 0 136 60.896 136 136s-60.896 136-136 136-136-60.896-136-136 60.896-136 136-136z" fill="%231890ff"/><path d="M663.328 602.496l-11.072 30.56a92.16 92.16 0 0 0 11.712 79.232A92.48 92.48 0 0 0 737.248 748.8H928v-64H737.248c-5.792 0-11.264-2.688-14.656-7.232a21.856 21.856 0 0 1-2.336-15.872l11.072-30.56-67.968-28.64zM736 339.2c0-39.744-32.256-72-72-72s-72 32.256-72 72 32.256 72 72 72 72-32.256 72-72z m-72 136c-75.104 0-136-60.896-136-136s60.896-136 136-136 136 60.896 136 136-60.896 136-136 136z" fill="%231890ff"/></svg>');
}

.notify-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650970914" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M480 224a32 32 0 0 1 64 0v256a32 32 0 0 1-64 0V224z m32 448a32 32 0 1 1 0-64 32 32 0 0 1 0 64z m0-640C300.256 32 128 204.256 128 416c0 211.744 172.256 384 384 384 211.744 0 384-172.256 384-384 0-211.744-172.256-384-384-384z m0 704c-176.448 0-320-143.552-320-320 0-176.448 143.552-320 320-320 176.448 0 320 143.552 320 320 0 176.448-143.552 320-320 320z" fill="%231890ff"/></svg>');
}

.time-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971001" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 128C300.256 128 128 300.256 128 512c0 211.744 172.256 384 384 384 211.744 0 384-172.256 384-384 0-211.744-172.256-384-384-384z m0 704c-176.448 0-320-143.552-320-320 0-176.448 143.552-320 320-320 176.448 0 320 143.552 320 320 0 176.448-143.552 320-320 320z" fill="%231890ff"/><path d="M640 480H512c-17.664 0-32 14.336-32 32v224c0 17.664 14.336 32 32 32s32-14.336 32-32V544h96c17.664 0 32-14.336 32-32s-14.336-32-32-32z" fill="%231890ff"/></svg>');
}

.form-header span {
  font-size: 16px;
  font-weight: 500;
  color: #1890ff;
}

.readonly-card {
  background-color: #f9f9f9;
}

.readonly-value {
  padding: 10px 0;
  color: #555;
  font-size: 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 30px;
}

.form-control {
  border: 1px solid #e8e8e8;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.switch-container {
  background-color: #f5f5f5;
  padding: 12px 15px;
  border-radius: 4px;
}

.code-input {
  display: flex;
  gap: 10px;
}

.code-input .form-control {
  flex: 1;
}

.send-code-btn {
  padding: 0 15px;
  background-color: #40a9ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.send-code-btn:hover {
  background-color: #1890ff;
}

.send-code-btn:disabled {
  background-color: #d9d9d9;
  cursor: not-allowed;
}

.submit-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.submit-btn:hover {
  background-color: #45a049;
}

.submit-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .left-section, .right-section {
    flex: 0 0 100%;
    max-width: 100%;
    margin-bottom: 30px;
  }
}

.captcha-modal {
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

.captcha-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 300px;
}

.captcha-content h3 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.captcha-img {
  text-align: center;
  margin-bottom: 15px;
}

.captcha-img img {
  max-width: 200px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.cancel-btn, .confirm-btn {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-btn {
  background: #f0f0f0;
  border: 1px solid #d9d9d9;
  color: #666;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.confirm-btn {
  background: #40a9ff;
  border: none;
  color: white;
}

.confirm-btn:hover {
  background: #1890ff;
}

.info-actions {
  text-align: right;
  margin-bottom: 20px;
}

.edit-btn {
  padding: 6px 16px;
  background-color: #40a9ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.edit-btn:hover {
  background-color: #1890ff;
}

.edit-form {
  padding: 5px 0;
}

.disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.help-text {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.switch-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.switch-label {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.switch {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  background-color: #ccc;
  cursor: pointer;
  transition: background-color 0.3s;
}

.switch.active {
  background-color: #1890ff;
}

.switch-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: left 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.switch.active .switch-handle {
  left: 28px;
}

.cancel-edit-btn {
  padding: 8px 16px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  margin-right: 10px;
}

.cancel-edit-btn:hover {
  background-color: #e8e8e8;
}

.save-btn {
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.info-readonly .value {
  padding: 10px 0;
  color: #666;
}

.email-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971099" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M874.666667 375.189333V746.666667c0 64.8-52.533333 117.333333-117.333334 117.333333H266.666667c-64.8 0-117.333333-52.533333-117.333334-117.333333V375.189333l362.666667 180.096 362.666667-180.096zM757.333333 160c64.8 0 117.333333 52.533333 117.333334 117.333333v32.554667L512 490.666667 149.333333 309.888V277.333333c0-64.8 52.533333-117.333333 117.333334-117.333333h490.666666z" fill="%231890ff"/></svg>');
}

.code-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971176" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M426.666667 896L132.8 602.133333a42.666667 42.666667 0 0 1 0-60.373333L426.666667 248.021333l60.373333 60.373334L243.2 548.906667l243.84 243.84L426.666667 896z m170.666666 0l-60.373333-60.373333 243.84-243.84-243.84-240.533334 60.373333-60.373333 293.866667 293.973333a42.666667 42.666667 0 0 1 0 60.373334L597.333333 896z" fill="%231890ff"/></svg>');
}

.password-icon {
  background-image: url('data:image/svg+xml;utf8,<svg t="1650971218" class="icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 64c153.173333 0 277.333333 124.16 277.333333 277.333333v74.666667H832c35.346667 0 64 28.653333 64 64v405.333333c0 35.346667-28.653333 64-64 64H192c-35.346667 0-64-28.653333-64-64V480c0-35.346667 28.653333-64 64-64h42.666667v-74.666667C234.666667 188.16 358.826667 64 512 64z m0 64c-117.824 0-213.333333 95.509333-213.333333 213.333333v74.666667h426.666666v-74.666667c0-117.824-95.509333-213.333333-213.333333-213.333333zM192 480v405.333333h640V480H192z m320 213.333333c23.573333 0 42.666667-19.114667 42.666667-42.666666 0-23.573333-19.093333-42.666667-42.666667-42.666667s-42.666667 19.093333-42.666667 42.666667c0 23.552 19.093333 42.666667 42.666667 42.666666z" fill="%231890ff"/></svg>');
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