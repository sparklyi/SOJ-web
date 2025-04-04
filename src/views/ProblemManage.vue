<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserProblems, deleteProblemAPI, updateProblemAPI } from '../api/problem'
import { message } from 'ant-design-vue'
import { getUserId } from '../utils/auth'

const router = useRouter()
const loading = ref(false)
const userProblems = ref([])
const total = ref(0)
const userId = getUserId()

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10
})

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
    
    const res = await getUserProblems(params)
    if (res.code === 200) {
      userProblems.value = res.data.detail || []
      total.value = res.data.count || 0
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

// 创建新题目
const createProblem = () => {
  router.push('/problem/create')
}

// 编辑题目
const editProblem = (problemId) => {
  router.push(`/problem/edit/${problemId}`)
}

// 删除题目
const deleteProblem = async (problemId) => {
  if (confirm('确定要删除这个题目吗？该操作不可恢复！')) {
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
}

// 切换题目公开状态
const toggleProblemPublic = async (problem) => {
  try {
    const res = await updateProblemAPI(problem.ID, { public: !problem.public })
    if (res.code === 200) {
      message.success(`已${problem.public ? '设为私有' : '公开'}`)
      problem.public = !problem.public
    } else {
      message.error(res.message || '操作失败')
    }
  } catch (error) {
    console.error('切换题目状态失败:', error)
    message.error('操作失败')
  }
}

// 查看题目
const viewProblem = (problemId) => {
  router.push(`/problem/${problemId}`)
}

// 获取难度标签
const getDifficultyTag = (difficulty) => {
  const map = {
    1: { label: '简单', class: 'easy' },
    2: { label: '中等', class: 'medium' },
    3: { label: '困难', class: 'hard' }
  }
  return map[difficulty] || { label: '未知', class: '' }
}

// 格式化时间
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

onMounted(() => {
  fetchUserProblems()
})
</script>

<template>
  <div class="problems-manage-container">
    <div class="page-header">
      <h1>题目管理</h1>
      <button class="create-btn" @click="createProblem">创建新题目</button>
    </div>
    
    <!-- 题目列表 -->
    <div class="problems-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="userProblems.length === 0" class="empty">您还没有创建任何题目</div>
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
  margin-bottom: 30px;
}

h1 {
  color: #333;
  font-size: 28px;
  margin: 0;
}

.create-btn {
  padding: 10px 20px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.create-btn:hover {
  background: #73d13d;
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
  color: #1890ff;
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
  background: #e8f5e9;
  color: #4caf50;
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
.toggle-btn,
.delete-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.view-btn {
  background: #1890ff;
  color: white;
}

.view-btn:hover {
  background: #40a9ff;
}

.edit-btn {
  background: #faad14;
  color: white;
}

.edit-btn:hover {
  background: #ffc53d;
}

.toggle-btn.public-action {
  background: #52c41a;
  color: white;
}

.toggle-btn.public-action:hover {
  background: #73d13d;
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
  color: #1890ff;
  border-color: #1890ff;
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
</style> 