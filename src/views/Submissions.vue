<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const submissions = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 模拟数据
const mockSubmissions = [
  { id: 1, problemId: 1001, problemTitle: '两数之和', status: 'AC', language: 'C++', time: '100ms', memory: '10MB', submitTime: '2023-05-15 13:45:22' },
  { id: 2, problemId: 1002, problemTitle: '三数之和', status: 'WA', language: 'Java', time: '150ms', memory: '15MB', submitTime: '2023-05-14 10:23:45' },
  { id: 3, problemId: 1003, problemTitle: '最长回文子串', status: 'TLE', language: 'Python', time: '300ms', memory: '25MB', submitTime: '2023-05-13 18:12:34' },
  { id: 4, problemId: 1004, problemTitle: '合并两个有序链表', status: 'AC', language: 'JavaScript', time: '80ms', memory: '12MB', submitTime: '2023-05-12 09:56:11' },
  { id: 5, problemId: 1005, problemTitle: '二叉树的最大深度', status: 'MLE', language: 'Go', time: '120ms', memory: '50MB', submitTime: '2023-05-11 14:32:50' },
]

// 获取提交记录
const fetchSubmissions = async (page = 1, size = 10) => {
  try {
    loading.value = true
    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 这里应该是实际的API调用
    // const res = await getSubmissions(page, size)
    // if (res.code === 200) {
    //   submissions.value = res.data.items
    //   total.value = res.data.total
    // }
    
    // 使用模拟数据
    submissions.value = mockSubmissions
    total.value = mockSubmissions.length + 15 // 模拟总数
    
  } catch (err) {
    error.value = err.message || '获取提交记录失败'
    message.error('获取提交记录失败')
  } finally {
    loading.value = false
  }
}

// 获取状态样式
const getStatusStyle = (status) => {
  const styles = {
    'AC': { color: '#52c41a', text: '通过' },
    'WA': { color: '#f5222d', text: '答案错误' },
    'TLE': { color: '#fa8c16', text: '超时' },
    'MLE': { color: '#722ed1', text: '内存超限' },
    'RE': { color: '#eb2f96', text: '运行错误' },
    'CE': { color: '#faad14', text: '编译错误' },
  }
  return styles[status] || { color: '#999999', text: '未知' }
}

// 页面变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchSubmissions(page, pageSize.value)
}

// 初始化
onMounted(() => {
  fetchSubmissions(currentPage.value, pageSize.value)
})

// 查看提交详情
const viewSubmissionDetail = (id) => {
  // 导航到提交详情页
  console.log('查看提交详情:', id)
  message.info('提交详情功能尚未实现')
}
</script>

<template>
  <div class="submissions-container">
    <div class="submissions-card">
      <h1>我的提交记录</h1>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
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
                <th>提交时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="submission in submissions" :key="submission.id">
                <td>{{ submission.id }}</td>
                <td>
                  <a href="#" class="problem-link">
                    {{ submission.problemId }} - {{ submission.problemTitle }}
                  </a>
                </td>
                <td>
                  <span class="status-tag" :style="{ color: getStatusStyle(submission.status).color }">
                    {{ getStatusStyle(submission.status).text }}
                  </span>
                </td>
                <td>{{ submission.language }}</td>
                <td>{{ submission.time }}</td>
                <td>{{ submission.memory }}</td>
                <td>{{ submission.submitTime }}</td>
                <td>
                  <button @click="viewSubmissionDetail(submission.id)" class="view-btn">
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
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
              :disabled="currentPage >= Math.ceil(total / pageSize)"
              class="page-btn"
            >
              下一页
            </button>
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

.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #f5222d;
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
}

.page-info {
  color: #666;
}

.page-controls {
  display: flex;
  gap: 10px;
}

.page-btn {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  border-color: #1890ff;
  color: #1890ff;
}

.page-btn:disabled {
  color: #d9d9d9;
  background-color: #f5f5f5;
  cursor: not-allowed;
}
</style> 