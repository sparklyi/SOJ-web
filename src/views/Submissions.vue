<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getSubmissionList, getSubmissionDetail, getLanguages } from '../api/problem'
import { getUserId } from '../utils/auth'
import { useRoute, useRouter } from 'vue-router'

const submissions = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const pageSize = ref(50)  // 默认每页显示50条
const pageSizeOptions = [10, 20, 50, 100]
const total = ref(0)
const showSubmissionDetail = ref(false)
const submissionDetail = ref(null)
const submissionDetailLoading = ref(false)

// 筛选条件
const filters = reactive({
  problem_id: '',
  language_id: null,
  contest_id: ''
})

// 语言选项
const languageOptions = ref([])
const loadingLanguages = ref(false)

// 获取语言列表
const fetchLanguages = async () => {
  try {
    loadingLanguages.value = true
    const res = await getLanguages()
    if (res.code === 200) {
      languageOptions.value = res.data.map(lang => ({
        label: lang.name,
        value: lang.id
      }))
    } else {
      message.error(res.message || '获取语言列表失败')
    }
  } catch (error) {
    console.error('获取语言列表失败:', error)
    message.error(error.response?.data?.message || '获取语言列表失败')
  } finally {
    loadingLanguages.value = false
  }
}

// 获取提交记录
const fetchSubmissions = async (page = 1, size = pageSize.value) => {
  try {
    loading.value = true
    
    // 准备请求参数
    const requestData = {
      user_id: Number(getUserId()),
      page: page,
      page_size: size
    }
    
    // 添加筛选条件
    if (filters.problem_id && !isNaN(Number(filters.problem_id))) {
      requestData.problem_id = Number(filters.problem_id)
    }
    
    if (filters.language_id) {
      requestData.language_id = Number(filters.language_id)
    }
    
    if (filters.contest_id && !isNaN(Number(filters.contest_id))) {
      requestData.contest_id = Number(filters.contest_id)
    }
    
    // 调用API
    const res = await getSubmissionList(requestData)
    
    if (res.code === 200) {
      submissions.value = res.data.detail || []
      total.value = res.data.count || 0
    } else {
      message.error(res.message || '获取提交记录失败')
    }
  } catch (err) {
    error.value = err.message || '获取提交记录失败'
    message.error(err.response?.data?.message || '获取提交记录失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.problem_id = ''
  filters.language_id = null
  filters.contest_id = ''
  fetchSubmissions(1, pageSize.value)
  currentPage.value = 1
}

// 应用筛选条件
const applyFilters = () => {
  fetchSubmissions(1, pageSize.value)
  currentPage.value = 1
}

// 更改每页显示数量
const handlePageSizeChange = (size) => {
  pageSize.value = size
  fetchSubmissions(1, size)
  currentPage.value = 1
}

// 获取状态样式
const getStatusStyle = (status) => {
  const styles = {
    'Accepted': { color: '#52c41a', text: '通过' },
    'Wrong Answer': { color: '#f5222d', text: '答案错误' },
    'Time Limit Exceeded': { color: '#fa8c16', text: '超时' },
    'Memory Limit Exceeded': { color: '#722ed1', text: '内存超限' },
    'Runtime Error': { color: '#eb2f96', text: '运行错误' },
    'Compilation Error': { color: '#faad14', text: '编译错误' },
    'Unknown Error': { color: '#999999', text: '未知错误' }
  }
  return styles[status] || { color: '#999999', text: status }
}

// 页面变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchSubmissions(page, pageSize.value)
}

// 获取提交详情
const viewSubmissionDetail = async (id) => {
  try {
    submissionDetailLoading.value = true
    const res = await getSubmissionDetail(id)
    
    if (res.code === 200) {
      submissionDetail.value = res.data
      showSubmissionDetail.value = true
    } else {
      message.error(res.message || '获取提交详情失败')
    }
  } catch (error) {
    console.error('获取提交详情失败:', error)
    message.error(error.response?.data?.message || '获取提交详情失败')
  } finally {
    submissionDetailLoading.value = false
  }
}

// 关闭提交详情
const closeSubmissionDetail = () => {
  showSubmissionDetail.value = false
  submissionDetail.value = null
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 格式化内存显示
const formatMemory = (memoryInBytes) => {
  if (memoryInBytes < 1024) {
    return memoryInBytes + 'B'
  } else if (memoryInBytes < 1024 * 1024) {
    return (memoryInBytes / 1024).toFixed(2) + 'KB'
  } else {
    return (memoryInBytes / (1024 * 1024)).toFixed(2) + 'MB'
  }
}

// 路由实例
const route = useRoute()

// 初始化
onMounted(() => {
  fetchSubmissions(currentPage.value, pageSize.value)
  fetchLanguages()
})
</script>

<template>
  <div class="submissions-container">
    <div class="submissions-card">
      <h1>提交记录</h1>
      
      <!-- 筛选器 -->
      <div class="filter-container">
        <div class="filter-form">
          <div class="filter-item">
            <input 
              v-model="filters.problem_id" 
              type="number" 
              placeholder="输入题目ID" 
              class="filter-input"
            />
          </div>
          
          <div class="filter-item">
            <select v-model="filters.language_id" class="filter-select">
              <option :value="null">全部语言</option>
              <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>
          
          <div class="filter-item">
            <input 
              v-model="filters.contest_id" 
              type="number" 
              placeholder="输入竞赛ID" 
              class="filter-input"
            />
          </div>
          
          <div class="filter-actions">
            <button @click="applyFilters" class="apply-btn">筛选</button>
            <button @click="resetFilters" class="reset-btn">重置</button>
          </div>
        </div>
      </div>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else-if="submissions.length === 0" class="empty">
        暂无提交记录
      </div>
      
      <div v-else>
        <div class="submissions-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>题目</th>
                <th>状态</th>
                <th>语言</th>
                <th>执行时间</th>
                <th>内存</th>
                <th>竞赛</th>
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in submissions" :key="submission.ID">
                <td>{{ submission.ID }}</td>
                <td>
                  <a :href="`/problem/${submission.problem_id}`" class="problem-link">
                    {{ submission.problem_id }} - {{ submission.problem_name }}
                  </a>
                </td>
                <td>
                  <span class="status-tag" :style="{ color: getStatusStyle(submission.status).color }">
                    {{ getStatusStyle(submission.status).text }}
                  </span>
                </td>
                <td>{{ submission.language }}</td>
                <td>{{ submission.time ? submission.time + 's' : '-' }}</td>
                <td>{{ formatMemory(submission.memory) }}</td>
                <td>{{ submission.contest_id || '-' }}</td>
                <td>{{ formatDateTime(submission.CreatedAt) }}</td>
                <td>
                  <button @click="viewSubmissionDetail(submission.ID)" class="view-btn">
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <div class="page-size-selector">
            
            <select v-model="pageSize" @change="handlePageSizeChange(pageSize)" class="page-size-select">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
            </select>
            条
          </div>
          
          <div class="page-info">
            总共 {{ total }} 条记录，当前 {{ currentPage }}/{{ Math.ceil(total / pageSize) }} 页
          </div>
          
          <div class="page-controls">
            <button 
              @click="handlePageChange(currentPage - 1)"
              :disabled="currentPage <= 1"
              class="page-btn"
            >
              上一页
            </button>
            <button 
              @click="handlePageChange(currentPage + 1)"
              :disabled="currentPage >= Math.ceil(total / pageSize) || total === 0"
              class="page-btn"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提交详情对话框 -->
    <div class="submission-detail-modal" v-if="showSubmissionDetail">
      <div class="modal-overlay" @click="closeSubmissionDetail"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>提交详情 #{{ submissionDetail?.ID }}</h3>
          <button class="close-btn" @click="closeSubmissionDetail">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
        <div v-if="submissionDetailLoading" class="modal-loading">加载中...</div>
        <div v-else class="modal-body">
          <div class="detail-info">
            <div class="detail-item">
              <span class="label">题目:</span>
              <span class="value">{{ submissionDetail?.problem_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">用户:</span>
              <span class="value">{{ submissionDetail?.user_name }}</span>
            </div>
            <div class="detail-item">
              <span class="label">语言:</span>
              <span class="value">{{ submissionDetail?.language }}</span>
            </div>
            <div class="detail-item">
              <span class="label">状态:</span>
              <span class="value" :style="{ color: getStatusStyle(submissionDetail?.status).color }">
                {{ getStatusStyle(submissionDetail?.status).text }}
              </span>
            </div>
            <div class="detail-item" v-if="submissionDetail?.time">
              <span class="label">运行时间:</span>
              <span class="value">{{ submissionDetail?.time }}s</span>
            </div>
            <div class="detail-item" v-if="submissionDetail?.memory">
              <span class="label">内存占用:</span>
              <span class="value">{{ formatMemory(submissionDetail?.memory) }}</span>
            </div>
            <div class="detail-item" v-if="submissionDetail?.contest_id">
              <span class="label">竞赛:</span>
              <span class="value">{{ submissionDetail?.contest_id }}</span>
            </div>
            <div class="detail-item">
              <span class="label">提交时间:</span>
              <span class="value">{{ formatDateTime(submissionDetail?.CreatedAt) }}</span>
            </div>
          </div>
          <div class="code-container">
            <h4>源代码</h4>
            <pre class="source-code">{{ submissionDetail?.source_code }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submissions-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.submissions-card {
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

.loading, .error, .empty {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #f5222d;
}

.empty {
  color: #999;
  font-size: 16px;
}

/* 筛选器样式 */
.filter-container {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.filter-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-input {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 120px;
  font-size: 14px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  min-width: 180px;
  font-size: 14px;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.apply-btn, .reset-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.apply-btn {
  background: #1890ff;
  color: white;
}

.apply-btn:hover {
  background: #40a9ff;
}

.reset-btn {
  background: white;
  color: #666;
  border: 1px solid #d9d9d9;
}

.reset-btn:hover {
  color: #40a9ff;
  border-color: #40a9ff;
}

.submissions-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

th {
  font-weight: 600;
  background-color: #fafafa;
}

tr:hover {
  background-color: #f5f5f5;
}

.problem-link {
  color: #1890ff;
  text-decoration: none;
}

.problem-link:hover {
  text-decoration: underline;
}

.status-tag {
  font-weight: 500;
}

.view-btn {
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s;
}

.view-btn:hover {
  background-color: #40a9ff;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;
  flex-wrap: wrap;
  gap: 10px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #666;
  font-size: 14px;
}

.page-size-select {
  padding: 5px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.page-info {
  color: #666;
  font-size: 14px;
}

.page-controls {
  display: flex;
  gap: 8px;
}

.page-btn {
  padding: 8px 16px;
  background: #f5f5f5;
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
  cursor: not-allowed;
  color: #d9d9d9;
}

/* 提交详情模态框 */
.submission-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.modal-content {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1002;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
}

.modal-loading {
  padding: 40px;
  text-align: center;
  color: #666;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 4px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-item .value {
  font-weight: 500;
  color: #333;
}

.code-container {
  margin-top: 16px;
}

.code-container h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.source-code {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .submissions-container {
    padding: 10px;
  }
  
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-item {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filter-input, .filter-select {
    width: 100%;
  }
  
  .filter-actions {
    margin-left: 0;
    margin-top: 16px;
    width: 100%;
    display: flex;
    justify-content: space-between;
  }
  
  .apply-btn, .reset-btn {
    flex: 1;
  }
  
  .submissions-table {
    overflow-x: auto;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
  
  .modal-content {
    width: 95%;
  }
}
</style> 