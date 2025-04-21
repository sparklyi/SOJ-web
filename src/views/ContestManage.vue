<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {  getManageableContests } from '../api/contest'
import { message } from 'ant-design-vue'
import { getUserId } from '../utils/auth'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const createdContests = ref([])
const total = ref(0)
const userId = getUserId()

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10
})

// 获取用户可管理的比赛列表
const fetchContests = async () => {
  if (!userId) {
    message.error('请先登录')
    return
  }

  loading.value = true
  try {
    // 根据用户角色选择不同的API
    let res;
    res = await getManageableContests(userId, pagination);
    
    if (res.code === 200) {
      createdContests.value = res.data.detail || []
      total.value = res.data.count || 0
    } else {
      message.error(res.message || '获取比赛列表失败')
    }
  } catch (error) {
    console.error('获取比赛列表失败:', error)
    message.error('获取比赛列表失败')
  } finally {
    loading.value = false
  }
}

// 页面变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchContests()
}

// 每页数量变化
const handleSizeChange = () => {
  pagination.page = 1
  fetchContests()
}

// 创建新比赛
const createContest = () => {
  router.push('/contest-create')
}

// 进入比赛
const enterContest = (contestId) => {
  router.push(`/contest/${contestId}`)
}

// 编辑比赛
const editContest = (contestId) => {
  router.push(`/contest-edit/${contestId}`)
}

// 进入比赛管理页面
const manageContest = (contestId) => {
  router.push(`/contest-management/${contestId}`)
}

// 格式化时间
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 计算竞赛状态
const getContestStatus = (contest) => {
  if (!contest) return { status: '未知', class: '' }
  
  const now = new Date()
  const startTime = new Date(contest.start_time)
  const endTime = new Date(contest.end_time)
  
  if (now < startTime) {
    return { status: '即将开始', class: 'upcoming' }
  } else if (now >= startTime && now <= endTime) {
    return { status: '进行中', class: 'ongoing' }
  } else {
    return { status: '已结束', class: 'ended' }
  }
}

onMounted(() => {
  fetchContests()
})
</script>

<template>
  <div class="contests-manage-container">
    <div class="page-header">
      <h1>比赛管理</h1>
      <button class="create-btn" @click="createContest">创建新比赛</button>
    </div>
    
    <!-- 竞赛列表 -->
    <div class="contests-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="createdContests.length === 0" class="empty">您还没有创建任何比赛</div>
      <div v-else>
        <div v-for="contest in createdContests" :key="contest.ID" class="contest-card">
          <div class="contest-info">
            <div class="contest-header">
              <h2 class="contest-title">
                <span class="contest-id">ID: {{ contest.ID }}</span>
                {{ contest.name }}
              </h2>
              <div class="contest-tags">
                <span :class="['status-tag', getContestStatus(contest).class]">
                  {{ getContestStatus(contest).status }}
                </span>
                <span :class="['type-tag', contest.type === 'ACM' ? 'acm' : 'oi']">
                  {{ contest.type }}
                </span>
                <span :class="['public-tag', contest.public ? 'public' : 'private']">
                  {{ contest.public ? '公开' : '私有' }}
                </span>
                <span class="tag-badge">{{ contest.tag }}</span>
              </div>
            </div>
            <div class="contest-times">
              <div class="time-item">
                <span class="time-label">开始时间:</span>
                <span class="time-value">{{ formatDate(contest.start_time) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">结束时间:</span>
                <span class="time-value">{{ formatDate(contest.end_time) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">创建时间:</span>
                <span class="time-value">{{ formatDate(contest.CreatedAt) }}</span>
              </div>
            </div>
           
          </div>
          <div class="contest-action">
            <button 
              class="enter-btn" 
              @click="enterContest(contest.ID)"
            >
              进入比赛
            </button>
            <button 
              class="edit-btn" 
              @click="editContest(contest.ID)"
              :disabled="getContestStatus(contest).status === '进行中'"
            >
              编辑比赛
            </button>
            <button 
              class="manage-btn" 
              @click="manageContest(contest.ID)"
            >
              比赛管理
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
.contests-manage-container {
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

.contests-list {
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

.contest-card {
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

.contest-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.contest-info {
  flex: 1;
}

.contest-header {
  margin-bottom: 15px;
}

.contest-title {
  font-size: 20px;
  margin: 0 0 10px 0;
  color: #1890ff;
}

.contest-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status-tag,
.type-tag,
.public-tag,
.tag-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.upcoming {
  background: #e3f2fd;
  color: #2196f3;
}

.status-tag.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}

.status-tag.ended {
  background: #f5f5f5;
  color: #9e9e9e;
}

.type-tag.acm {
  background: #fff3e0;
  color: #ff9800;
}

.type-tag.oi {
  background: #e8eaf6;
  color: #3f51b5;
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

.contest-id {
  font-size: 14px;
  color: #999;
  margin-right: 10px;
}

.contest-times {
  margin-bottom: 15px;
}

.time-item {
  margin-bottom: 8px;
}

.time-label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
}

.time-value {
  color: #333;
}

.contest-desc {
  margin-bottom: 10px;
}

.desc-label {
  font-weight: 500;
  color: #666;
  margin-bottom: 5px;
}

.desc-content {
  background: #f8f8f8;
  padding: 10px;
  border-radius: 4px;
  color: #333;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}

.contest-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
  min-width: 120px;
}

.enter-btn,
.edit-btn,
.manage-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.enter-btn {
  background: #1890ff;
  color: white;
}

.enter-btn:hover {
  background: #40a9ff;
}

.edit-btn {
  background: #faad14;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #ffc53d;
}

.manage-btn {
  background: #722ed1;
  color: white;
}

.manage-btn:hover {
  background: #9254de;
}

.edit-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
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