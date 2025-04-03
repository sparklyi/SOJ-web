<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContestDetail, getUserApply } from '../api/contest'
import { message } from 'ant-design-vue'
import { getUserId } from '../utils/auth'

const route = useRoute()
const router = useRouter()
const contestId = computed(() => route.params.id)
const currentUserId = getUserId()

// 比赛详情数据
const contestDetail = ref(null)
const userApply = ref(null)
const loading = ref(true)

// 倒计时相关
const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const timerInterval = ref(null)

// 格式化时间
const formatNumber = (num) => {
  return num < 10 ? `0${num}` : `${num}`
}

// 计算格式化的倒计时
const formattedDays = computed(() => formatNumber(days.value))
const formattedHours = computed(() => formatNumber(hours.value))
const formattedMinutes = computed(() => formatNumber(minutes.value))
const formattedSeconds = computed(() => formatNumber(seconds.value))

// 获取竞赛详情
const fetchContestDetail = async () => {
  loading.value = true
  try {
    const res = await getContestDetail(contestId.value)
    if (res.code === 200) {
      contestDetail.value = res.data
      // 获取用户报名信息
      if (currentUserId) {
        await fetchUserApply()
      }
      
      // 检查是否应该在此页面
      checkAccess()
      
      // 开始计算倒计时
      startCountdown()
    } else {
      message.error(res.message || '获取竞赛详情失败')
      redirectToContestList()
    }
  } catch (error) {
    console.error('获取竞赛详情失败:', error)
    message.error('获取竞赛详情失败')
    redirectToContestList()
  } finally {
    loading.value = false
  }
}

// 获取用户报名信息
const fetchUserApply = async () => {
  if (!currentUserId || !contestId.value) return
  
  try {
    const res = await getUserApply(currentUserId, contestId.value)
    if (res.code === 200 && res.data) {
      userApply.value = res.data
    } else {
      userApply.value = null
    }
  } catch (error) {
    console.error('获取用户报名信息失败:', error)
    userApply.value = null
  }
}

// 检查是否有权限访问
const checkAccess = () => {
  if (!contestDetail.value) return
  
  // 如果是竞赛创建者
  const isCreator = currentUserId && contestDetail.value.user_id === Number(currentUserId)
  
  // 检查比赛是否已开始
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  
  if (now >= startTime) {
    // 已开始，重定向到竞赛详情页
    router.replace(`/contest/${contestId.value}`)
    return
  }
  
  // 检查是否已报名
  if (!isCreator && !userApply.value) {
    message.warning('您尚未报名该竞赛，请先报名')
    redirectToContestList()
  }
}

// 重定向到竞赛列表
const redirectToContestList = () => {
  router.replace('/contests')
}

// 计算并更新倒计时
const updateCountdown = () => {
  if (!contestDetail.value) return
  
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  const timeLeft = startTime - now
  
  if (timeLeft <= 0) {
    // 竞赛已开始，停止倒计时并重定向
    clearInterval(timerInterval.value)
    message.success('竞赛已开始！')
    
    // 确保在正确的时机重定向
    setTimeout(() => {
      router.replace(`/contest/${contestId.value}`)
    }, 1000)
    return
  }
  
  // 计算剩余时间
  days.value = Math.floor(timeLeft / (1000 * 60 * 60 * 24))
  hours.value = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  minutes.value = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))
  seconds.value = Math.floor((timeLeft % (1000 * 60)) / 1000)
}

// 开始倒计时
const startCountdown = () => {
  // 立即执行一次
  updateCountdown()
  
  // 清除可能存在的旧定时器
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  // 设置定时器，每秒更新一次
  timerInterval.value = setInterval(updateCountdown, 1000)
}

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 进入竞赛
const enterContest = () => {
  // 检查竞赛是否已开始或即将开始
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  const timeLeft = startTime - now
  
  if (now >= startTime) {
    // 已开始，直接进入
    router.push(`/contest/${contestId.value}`)
  } else if (timeLeft <= 60000) { // 1分钟内
    // 即将开始，可以进入
    message.info('竞赛即将开始，正在进入...')
    router.push(`/contest/${contestId.value}`)
  } else {
    // 还没到时间
    message.info(`竞赛将在${formatCountdownText()}后开始，请耐心等待`)
  }
}

// 格式化倒计时文本
const formatCountdownText = () => {
  let text = ''
  if (days.value > 0) {
    text += `${days.value}天`
  }
  if (hours.value > 0 || days.value > 0) {
    text += `${hours.value}小时`
  }
  if (minutes.value > 0 || hours.value > 0 || days.value > 0) {
    text += `${minutes.value}分钟`
  }
  text += `${seconds.value}秒`
  return text
}

// 返回竞赛列表
const backToList = () => {
  router.push('/contests')
}

// 计算是否可以进入竞赛
const canEnterContest = computed(() => {
  if (!contestDetail.value) return false
  
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  const timeLeft = startTime - now
  
  // 如果竞赛已开始或即将开始（1分钟内），允许进入
  return timeLeft <= 60000 || now >= startTime
})

// 获取进入按钮的文本
const getEnterButtonText = () => {
  if (!contestDetail.value) return '竞赛未开始'
  
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  
  if (now >= startTime) {
    return '进入竞赛'
  } else {
    const timeLeft = startTime - now
    if (timeLeft <= 60000) { // 1分钟内
      return '即将开始，点击进入'
    } else {
      return '竞赛未开始'
    }
  }
}

// 监听路由变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchContestDetail()
  }
})

onMounted(() => {
  fetchContestDetail()
})

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
})

// 格式化HTML内容
const getFormattedDescription = computed(() => {
  if (!contestDetail.value || !contestDetail.value.description) {
    return '<div class="empty-description">暂无竞赛描述</div>'
  }
  return contestDetail.value.description
})
</script>

