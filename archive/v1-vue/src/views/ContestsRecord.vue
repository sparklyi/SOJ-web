<script setup>
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'

const contests = ref([])
const loading = ref(true)
const error = ref(null)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)



// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'upcoming': '未开始',
    'ongoing': '进行中',
    'finished': '已结束'
  }
  return statusMap[status] || '未知'
}

// 获取排名百分比
const getRankPercentile = (rank, total) => {
  if (!total) return 0
  return ((rank / total) * 100).toFixed(1)
}

// 获取排名颜色
const getRankColor = (percentile) => {
  const percent = parseFloat(percentile)
  if (percent <= 10) return '#f5222d'  // 前10%，红色
  if (percent <= 20) return '#fa8c16'  // 前20%，橙色
  if (percent <= 50) return '#52c41a'  // 前50%，绿色
  return '#8c8c8c'                     // 其他，灰色
}

// 页面变化
const handlePageChange = (page) => {
  currentPage.value = page
  fetchContestsRecord(page, pageSize.value)
}

// 初始化
onMounted(() => {
  fetchContestsRecord(currentPage.value, pageSize.value)
})

// 查看竞赛详情
const viewContestDetail = (id) => {
  // 导航到竞赛详情页
  console.log('查看竞赛详情:', id)
  message.info('竞赛详情功能尚未实现')
}
</script>

<template>
  <div class="contests-container">
    <div class="contests-card">
      <h1>我的竞赛记录</h1>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="error" class="error">
        {{ error }}
      </div>
      
      <div v-else>
        <div class="contests-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>竞赛名称</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>排名</th>
                <th>得分</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contest in contests" :key="contest.id">
                <td>{{ contest.id }}</td>
                <td>
                  <a href="#" class="contest-link">
                    {{ contest.title }}
                  </a>
                </td>
                <td>{{ contest.startTime }}</td>
                <td>{{ contest.endTime }}</td>
                <td>{{ getStatusText(contest.status) }}</td>
                <td>
                  <span 
                    class="rank" 
                    :style="{ color: getRankColor(getRankPercentile(contest.rank, contest.totalParticipants)) }"
                  >
                    {{ contest.rank }}/{{ contest.totalParticipants }}
                    <span class="percentile">
                      (前 {{ getRankPercentile(contest.rank, contest.totalParticipants) }}%)
                    </span>
                  </span>
                </td>
                <td>{{ contest.score }}</td>
                <td>
                  <button @click="viewContestDetail(contest.id)" class="view-btn">
                    查看
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <div class="page-info">
            总共 {{ total }} 场竞赛，当前 {{ currentPage }}/{{ Math.ceil(total / pageSize) }} 页
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
.contests-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.contests-card {
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

.contests-table {
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

.contest-link {
  color: #1890ff;
  text-decoration: none;
}

.contest-link:hover {
  text-decoration: underline;
}

.rank {
  font-weight: 500;
}

.percentile {
  font-size: 12px;
  opacity: 0.8;
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