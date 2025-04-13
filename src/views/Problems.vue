<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { getProblems, getProblemJudgeCount } from '../api/problem'
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
})
</script>

<template>
  <div class="problems-container">
    <h1>题库</h1>
    
    <!-- 搜索和筛选区域 -->
    <div class="filters">
      <div class="search-box">
        <input 
          v-model="filters.name" 
          type="text" 
          placeholder="搜索题目..."
          @input="handleSearch"
        >
      </div>
      <div class="filter-box">
        <select v-model="filters.level" @change="handleSearch">
          <option value="">所有难度</option>
          <option value="easy">简单</option>
          <option value="mid">中等</option>
          <option value="hard">困难</option>
        </select>
      </div>
      <div class="filter-box">
        <select v-model="filters.page_size" @change="handlePageSizeChange">
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
          <option :value="100">100条/页</option>
        </select>
      </div>
      <button class="reset-btn" @click="resetFilters">重置</button>
    </div>

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
</template>

<style scoped>
.problems-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 24px;
  color: #333;
  margin-bottom: 24px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.filter-box {
  width: 150px;
}

.search-box input,
.filter-box select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
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
}

.reset-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
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

.page-info, .total-info {
  color: #666;
  font-size: 14px;
}

.total-info {
  margin-left: 16px;
  color: #999;
}

@media (max-width: 768px) {
  .problem-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .problem-meta {
    margin-top: 8px;
  }
  
  .problem-footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 