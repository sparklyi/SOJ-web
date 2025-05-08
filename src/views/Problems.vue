<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProblems, getProblemJudgeCount } from '../api/problem'
import { getContests, getContestList } from '../api/contest'
import { message } from 'ant-design-vue'

const router = useRouter()
const problems = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)

// 题目通过率缓存
const problemPassRates = reactive({})
const passRateLoading = reactive({})

// 筛选条件
const filters = ref({
  name: '',
  level: '',
  page_size: 50
})

// 难度选项
const levelOptions = [
  { value: '', label: '全部' },
  { value: 'easy', label: '简单' },
  { value: 'mid', label: '中等' },
  { value: 'hard', label: '困难' }
]

// 近期竞赛 - 改为空数组，通过 API 获取
const upcomingContests = ref([])

// 获取近期竞赛
const fetchUpcomingContests = async () => {
  try {
    // 获取当前时间，格式化为 yyyy-MM-dd HH:mm:ss
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

    // 获取竞赛数据，限制为3个，时间大于当前时间
    const response = await getContestList({
      page: 1,
      page_size: 3,
      start_after: currentTime
    })

    if (response.code === 200) {
      // 格式化竞赛数据
      upcomingContests.value = (response.data.detail || []).map(contest => ({
        id: contest.ID,
        title: contest.name,
        startTime: contest.start_time,
        duration: getDuration(contest.start_time, contest.end_time),
        type: contest.type,
        tag: contest.tag
      }))
    } else {
      console.error('获取近期竞赛失败:', response.message)
    }
  } catch (error) {
    console.error('获取近期竞赛失败:', error)
  }
}

// 计算竞赛时长
const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '未知'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  // 计算小时差
  const diffHours = Math.floor((end - start) / (1000 * 60 * 60))
  
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24)
    const hours = diffHours % 24
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  } else {
    return `${diffHours}小时`
  }
}

// 活动通知
const activityNotices = ref([
  {
    id: 1,
    title: '算法竞赛冲刺训练营',
    date: '2024-05-15',
    type: '线上活动'
  },
  {
    id: 2,
    title: 'ACM编程技巧分享会',
    date: '2024-05-22',
    type: '线上讲座'
  },
  {
    id: 3,
    title: '高效编程工作坊',
    date: '2024-06-05',
    type: '线下活动'
  }
])

// 获取题目列表
const fetchProblems = async () => {
  loading.value = true
  try {
    const { page_size, ...restFilters } = filters.value
    const params = {
      ...restFilters,
      page: currentPage.value,
      page_size: Number(page_size)
    }
    const response = await getProblems(params)
    if (response.code === 200) {
      problems.value = response.data.detail || []
      total.value = response.data.count || 0
      
      // 获取每个题目的通过率
      problems.value.forEach(problem => {
        fetchProblemPassRate(problem.ID)
      })
    } else {
      message.error(response.message || '获取题目列表失败')
      problems.value = []
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败，请稍后重试')
    problems.value = []
  } finally {
    loading.value = false
  }
}

// 获取题目通过率
const fetchProblemPassRate = async (problemId) => {
  // 如果已经有数据或正在加载，则不重复请求
  if (problemPassRates[problemId] !== undefined || passRateLoading[problemId]) {
    return
  }
  
  // 标记为加载中
  passRateLoading[problemId] = true
  
  try {
    const res = await getProblemJudgeCount(problemId)
    if (res.code === 200) {
      // 计算通过率
      const data = res.data
      let totalSubmissions = 0
      let acceptedSubmissions = 0
      
      for (const status in data) {
        const count = parseInt(data[status] || 0)
        totalSubmissions += count
        if (status === 'Accepted') {
          acceptedSubmissions = count
        }
      }
      
      // 计算通过率百分比
      const passRate = totalSubmissions > 0 
        ? Math.round((acceptedSubmissions / totalSubmissions) * 100) 
        : 0
        
      problemPassRates[problemId] = {
        passRate,
        totalSubmissions,
        acceptedSubmissions
      }
    }
  } catch (error) {
    console.error(`获取题目 ${problemId} 通过率失败:`, error)
  } finally {
    passRateLoading[problemId] = false
  }
}

// 获取题目通过率显示文本
const getPassRateText = (problemId) => {
  if (passRateLoading[problemId]) {
    return '加载中...'
  }
  
  if (!problemPassRates[problemId]) {
    return '暂无数据'
  }
  
  const { passRate } = problemPassRates[problemId]
  return `${passRate}%`
}

// 获取通过率样式
const getPassRateClass = (problemId) => {
  if (!problemPassRates[problemId]) {
    return ''
  }
  
  const { passRate } = problemPassRates[problemId]
  if (passRate >= 70) {
    return 'pass-rate-high'
  } else if (passRate >= 40) {
    return 'pass-rate-medium'
  } else {
    return 'pass-rate-low'
  }
}

// 处理搜索
const handleSearch = () => {
  currentPage.value = 1
  fetchProblems()
}

// 重置筛选
const resetFilters = () => {
  filters.value = {
    name: '',
    level: '',
    page_size: 50
  }
  currentPage.value = 1
  fetchProblems()
}

// 获取难度显示文本
const getLevelText = (level) => {
  const option = levelOptions.find(opt => opt.value === level)
  return option ? option.label : level
}

// 获取难度样式
const getLevelClass = (level) => {
  switch (level) {
    case 'easy':
      return 'easy'
    case 'mid':
      return 'mid'
    case 'hard':
      return 'hard'
    default:
      return ''
  }
}

// 跳转到题目详情
const goToProblemDetail = (problemId) => {
  router.push(`/problem/${problemId}`)
}

// 跳转到竞赛详情
const goToContest = (id) => {
  router.push(`/contest/${id}`)
}

// 处理页码变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchProblems()
}