<template>
  <div class="contest-waiting-container">
    <div v-if="loading" class="loading">正在加载竞赛信息...</div>
    
    <div v-else-if="contestDetail" class="waiting-content">
      <div class="contest-info-card">
        <div class="header-section">
          <h1 class="contest-title">{{ contestDetail.name }}</h1>
          <div class="contest-organizer">
            <span class="organizer-label">主办方：</span>
            <span class="organizer-value">{{ contestDetail.sponsor }}</span>
          </div>
        </div>
        
        <div class="time-section">
          <div class="time-info">
            <div class="start-time">
              <span class="time-label">开始时间：</span>
              <span class="time-value">{{ formatDate(contestDetail.start_time) }}</span>
            </div>
            <div class="end-time">
              <span class="time-label">结束时间：</span>
              <span class="time-value">{{ formatDate(contestDetail.end_time) }}</span>
            </div>
          </div>
        </div>
        
        <div class="countdown-section">
          <h2>距离竞赛开始还有</h2>
          <div class="countdown-display">
            <div class="countdown-item">
              <div class="countdown-value">{{ formattedDays }}</div>
              <div class="countdown-label">天</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-item">
              <div class="countdown-value">{{ formattedHours }}</div>
              <div class="countdown-label">时</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-item">
              <div class="countdown-value">{{ formattedMinutes }}</div>
              <div class="countdown-label">分</div>
            </div>
            <div class="countdown-separator">:</div>
            <div class="countdown-item">
              <div class="countdown-value">{{ formattedSeconds }}</div>
              <div class="countdown-label">秒</div>
            </div>
          </div>
        </div>
        
        <div class="status-section">
          <div class="status-message">
            <div class="message-icon">⏰</div>
            <div class="message-text">竞赛即将开始，请耐心等待</div>
          </div>
          
          <div v-if="userApply" class="apply-status">
            <div class="apply-info">
              <div class="apply-badge">已报名</div>
              <div class="apply-details">
                <div class="apply-name">{{ userApply.name }}</div>
                <div class="apply-email">{{ userApply.email }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="actions-section">
          <button class="back-btn" @click="backToList">返回竞赛列表</button>
          <button class="refresh-btn" @click="fetchContestDetail">刷新</button>
          <button 
            class="enter-btn" 
            @click="enterContest"
            :disabled="!canEnterContest"
          >
            {{ getEnterButtonText() }}
          </button>
        </div>
      </div>
      
      <div class="contest-description">
        <h2>竞赛简介</h2>
        <div class="description-content" v-html="getFormattedDescription"></div>
      </div>
    </div>
    
    <div v-else class="error-message">
      <div class="error-icon">❌</div>
      <div class="error-text">加载竞赛信息失败</div>
      <button class="back-btn" @click="backToList">返回竞赛列表</button>
    </div>
  </div>
</template>

<style scoped>
.contest-waiting-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 16px;
}

.waiting-content, .error-message {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-top: 20px;
}

.error-message {
  text-align: center;
  padding: 60px 30px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 20px;
}

.error-text {
  font-size: 18px;
  color: #ff4d4f;
  margin-bottom: 30px;
}

.contest-info-card {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.header-section {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20px;
}

.contest-title {
  font-size: 24px;
  color: #1890ff;
  margin: 0 0 10px 0;
}

.contest-organizer {
  color: #666;
  font-size: 14px;
}

.organizer-value {
  font-weight: 600;
  color: #333;
}

.time-section {
  padding: 10px 0;
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.time-label {
  font-weight: 500;
  margin-right: 8px;
}

.time-value {
  color: #333;
}

.countdown-section {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.countdown-section h2 {
  font-size: 18px;
  color: #52c41a;
  margin: 0 0 20px 0;
}

.countdown-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.countdown-value {
  width: 60px;
  height: 60px;
  background: #52c41a;
  color: white;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
  font-weight: bold;
}

.countdown-label {
  margin-top: 8px;
  color: #52c41a;
  font-size: 14px;
}

.countdown-separator {
  font-size: 28px;
  font-weight: bold;
  color: #52c41a;
  margin-top: -20px;
}

.status-section {
  padding: 15px 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.status-message {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 8px;
  padding: 15px;
}

.message-icon {
  font-size: 24px;
}

.message-text {
  font-size: 15px;
  color: #1890ff;
}

.apply-status {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 15px;
}

.apply-info {
  display: flex;
  gap: 15px;
  align-items: center;
}

.apply-badge {
  background: #52c41a;
  color: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.apply-details {
  font-size: 14px;
}

.apply-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.apply-email {
  color: #666;
}

.actions-section {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.back-btn,
.refresh-btn,
.enter-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.back-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.back-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.refresh-btn {
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #1890ff;
}

.refresh-btn:hover {
  background: #bae7ff;
}

.enter-btn {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .contest-waiting-container {
    padding: 15px;
  }
  
  .countdown-display {
    flex-wrap: wrap;
  }
  
  .countdown-value {
    width: 45px;
    height: 45px;
    font-size: 22px;
  }
  
  .countdown-separator {
    font-size: 22px;
  }
  
  .actions-section {
    flex-direction: column;
  }
  
  .back-btn,
  .refresh-btn,
  .enter-btn {
    width: 100%;
  }
}

.contest-description {
  margin-top: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.contest-description h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px 0;
  position: relative;
  padding-left: 12px;
}

.contest-description h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: #1890ff;
  border-radius: 2px;
}

.description-content {
  line-height: 1.6;
  color: #333;
}

.empty-description {
  color: #999;
  text-align: center;
  padding: 40px 0;
}
</style> 