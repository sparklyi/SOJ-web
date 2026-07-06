<script setup>
import { ref, onMounted } from 'vue'
import { getUserId } from '../utils/auth'
import { getUserInfo, updateUserInfo, updateNotifySettings } from '../api/user'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const userStore = useUserStore()
const userInfo = ref({
  username: '',
  profile: '',
  notify: 1
})
const loading = ref(true)
const saving = ref(false)
const error = ref(null)

// 加载用户信息
onMounted(async () => {
  try {
    loading.value = true
    const userId = getUserId()
    if (userId) {
      const res = await getUserInfo(userId)
      if (res.code === 200) {
        userInfo.value = {
          ...userInfo.value,
          ...res.data
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

// 保存设置
const saveSettings = async () => {
  try {
    saving.value = true
    const userId = getUserId()
    
    if (!userId) {
      message.error('未登录状态，无法保存设置')
      return
    }
    
    // 合并保存用户信息和通知设置
    const response = await updateUserInfo(userId, {
      username: userInfo.value.username,
      profile: userInfo.value.profile,
      notify: Number(userInfo.value.notify)
    })
    
    if (response.code === 200) {
      message.success('设置已保存')
      
      // 使用新的统一方法更新全局状态
      userStore.updateUserData({
        username: userInfo.value.username,
        profile: userInfo.value.profile,
        notify: Number(userInfo.value.notify)
      })
    } else {
      message.warning('保存失败: ' + (response.message || '未知错误'))
    }
  } catch (err) {
    message.error('保存失败: ' + (err.message || '未知错误'))
    console.error('保存设置失败:', err)
  } finally {
    saving.value = false
  }
}

// 切换通知设置
const toggleNotify = () => {
  userInfo.value.notify = userInfo.value.notify === 1 ? 0 : 1
}
</script>

<template>
  <div class="settings-container">
    <div class="settings-card">
      <h1>编辑个人资料</h1>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else class="settings-form">
        <div class="form-item">
          <label>用户名</label>
          <input 
            type="text" 
            v-model="userInfo.username" 
            placeholder="请输入用户名"
            class="form-control"
          />
        </div>
        
        <div class="form-item">
          <label>个人简介</label>
          <textarea 
            v-model="userInfo.profile" 
            placeholder="请输入个人简介"
            class="form-control"
            rows="4"
          ></textarea>
        </div>
        
        <div class="form-item">
          <label>竞赛通知</label>
          <div class="notify-toggle">
            <button 
              @click="toggleNotify" 
              class="toggle-btn" 
              :class="{ 'active': userInfo.notify === 1 }"
            >
              <span class="toggle-slider"></span>
            </button>
            <span class="notify-label">{{ userInfo.notify === 1 ? '全部竞赛通知' : '只通知报名的比赛' }}</span>
          </div>
        </div>
        
        <div class="form-actions">
          <button 
            class="save-btn" 
            @click="saveSettings" 
            :disabled="saving"
          >
            {{ saving ? '保存中...' : '保存设置' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-card {
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

.settings-form {
  margin-top: 20px;
}

.form-item {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.notify-toggle {
  display: flex;
  align-items: center;
  margin-top: 5px;
}

.toggle-btn {
  position: relative;
  width: 50px;
  height: 24px;
  border-radius: 12px;
  background-color: #ccc;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s;
}

.toggle-btn.active {
  background-color: #4CAF50;
}

.toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  transition: transform 0.3s;
}

.toggle-btn.active .toggle-slider {
  transform: translateX(26px);
}

.notify-label {
  margin-left: 10px;
  color: #333;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

.save-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}

.save-btn:hover {
  background-color: #45a049;
}

.save-btn:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style> 