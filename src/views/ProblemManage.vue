<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getUserProblems, deleteProblemAPI, updateProblemAPI, getProblemDetail } from '../api/problem'
import { message, Modal } from 'ant-design-vue'
import { getUserId } from '../utils/auth'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const userProblems = ref([])
const total = ref(0)
const userId = getUserId()

// 判断当前用户是否有创建题目的权限（管理员或超级管理员）
const hasCreatePermission = computed(() => userStore.isAdmin)

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10
})

// 筛选参数
const filters = reactive({
  difficulty: '',
  status: '',  // 公开状态：public, private, all
  keyword: ''  // 关键词搜索
})

// 难度级别选项
const difficultyOptions = [
  { value: '', label: '全部难度' },
  { value: 'easy', label: '简单' },
  { value: 'mid', label: '中等' },
  { value: 'hard', label: '困难' }
]

// 状态选项
const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'public', label: '公开' },
  { value: 'private', label: '私有' }
]

// 监听筛选条件变化
watch(filters, () => {
  pagination.page = 1  // 重置为第一页
  fetchUserProblems()
}, { deep: true })

// 获取用户创建的题目列表
const fetchUserProblems = async () => {
  if (!userId) {
    message.error('请先登录')
    return
  }

  loading.value = true
  try {
    const params = {
      ...pagination,
      user_id: userId
    }
    
    // 添加筛选条件
    if (filters.difficulty) {
      params.level = filters.difficulty
    }
    if (filters.status) {
      params.status = filters.status === 'public'
    }
    if (filters.keyword) {
      params.keyword = filters.keyword
    }
    
    const res = await getUserProblems(params)
    if (res.code === 200) {
      if (res.data && Array.isArray(res.data.detail)) {
        userProblems.value = res.data.detail.map(problem => ({
          ...problem,
          // 后端可能返回的字段不一致，这里统一处理
          title: problem.title || problem.name,
          public: problem.public || problem.status || false,
          difficulty: problem.difficulty || problem.level || 1
        }))
        total.value = res.data.count || 0
      } else if (res.data && Array.isArray(res.data)) {
        // 处理直接返回数组的情况
        userProblems.value = res.data.map(problem => ({
          ...problem,
          title: problem.title || problem.name,
          public: problem.public || problem.status || false,
          difficulty: problem.difficulty || problem.level || 1
        }))
        total.value = res.data.length
      } else {
        userProblems.value = []
        total.value = 0
        message.warning('未获取到题目数据')
      }
    } else {
      message.error(res.message || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败')
  } finally {
    loading.value = false
  }
}

// 页面变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchUserProblems()
}

// 每页数量变化
const handleSizeChange = () => {
  pagination.page = 1
  fetchUserProblems()
}

// 重置筛选条件
const resetFilters = () => {
  filters.difficulty = ''
  filters.status = ''
  filters.keyword = ''
  // watch会自动触发fetchUserProblems
}

// 创建新题目
const createProblem = () => {
  if (!hasCreatePermission.value) {
    message.error('您没有创建题目的权限')
    return
  }
  router.push('/problem-create')
}

// 编辑题目
const editProblem = (problemId) => {
  router.push({
    path: `/problem-edit/${problemId}`,  // 跳转到编辑页面
    query: { from: router.currentRoute.value.fullPath }      // 将当前页面的路径作为 'from' 参数传递
  })
}
// 编辑测试点
const editTestCase = (problemId) => {
  router.push(`/problem-testcase/${problemId}`)
}

// 删除题目
const deleteProblem = async (problemId) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个题目吗？该操作不可恢复！',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        const res = await deleteProblemAPI(problemId)
        if (res.code === 200) {
          message.success('删除成功')
          fetchUserProblems()
        } else {
          message.error(res.message || '删除失败')
        }
      } catch (error) {
        console.error('删除题目失败:', error)
        message.error('删除题目失败')
      }
    }
  })
}

// 切换题目公开状态
const toggleProblemPublic = async (problem) => {
  // 如果要将题目设为公开，先确认
  if (!problem.public) {
    Modal.confirm({
      title: '确认公开题目',
      content: '公开题目前，请确保您已完成题目描述录入和测试点编辑，公开后将对所有用户可见。是否继续？',
      okText: '确认公开',
      cancelText: '取消',
      onOk: async () => {
        await updateProblemStatus(problem)
      }
    })
  } else {
    // 如果是设为私有，直接执行
    await updateProblemStatus(problem)
  }
}