// 处理页面大小变化
const handlePageSizeChange = () => {
  currentPage.value = 1
  fetchProblems()
}

onMounted(() => {
  fetchProblems()
  fetchUpcomingContests()
})
</script>

<template>
  <div class="problems-container">
    <h1>题库</h1>
    
    <!-- 搜索和筛选区域 -->
    <div class="filters-section">
      <div class="filters-row">
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="filters.name" 
            type="text" 
            placeholder="搜索题目..."
            @input="handleSearch"
          />
        </div>
        
        <!-- 难度选择 -->
        <div class="filter-box">
          <select v-model="filters.level" @change="handleSearch">
            <option value="">所有难度</option>
            <option value="easy">简单</option>
            <option value="mid">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        
        <!-- 重置按钮 -->
        <button class="reset-btn" @click="resetFilters">重置</button>
      </div>
    </div>

    <div class="content-layout">
      <!-- 左侧题目列表 -->
      <div class="problem-list-container">
        <!-- 题目列表 -->
        <div class="problems-list">
          <div v-if="loading" class="loading">加载中...</div>
          <div v-else-if="!problems || problems.length === 0" class="empty">暂无题目</div>
          <div v-else>
            <div v-for="problem in problems" 
                :key="problem.ID" 
                class="problem-card"
                @click="goToProblemDetail(problem.ID)">
              <div class="problem-header">
                <div class="problem-title-wrapper">
                  <span class="problem-id">{{ problem.ID }}</span>
                  <span class="problem-title">{{ problem.name }}</span>
                </div>
                <div class="problem-meta">
                  <span :class="['level-tag', getLevelClass(problem.level)]">
                    {{ getLevelText(problem.level) }}
                  </span>
                  <span :class="['status-tag', problem.status ? 'active' : 'inactive']">
                    {{ problem.status ? '公开' : '私有' }}
                  </span>
                </div>
              </div>
              <div class="problem-footer">
                <div class="problem-stats">
                  <span class="pass-rate">
                    通过率: {{ getPassRateText(problem.ID) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="total > 0">
          <button 
            :disabled="currentPage === 1"
            @click="handlePageChange(currentPage - 1)"
          >
            上一页
          </button>
          <div class="filter-box page-size-filter">
            <select v-model="filters.page_size" @change="handlePageSizeChange">
              <option :value="10">10条/页</option>
              <option :value="20">20条/页</option>
              <option :value="50">50条/页</option>
              <option :value="100">100条/页</option>
            </select>
          </div>
          <span class="page-info">
            第 {{ currentPage }} 页 / 共 {{ Math.ceil(total / filters.page_size) }} 页
          </span>
          <button 
            :disabled="currentPage >= Math.ceil(total / filters.page_size)"
            @click="handlePageChange(currentPage + 1)"
          >
            下一页
          </button>
          <span class="total-info">
            共 {{ total }} 条记录
          </span>
        </div>
      </div>

      <!-- 右侧信息区 -->
      <div class="sidebar-container">
        <!-- 近期竞赛 -->
        <section class="card upcoming-contests">
          <div class="card-header">
            <h2>近期竞赛</h2>
          </div>
          <div class="contest-list">
            <div 
              v-for="contest in upcomingContests" 
              :key="contest.id" 
              class="contest-item"
              @click="goToContest(contest.id)"
            >
              <div class="contest-info">
                <h3 class="contest-title">{{ contest.title }}</h3>
                <div class="contest-meta">
                  <div class="contest-time">
                    <i class="time-icon"></i>
                    <span>{{ contest.startTime }}</span>
                  </div>
                  <div class="contest-details">
                    <span class="contest-duration">时长: {{ contest.duration }}</span>
                    <span class="contest-tag">{{ contest.tag }}</span>
                    <span class="contest-type">{{ contest.type }}</span>
                  </div>
                </div>
              </div>
              <div class="arrow-icon">
                <i class="arrow-right"></i>
              </div>
            </div>
          </div>
        </section>

        <!-- 活动通知 -->
        <section class="card activity-notices">
          <div class="card-header">
            <h2>活动通知</h2>
          </div>
          <div class="activity-list">
            <div v-for="activity in activityNotices" :key="activity.id" class="activity-item">
              <div class="activity-info">
                <h3 class="activity-title">{{ activity.title }}</h3>
                <div class="activity-meta">
                  <span class="activity-date">日期: {{ activity.date }}</span>
                  <span class="activity-type">{{ activity.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problems-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 24px;
  font-weight: 600;
  border-left: 4px solid #4CAF50;
  padding-left: 15px;
}

.filters-section {
  margin-bottom: 24px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filters-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  flex: 1;
  width: 100px;
}

.filter-box {
  width: 150px;
}

.search-box input,
.filter-box select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-box input:focus,
.filter-box select:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.reset-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.reset-btn:hover {
  background: #e8e8e8;
  color: #40a9ff;
  border-color: #40a9ff;
}

@media (max-width: 992px) {
  .filters-row {
    flex-wrap: wrap;
  }
  
  .search-box {
    width: 100%;
    margin-bottom: 12px;
  }
  
  .filter-box {
    width: calc(50% - 6px);
  }
}

@media (max-width: 576px) {
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-box, 
  .search-box, 
  .reset-btn {
    width: 100%;
    margin-bottom: 8px;
  }
}

/* 整体布局 */
.content-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.problem-list-container {
  min-height: 500px;
}

.sidebar-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  font-size: 16px;
  color: #999;
}

.problem-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.problem-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.problem-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.problem-id {
  background: #f5f5f5;
  color: #666;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
}

.problem-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.problem-meta {
  display: flex;
  gap: 8px;
}

.level-tag, .status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.level-tag.easy {
  background: #e8f5e9;
  color: #4caf50;
}

.level-tag.mid {
  background: #fff3e0;
  color: #ff9800;
}

.level-tag.hard {
  background: #ffebee;
  color: #f44336;
}

.status-tag.active {
  background: #e6f7ff;
  color: #1890ff;
}

.status-tag.inactive {
  background: #f5f5f5;
  color: #999;
}

.problem-footer {
  display: flex;
  justify-content: space-between;
  color: #999;
  font-size: 13px;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.problem-time {
  display: flex;
  gap: 16px;
}

.problem-stats {
  display: flex;
  gap: 16px;
}

.pass-rate {
  font-weight: 500;
  color: #52c41a;
}

.pass-rate-high, .pass-rate-medium, .pass-rate-low {
  color: #52c41a;
}

.pagination {
  margin-top: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: white;
  padding: 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.pagination button {
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
  color: #40a9ff;
  border-color: #40a9ff;
}

.pagination button:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.page-size-filter {
  width: 120px;
  margin: 0;
}

.page-size-filter select {
  height: 36px;
}

.page-info, .total-info {
  color: #666;
  font-size: 14px;
}

.total-info {
  margin-left: 16px;
  color: #999;
}

/* 右侧卡片样式 */
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to right, #fcfcfc, #ffffff);
}

.card-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0;
}

/* 竞赛列表 */
.contest-list {
  padding: 0;
}

.contest-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.contest-item:last-child {
  border-bottom: none;
}

.contest-item:hover {
  background: #f8f9fa;
  transform: translateX(5px);
}

.contest-title {
  font-size: 16px;
  margin: 0 0 8px;
  color: #333;
}

.contest-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.contest-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.time-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S16.4,20,12,20z'/%3E%3Cpath d='M12.5,7H11v6l5.2,3.1l0.8-1.2l-4.5-2.7V7z'/%3E%3C/svg%3E");
  background-size: contain;
}

.contest-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.contest-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #4a90e2;
  border-radius: 12px;
  font-size: 12px;
}

.contest-tag {
  padding: 2px 8px;
  background: #e8f5e9;
  color: #4caf50;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 5px;
}

.arrow-icon {
  color: #ccc;
  transition: transform 0.2s;
}

.arrow-right {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-top: 2px solid #4a90e2;
  border-right: 2px solid #4a90e2;
  transform: rotate(45deg);
}

/* 活动通知 */
.activity-list {
  padding: 0;
}

.activity-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.activity-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-title {
  font-size: 16px;
  margin: 0 0 8px;
  color: #333;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.activity-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #4a90e2;
  border-radius: 12px;
  font-size: 12px;
}
</style> 