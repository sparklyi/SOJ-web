<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProblems } from '../api/problem'
import { message } from 'ant-design-vue'

const router = useRouter()
const problems = ref([])
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)

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
            <span class="create-time">创建时间：{{ new Date(problem.CreatedAt).toLocaleString() }}</span>
            <span class="update-time">更新时间：{{ new Date(problem.UpdatedAt).toLocaleString() }}</span>
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
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-box select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.reset-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #e8e8e8;
}

.problems-list {
  min-height: 200px;
  position: relative;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.problem-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  border: 1px solid #f0f0f0;
}

.problem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: #e8e8e8;
}

.problem-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.problem-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.problem-id {
  color: #1890ff;
  font-size: 14px;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
}

.problem-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.problem-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.level-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.level-tag.easy {
  background: #f6ffed;
  color: #52c41a;
}

.level-tag.mid {
  background: #fff7e6;
  color: #fa8c16;
}

.level-tag.hard {
  background: #fff1f0;
  color: #f5222d;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.active {
  background: #e8f5e9;
  color: #4caf50;
}

.status-tag.inactive {
  background: #ffebee;
  color: #f44336;
}

.problem-footer {
  display: flex;
  gap: 16px;
  color: #999;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
  border-color: #4CAF50;
  color: #4CAF50;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info, .total-info {
  color: #666;
  font-size: 14px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-box {
    width: 100%;
  }
  
  .filter-box select {
    width: 100%;
  }
  
  .problem-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .problem-footer {
    flex-direction: column;
    gap: 8px;
  }
}
</style> 