// 更新题目状态
const updateProblemStatus = async (problem) => {
  try {
    loading.value = true
    
    // 1. 先获取题目的详细信息
    const detailRes = await getProblemDetail(problem.ID)
    if (detailRes.code !== 200 || !detailRes.data) {
      message.error('获取题目详情失败，无法切换状态')
      return
    }
    
    // 2. 准备更新数据，基于获取的详情
    const problemDetail = detailRes.data
    const updateData = {
      id: problem.ID,
      name: problemDetail.name || problemDetail.title || problem.title,
      description: problemDetail.description || '',
      input_description: problemDetail.input_description || '',
      output_description: problemDetail.output_description || '',
      level: problemDetail.level || problemDetail.difficulty || 'easy',
      example: problemDetail.example || [],
      lang_limit: problemDetail.lang_limit || {},
      remark: problemDetail.remark || '',
      visible: !problem.public, // 切换状态，使用visible字段
      owner: problemDetail.owner || 0
    }
    
    // 3. 调用更新接口
    const res = await updateProblemAPI(updateData)
    if (res.code === 200) {
      message.success(`已${problem.public ? '设为私有' : '公开'}`)
      problem.public = !problem.public
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('切换题目状态失败:', error)
    message.error('操作失败')
  } finally {
    loading.value = false
  }
}

// 查看题目
const viewProblem = (problemId) => {
  router.push(`/problem/${problemId}`)
}

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  // 处理返回的是字符串的情况
  if (typeof difficulty === 'string') {
    const map = {
      'easy': { label: '简单', class: 'easy' },
      'mid': { label: '中等', class: 'medium' },
      'hard': { label: '困难', class: 'hard' }
    }
    return map[difficulty] || { label: '未知', class: '' }
  }
  
  // 处理返回的是数字的情况
  const map = {
    1: { label: '简单', class: 'easy' },
    2: { label: '中等', class: 'medium' },
    3: { label: '困难', class: 'hard' }
  }
  return map[difficulty] || { label: '未知', class: '' }
}

