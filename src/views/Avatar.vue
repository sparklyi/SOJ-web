<script setup>
import { ref, onMounted } from 'vue'
import { getUserId, getAccessToken } from '../utils/auth'
import { getUserInfo } from '../api/user'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const userInfo = ref({
  avatar: ''
})
const loading = ref(true)
const uploading = ref(false)
const error = ref(null)
const fileInput = ref(null)
const previewImage = ref(null)

// 加载用户信息
onMounted(async () => {
  try {
    loading.value = true
    const userId = getUserId()
    if (userId) {
      const res = await getUserInfo(userId)
      if (res.code === 200) {
        userInfo.value = res.data
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

// 选择文件
const selectFile = () => {
  fileInput.value.click()
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // 检查文件类型
  if (!file.type.includes('image/')) {
    message.error('请选择图片文件')
    return
  }
  
  // 检查文件大小，限制为 2MB
  if (file.size > 2 * 1024 * 1024) {
    message.error('图片大小不能超过 2MB')
    return
  }
  
  // 预览图片
  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target.result
  }
  reader.readAsDataURL(file)
}

// 上传头像
const uploadAvatar = async () => {
  if (!previewImage.value) {
    message.warning('请先选择图片')
    return
  }
  
  try {
    uploading.value = true
    
    // 创建FormData对象
    const formData = new FormData()
    
    // 从fileInput中获取文件
    const file = fileInput.value.files[0]
    if (!file) {
      message.warning('请先选择图片')
      return
    }
    
    // 添加文件到FormData
    formData.append('avatar', file)
    
    // 调用上传API
    const token = getUserId()
    if (!token) {
      message.error('未登录状态')
      return
    }
    
    // 使用fetch进行文件上传
    const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
    const accessToken = getAccessToken()
    
    const response = await fetch(`${baseUrl}/api/v1/user/avatar`, {
      method: 'POST',
      headers: {
        'SOJ-Access-Token': accessToken
      },
      body: formData
    })
    
    const result = await response.json()
    
    if (result.code === 200) {
      message.success('头像上传成功')
      
      // 刷新用户信息，以获取新的头像URL
      const userId = getUserId()
      if (userId) {
        const userRes = await getUserInfo(userId)
        if (userRes.code === 200) {
          userInfo.value = userRes.data
          
          // 使用新的统一方法更新全局状态
          userStore.updateUserData({ avatar: userRes.data.avatar })
        }
      }
    } else {
      message.error('上传失败: ' + (result.message || '未知错误'))
    }
  } catch (err) {
    message.error('上传失败: ' + (err.message || '未知错误'))
    console.error('头像上传失败:', err)
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <div class="avatar-container">
    <div class="avatar-card">
      <h1>上传头像</h1>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else class="avatar-content">
        <div class="current-avatar">
          <h3>当前头像</h3>
          <div class="avatar-preview">
            <img :src="userInfo.avatar" alt="当前头像" v-if="userInfo.avatar" />
            <div class="no-avatar" v-else>暂无头像</div>
          </div>
        </div>
        
        <div class="upload-section">
          <h3>上传新头像</h3>
          <p class="upload-hint">支持 JPG、PNG 格式，大小不超过 2MB</p>
          
          <div class="preview-section" v-if="previewImage">
            <div class="new-avatar-preview">
              <img :src="previewImage" alt="新头像预览" />
            </div>
          </div>
          
          <div class="upload-actions">
            <input
              type="file"
              ref="fileInput"
              @change="handleFileChange"
              accept="image/*"
              class="file-input"
            />
            <button @click="selectFile" class="select-btn">选择图片</button>
            <button 
              @click="uploadAvatar" 
              class="upload-btn" 
              :disabled="!previewImage || uploading"
            >
              {{ uploading ? '上传中...' : '上传头像' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.avatar-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.avatar-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #f5222d;
}

.avatar-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.current-avatar, .upload-section {
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
}

h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.avatar-preview, .new-avatar-preview {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-preview img, .new-avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-avatar {
  color: #999;
  font-size: 14px;
}

.upload-hint {
  color: #999;
  margin-bottom: 15px;
  font-size: 14px;
}

.file-input {
  display: none;
}

.upload-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.select-btn, .upload-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.select-btn {
  background-color: #f0f0f0;
  color: #333;
}

.select-btn:hover {
  background-color: #e0e0e0;
}

.upload-btn {
  background-color: #1890ff;
  color: white;
}

.upload-btn:hover {
  background-color: #40a9ff;
}

.upload-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

@media (min-width: 768px) {
  .avatar-content {
    flex-direction: row;
  }
  
  .current-avatar, .upload-section {
    flex: 1;
  }
}
</style> 