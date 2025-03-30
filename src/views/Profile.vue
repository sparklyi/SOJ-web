<script setup>
import { ref, onMounted } from 'vue'
import { getUserId } from '../utils/auth'
import { getUserInfo } from '../api/user'

const userInfo = ref({})
const loading = ref(true)
const error = ref(null)

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
        <div class="avatar-section">
          <img :src="userInfo.avatar" alt="用户头像" class="avatar" />
          <h2>{{ userInfo.username }}</h2>
          <div class="user-role">
            <span :style="{ color: getRoleColor(userInfo.role) }">{{ getRoleName(userInfo.role) }}</span>
          </div>
        </div>
        
        <div class="user-info">
          <div class="info-item">
            <div class="label">个人简介</div>
            <div class="value">{{ userInfo.profile || '这个人很懒，什么也没留下' }}</div>
          </div>
          
          <div class="info-item">
            <div class="label">注册时间</div>
            <div class="value">{{ formatDate(userInfo.CreatedAt) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
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

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.user-role {
  margin-top: 5px;
  font-size: 14px;
}

.user-info {
  margin-top: 20px;
}

.info-item {
  margin-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}

.label {
  color: #999;
  font-size: 14px;
  margin-bottom: 5px;
}

.value {
  color: #333;
}
</style> 