// 格式化时间
const formatDate = (dateStr) => {
  if (!dateStr) return '未知'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 跳转到测试点管理页面
const manageTestCase = (id) => {
  router.push(`/problem-testcase/${id}`)
}

onMounted(() => {
  fetchUserProblems()
})
</script>

<template>
  <div class="problems-manage-container">
    <div class="page-header">
      <h1>题目管理</h1>
      <button v-if="hasCreatePermission" class="create-btn" @click="createProblem">创建新题目</button>
    </div>
    
    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-group">
        <label>难度:</label>
        <select v-model="filters.difficulty">
          <option v-for="option in difficultyOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group">
        <label>状态:</label>
        <select v-model="filters.status">
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      
      <div class="filter-group keyword-filter">
        <input 
          type="text" 
          v-model="filters.keyword" 
          placeholder="题目名称关键词"
          class="keyword-input"
        />
      </div>
      
      <button class="reset-btn" @click="resetFilters">重置筛选</button>
    </div>
    
    <!-- 题目列表 -->
    <div class="problems-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="userProblems.length === 0" class="empty">没有符合条件的题目</div>
      <div v-else>
        <div v-for="problem in userProblems" :key="problem.ID" class="problem-card">
          <div class="problem-info">
            <div class="problem-header">
              <h2 class="problem-title">
                <span class="problem-id">ID: {{ problem.ID }}</span>
                {{ problem.title }}
              </h2>
              <div class="problem-tags">
                <span :class="['difficulty-tag', getDifficultyTag(problem.difficulty).class]">
                  {{ getDifficultyTag(problem.difficulty).label }}
                </span>
                <span :class="['public-tag', problem.public ? 'public' : 'private']">
                  {{ problem.public ? '公开' : '私有' }}
                </span>
                <span v-for="tag in (problem.tags ? problem.tags.split(',') : [])" :key="tag" class="tag-badge">{{ tag }}</span>
              </div>
            </div>
            <div class="problem-times">
              <div class="time-item">
                <span class="time-label">创建时间:</span>
                <span class="time-value">{{ formatDate(problem.CreatedAt) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">最后更新:</span>
                <span class="time-value">{{ formatDate(problem.UpdatedAt) }}</span>
              </div>
            </div>
            <div class="problem-stats">
              <div class="stat-item">
                <span class="stat-label">通过率:</span>
                <span class="stat-value">{{ problem.accept_count ? ((problem.accept_count / problem.submit_count) * 100).toFixed(2) : 0 }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">提交数:</span>
                <span class="stat-value">{{ problem.submit_count || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">通过数:</span>
                <span class="stat-value">{{ problem.accept_count || 0 }}</span>
              </div>
            </div>
          </div>
          <div class="problem-action">
            <button 
              class="view-btn" 
              @click="viewProblem(problem.ID)"
            >
              查看题目
            </button>
            <button 
              class="edit-btn" 
              @click="editProblem(problem.ID)"
            >
              编辑题目
            </button>
            <button 
              class="testcase-btn" 
              @click="manageTestCase(problem.ID)"
            >
              编辑测试点
            </button>
            <button 
              class="toggle-btn" 
              @click="toggleProblemPublic(problem)"
              :class="problem.public ? 'private-action' : 'public-action'"
            >
              {{ problem.public ? '设为私有' : '公开题目' }}
            </button>
            <button 
              class="delete-btn" 
              @click="deleteProblem(problem.ID)"
            >
              删除题目
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="total > 0">
      <button 
        class="page-btn"
        :disabled="pagination.page === 1"
        @click="handlePageChange(pagination.page - 1)"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ pagination.page }} 页 / 共 {{ Math.ceil(total / pagination.page_size) }} 页
      </span>
      <button 
        class="page-btn"
        :disabled="pagination.page >= Math.ceil(total / pagination.page_size)"
        @click="handlePageChange(pagination.page + 1)"
      >
        下一页
      </button>
      <span class="total-info">
        共 {{ total }} 条记录
      </span>
      <div class="page-size-selector">
        <select v-model="pagination.page_size" @change="handleSizeChange">
          <option :value="5">5条/页</option>
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problems-manage-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 24px;
  font-weight: 600;
  border-left: 4px solid #4CAF50;
  padding-left: 15px;
}

.create-btn {
  padding: 10px 20px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn:hover {
  background: #357dd8;
}

/* 筛选栏样式 */
.filter-bar {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-group label {
  font-weight: 500;
  color: #666;
  min-width: 40px;
}

.filter-group select,
.keyword-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.keyword-filter {
  flex-grow: 1;
}

.keyword-input {
  flex-grow: 1;
  min-width: 200px;
}

.reset-btn {
  padding: 8px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-btn:hover {
  background: #e8e8e8;
  color: #333;
}

.problems-list {
  min-height: 200px;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #666;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.problem-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.problem-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.problem-info {
  flex: 1;
}

.problem-header {
  margin-bottom: 15px;
}

.problem-title {
  font-size: 20px;
  margin: 0 0 10px 0;
  color: #4a90e2;
}

.problem-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.difficulty-tag,
.public-tag,
.tag-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-tag.easy {
  background: #e6f7ff;
  color: #4a90e2;
}

.difficulty-tag.medium {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty-tag.hard {
  background: #ffebee;
  color: #f44336;
}

.public-tag.public {
  background: #e8f5e9;
  color: #4caf50;
}

.public-tag.private {
  background: #ffebee;
  color: #f44336;
}

.tag-badge {
  background: #f0f2f5;
  color: #666;
}

.problem-id {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.problem-times {
  margin-bottom: 15px;
}

.problem-stats {
  display: flex;
  gap: 20px;
}

.time-item, .stat-item {
  margin-bottom: 8px;
}

.time-label, .stat-label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
}

.time-value, .stat-value {
  color: #333;
}

.problem-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
  min-width: 120px;
}

.view-btn,
.edit-btn,
.testcase-btn,
.toggle-btn,
.delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
}

.view-btn {
  background: #4a90e2;
  color: white;
}

.view-btn:hover {
  background: #357dd8;
}

.edit-btn {
  background: #faad14;
  color: white;
}

.edit-btn:hover {
  background: #ffc53d;
}

.testcase-btn {
  background: #722ed1;
  color: white;
}

.testcase-btn:hover {
  background: #9254de;
}

.toggle-btn.public-action {
  background: #4a90e2;
  color: white;
}

.toggle-btn.public-action:hover {
  background: #357dd8;
}

.toggle-btn.private-action {
  background: #f5f5f5;
  color: #333;
}

.toggle-btn.private-action:hover {
  background: #e8e8e8;
}

.delete-btn {
  background: #ff4d4f;
  color: white;
}

.delete-btn:hover {
  background: #ff7875;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30px;
  gap: 12px;
}

.page-btn {
  padding: 6px 12px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  color: #4a90e2;
  border-color: #4a90e2;
}

.page-btn:disabled {
  color: #d9d9d9;
  cursor: not-allowed;
}

.page-info, .total-info {
  color: #666;
}

.page-size-selector {
  margin-left: 20px;
}

.page-size-selector select {
  padding: 6px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.problem-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.visibility-btn,
.edit-btn,
.testcase-btn,
.delete-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.edit-btn {
  background-color: #1890ff;
  color: white;
}

.edit-btn:hover {
  background-color: #40a9ff;
}

.testcase-btn {
  background-color: #52c41a;
  color: white;
}

.testcase-btn:hover {
  background-color: #73d13d;
}

.delete-btn {
  background-color: #ff4d4f;
  color: white;
}

@media (max-width: 768px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    justify-content: space-between;
  }
  
  .problem-card {
    flex-direction: column;
  }
  
  .problem-action {
    flex-direction: row;
    flex-wrap: wrap;
    margin-left: 0;
    margin-top: 15px;
    min-width: auto;
  }
  
  .view-btn,
  .edit-btn,
  .testcase-btn,
  .toggle-btn,
  .delete-btn {
    flex: 1;
    min-width: 120px;
    text-align: center;
  }
  
  .pagination {
    flex-wrap: wrap;
  }
}
</style> 