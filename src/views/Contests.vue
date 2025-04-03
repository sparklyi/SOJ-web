<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getContests, getUserApply, applyContest, cancelApply } from '../api/contest'
import { message, Modal } from 'ant-design-vue'
import { getUserId } from '../utils/auth'
import { useUserStore } from '../store/user'

const router = useRouter()
const userStore = useUserStore()
const currentUserId = getUserId()

// 竞赛数据
const contestsList = ref([])
const total = ref(0)
const loading = ref(false)

// 分页参数
const pagination = reactive({
  page: 1,
  size: 5
})

// 筛选条件
const filters = reactive({
  id: '',
  name: '',
  tag: '',
  type: '',
  public: ''
})

// tag选项
const tagOptions = [
  { value: 'Div 1', label: 'Div 1' },
  { value: 'Div 2', label: 'Div 2' },
  { value: 'Div 3', label: 'Div 3' },
  { value: '教学赛', label: '教学赛' },
  { value: '周赛', label: '周赛' }
]

// 竞赛类型选项
const typeOptions = [
  { value: 'ACM', label: 'ACM' },
  { value: 'OI', label: 'OI' }
]

// 公开选项
const publicOptions = [
  { value: true, label: '公开' },
  { value: false, label: '私有' }
]

// 竞赛报名相关
const applyLoading = ref({})
const cancelLoading = ref({})
const checkingApply = ref({})
const userApplyStatus = ref({})

// 报名表单
const applyDialogVisible = ref(false)
const currentContestId = ref(null)
const currentContest = ref(null)
const applyForm = reactive({
  name: '',
  email: '',
  code: ''
})

// 获取竞赛列表
const fetchContests = async () => {
  loading.value = true
  try {
    const params = {
      ...filters,
      page: pagination.page,
      size: pagination.size
    }
    
    const res = await getContests(params)
    if (res.code === 200) {
      contestsList.value = res.data.detail || []
      total.value = res.data.count || 0
    } else {
      message.error(res.message || '获取竞赛列表失败')
    }
  } catch (error) {
    console.error('获取竞赛列表失败:', error)
    message.error('获取竞赛列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  Object.keys(filters).forEach(key => {
    filters[key] = ''
  })
  pagination.page = 1
  fetchContests()
}

// 应用筛选
const applyFilter = () => {
  pagination.page = 1
  fetchContests()
}

// 页面变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchContests()
}

// 每页数量变化
const handleSizeChange = () => {
  // 确保pagination.size是数字类型
  pagination.size = Number(pagination.size)
  pagination.page = 1
  fetchContests()
}

// 进入竞赛前检查报名状态
const enterContest = async (contest) => {
  // 如果是创建者直接进入
  if (currentUserId && contest.user_id === Number(currentUserId)) {
    // 根据比赛时间判断跳转去向
    const now = new Date()
    const startTime = new Date(contest.start_time)
    
    if (now < startTime) {
      // 未到比赛时间，进入倒计时页面
      router.push(`/contest/${contest.ID}/waiting`)
    } else {
      // 已到比赛时间，直接进入
      router.push(`/contest/${contest.ID}`)
    }
    return
  }
  
  // 检查是否登录
  if (!currentUserId) {
    message.warning('请先登录后再进入竞赛')
    router.push(`/login?redirect=/contests`)
    return
  }
  
  // 检查是否已报名
  await checkApplyStatus(contest.ID)
  
  if (userApplyStatus.value[contest.ID]) {
    // 已报名，根据比赛时间判断跳转去向
    const now = new Date()
    const startTime = new Date(contest.start_time)
    
    if (now < startTime) {
      // 未到比赛时间，进入倒计时页面
      router.push(`/contest/${contest.ID}/waiting`)
    } else {
      // 已到比赛时间，直接进入
      router.push(`/contest/${contest.ID}`)
    }
  } else {
    // 未报名，提示报名
    message.warning('您尚未报名该竞赛，请先报名')
  }
}

// 检查是否已报名竞赛
const checkApplyStatus = async (contestId) => {
  if (!currentUserId) {
    message.warning('请先登录')
    router.push('/login')
    return false
  }
  
  if (checkingApply.value[contestId]) return
  
  checkingApply.value[contestId] = true
  try {
    const res = await getUserApply(currentUserId, contestId)
    if (res.code === 200 && res.data) {
      // 已报名
      userApplyStatus.value[contestId] = res.data
      return true
    } else if (res.code === 404) {
      // 未报名
      userApplyStatus.value[contestId] = null
      return false
    }
  } catch (error) {
    console.error('获取报名状态失败:', error)
    return false
  } finally {
    checkingApply.value[contestId] = false
  }
}

// 显示报名对话框
const showApplyDialog = (contest) => {
  if (!currentUserId) {
    message.warning('请先登录')
    router.push('/login')
    return
  }
  
  currentContestId.value = contest.ID
  currentContest.value = contest
  
  // 如果用户已报名，填充已有的报名信息
  if (userApplyStatus.value[contest.ID]) {
    applyForm.name = userApplyStatus.value[contest.ID].name || ''
    applyForm.email = userApplyStatus.value[contest.ID].email || ''
    if (!contest.public) {
      applyForm.code = userApplyStatus.value[contest.ID].code || ''
    }
  } else {
    // 否则使用用户名，其他字段清空
    applyForm.name = userStore.username || ''
    applyForm.email = ''
    applyForm.code = ''
  }
  
  applyDialogVisible.value = true
}

// 报名竞赛
const handleApplyContest = async () => {
  // 表单验证
  if (!applyForm.name) {
    message.warning('请输入姓名')
    return
  }
  
  if (!applyForm.email) {
    message.warning('请输入邮箱')
    return
  }
  
  // 如果是私有竞赛，且是首次报名，需要填写邀请码
  if (currentContest.value && !currentContest.value.public && !userApplyStatus.value[currentContestId.value] && !applyForm.code) {
    message.warning('请输入邀请码')
    return
  }
  
  applyLoading.value[currentContestId.value] = true
  try {
    const data = {
      contest_id: Number(currentContestId.value),
      name: applyForm.name,
      email: applyForm.email
    }
    
    // 如果已经报名，添加报名ID
    if (userApplyStatus.value[currentContestId.value]) {
      data.id = userApplyStatus.value[currentContestId.value].ID
    }
    
    // 如果是私有竞赛且首次报名，添加邀请码
    if (currentContest.value && !currentContest.value.public && !userApplyStatus.value[currentContestId.value]) {
      data.code = applyForm.code
    }
    
    const res = await applyContest(data)
    if (res.code === 200) {
      message.success(userApplyStatus.value[currentContestId.value] ? '更新报名信息成功' : '报名成功')
      applyDialogVisible.value = false
      // 更新用户报名信息
      userApplyStatus.value[currentContestId.value] = res.data
    } else {
      message.error(res.message || (userApplyStatus.value[currentContestId.value] ? '更新报名信息失败' : '报名失败'))
    }
  } catch (error) {
    console.error(userApplyStatus.value[currentContestId.value] ? '更新报名信息失败' : '报名失败', error)
    message.error(userApplyStatus.value[currentContestId.value] ? '更新报名信息失败' : '报名失败')
  } finally {
    applyLoading.value[currentContestId.value] = false
  }
}

// 取消报名
const handleCancelApply = (contestId) => {
  if (!userApplyStatus.value[contestId]) return
  
  Modal.confirm({
    title: '确认取消报名',
    content: '您确定要取消报名此竞赛吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      cancelLoading.value[contestId] = true
      try {
        const res = await cancelApply(userApplyStatus.value[contestId].ID)
        if (res.code === 200) {
          message.success('取消报名成功')
          userApplyStatus.value[contestId] = null
        } else {
          message.error(res.message || '取消报名失败')
        }
      } catch (error) {
        console.error('取消报名失败:', error)
        message.error('取消报名失败')
      } finally {
        cancelLoading.value[contestId] = false
      }
    }
  })
}

// 前往竞赛管理
const goToContestManage = (contestId) => {
  router.push(`/admin/contest/${contestId}`)
}

// 前往个人设置页面
const goToSettings = () => {
  router.push('/settings')
}

// 检查当前用户是否是竞赛创建者
const isContestCreator = (contest) => {
  return currentUserId && contest.user_id === Number(currentUserId)
}

// 检查竞赛是否未开始
const isBeforeStart = (contest) => {
  const now = new Date()
  const startTime = new Date(contest.start_time)
  return now < startTime
}

// 初始化加载时获取所有竞赛的报名状态
const fetchAllApplyStatus = async () => {
  if (!currentUserId || !contestsList.value.length) return
  
  for (const contest of contestsList.value) {
    await checkApplyStatus(contest.ID)
  }
}

// 格式化时间
const formatDate = (dateStr) => {
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 计算竞赛状态
const getContestStatus = (contest) => {
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

// 计算倒计时
const getCountdown = (startTime) => {
  const now = new Date()
  const start = new Date(startTime)
  const diff = start - now
  
  if (diff <= 0) return '已开始'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}天${hours}小时后开始`
  } else if (hours > 0) {
    return `${hours}小时${minutes}分钟后开始`
  } else {
    return `${minutes}分钟后开始`
  }
}

onMounted(() => {
  fetchContests()
})

// 当竞赛列表加载完成后，获取报名状态
watch(contestsList, () => {
  if (currentUserId && contestsList.value.length > 0) {
    fetchAllApplyStatus()
  }
}, { immediate: false })
</script>

<template>
  <div class="contests-container">
    <h1>竞赛列表</h1>
    
    <!-- 筛选面板 -->
    <div class="filters">
      <div class="search-box">
        <input 
          v-model="filters.name" 
          type="text" 
          placeholder="搜索竞赛名称..." 
          @keyup.enter="applyFilter"
        />
      </div>
      <div class="filter-box">
        <select v-model="filters.tag">
          <option value="">所有标签</option>
          <option v-for="option in tagOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="filter-box">
        <select v-model="filters.type">
          <option value="">所有类型</option>
          <option v-for="option in typeOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="filter-box">
        <select v-model="filters.public">
          <option value="">公开/私有</option>
          <option v-for="option in publicOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
      <div class="filter-box">
        <input 
          v-model="filters.id" 
          type="text" 
          placeholder="竞赛ID" 
          @keyup.enter="applyFilter"
        />
      </div>
      <button class="search-btn" @click="applyFilter">搜索</button>
      <button class="reset-btn" @click="resetFilters">重置</button>
    </div>
    
    <!-- 竞赛列表 -->
    <div class="contests-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="contestsList.length === 0" class="empty">暂无竞赛数据</div>
      <div v-else>
        <div v-for="contest in contestsList" :key="contest.ID" class="contest-card">
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
            <div class="contest-details">
              <div class="time-info">
                <div class="time-item">
                  <span class="time-label">开始时间:</span>
                  <span class="time-value bold">{{ formatDate(contest.start_time) }}</span>
                </div>
                <div class="time-item">
                  <span class="time-label">结束时间:</span>
                  <span class="time-value bold">{{ formatDate(contest.end_time) }}</span>
                </div>
              </div>
              <div class="sponsor-info">
                <span class="sponsor-label">主办方:</span>
                <span class="sponsor-value">{{ contest.sponsor }}</span>
              </div>
              
              <!-- 报名状态 -->
              <div v-if="userApplyStatus[contest.ID]" class="apply-status-display">
                <div class="apply-badge">已报名</div>
                <div class="apply-info">
                  <span>{{ userApplyStatus[contest.ID].name }}</span>
                  <button class="edit-btn" @click="showApplyDialog(contest)">
                    编辑报名信息
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="contest-action">
            <!-- 如果是创建者显示管理按钮 -->
            <button 
              v-if="isContestCreator(contest)" 
              class="manage-btn" 
              @click="goToContestManage(contest.ID)"
            >
              竞赛管理
            </button>
            
            <!-- 如果未到比赛开始时间且未报名，显示报名按钮 -->
            <button 
              v-if="currentUserId && isBeforeStart(contest) && !userApplyStatus[contest.ID] && !checkingApply[contest.ID]" 
              class="apply-btn" 
              @click="showApplyDialog(contest)"
              :disabled="applyLoading[contest.ID]"
            >
              {{ applyLoading[contest.ID] ? '报名中...' : '报名竞赛' }}
            </button>
            
            <!-- 如果已报名且未开始，显示取消报名按钮 -->
            <button 
              v-if="currentUserId && isBeforeStart(contest) && userApplyStatus[contest.ID] && !checkingApply[contest.ID]" 
              class="cancel-btn" 
              @click="handleCancelApply(contest.ID)"
              :disabled="cancelLoading[contest.ID]"
            >
              {{ cancelLoading[contest.ID] ? '取消中...' : '取消报名' }}
            </button>
            
            <!-- 正在加载报名状态 -->
            <button 
              v-if="checkingApply[contest.ID]" 
              class="loading-btn" 
              disabled
            >
              检查报名状态...
            </button>
            
            <!-- 进入竞赛按钮，已报名或创建者可点击 -->
            <button 
              class="enter-btn" 
              @click="enterContest(contest)"
              :disabled="!isContestCreator(contest) && !userApplyStatus[contest.ID]"
            >
              进入竞赛
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
        第 {{ pagination.page }} 页 / 共 {{ Math.ceil(total / pagination.size) }} 页
            </span>
      <button 
        class="page-btn"
        :disabled="pagination.page >= Math.ceil(total / pagination.size)"
        @click="handlePageChange(pagination.page + 1)"
      >
        下一页
      </button>
      <span class="total-info">
        共 {{ total }} 条记录
            </span>
      <div class="page-size-selector">
        <select v-model="pagination.size" @change="handleSizeChange">
          <option :value="5">5条/页</option>
          <option :value="10">10条/页</option>
          <option :value="20">20条/页</option>
          <option :value="50">50条/页</option>
        </select>
      </div>
    </div>
    
    <!-- 报名竞赛对话框 -->
    <div v-if="applyDialogVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ userApplyStatus[currentContestId] ? '编辑报名信息' : '报名竞赛' }}</h3>
          <button class="close-btn" @click="applyDialogVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>姓名</label>
            <input 
              v-model="applyForm.name" 
              type="text" 
              placeholder="请输入姓名"
              class="form-control"
            />
          </div>
          <div class="form-group">
            <label>邮箱</label>
            <input 
              v-model="applyForm.email" 
              type="email" 
              placeholder="请输入邮箱"
              class="form-control"
            />
          </div>
          <div class="form-group" v-if="currentContest && !currentContest.public && !userApplyStatus[currentContestId]">
            <label>邀请码</label>
            <input 
              v-model="applyForm.code" 
              type="text" 
              placeholder="请输入邀请码"
              class="form-control"
            />
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="applyDialogVisible = false">取消</button>
            <button 
              class="apply-btn" 
              @click="handleApplyContest" 
              :disabled="applyLoading[currentContestId]"
            >
              {{ applyLoading[currentContestId] ? '提交中...' : userApplyStatus[currentContestId] ? '更新信息' : '确认报名' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contests-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
  background: #fff;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-box {
  flex: 1;
  min-width: 200px;
}

.search-box input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.filter-box select,
.filter-box input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  min-width: 120px;
}

.search-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.search-btn:hover {
  background: #40a9ff;
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
  background: #e8e8e8;
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

.contest-details {
  display: flex;
  flex-direction: column;
  color: #666;
  font-size: 14px;
  gap: 8px;
}

.time-info {
  display: flex;
  gap: 20px;
}

.time-item {
  margin-bottom: 4px;
}

.time-label,
.sponsor-label {
  font-weight: 500;
  margin-right: 8px;
}

.sponsor-value {
  font-weight: 600;
  color: #333;
}

.sponsor-info {
  margin-top: 4px;
}

.contest-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
  min-width: 120px;
}

.manage-btn,
.apply-btn,
.cancel-btn,
.enter-btn,
.loading-btn,
.edit-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  text-align: center;
}

.manage-btn {
  background: #1890ff;
  color: white;
}

.manage-btn:hover {
  background: #40a9ff;
}

.apply-btn {
  background: #52c41a;
  color: white;
}

.apply-btn:hover {
  background: #73d13d;
}

.apply-btn:disabled {
  background: #b7eb8f;
  cursor: not-allowed;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.cancel-btn:hover:not(:disabled) {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.cancel-btn:disabled {
  background: #f5f5f5;
  color: #d9d9d9;
  cursor: not-allowed;
}

.enter-btn {
  background: #1890ff;
  color: white;
}

.enter-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.enter-btn:disabled {
  background: #f0f0f0;
  color: #d9d9d9;
  cursor: not-allowed;
}

.loading-btn {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.edit-btn {
  background: #f0f0f0;
  color: #1890ff;
  border: 1px solid #1890ff;
  padding: 3px 8px;
  font-size: 12px;
  margin-left: 10px;
}

.edit-btn:hover {
  background: #e6f7ff;
}

/* 报名状态样式 */
.apply-status-display {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.apply-badge {
  background: #52c41a;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.apply-info {
  color: #333;
  font-size: 14px;
  display: flex;
  align-items: center;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  font-size: 20px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-control:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-btn {
  padding: 6px 12px;
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
  color: #d9d9d9;
  cursor: not-allowed;
}

.page-info,
.total-info {
  color: #666;
  font-size: 14px;
}

.page-size-selector select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.countdown {
  background: #f0f0f0;
  color: #ff9800;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  border: 1px solid #ff9800;
}

.contest-id {
  display: inline-block;
  color: #666;
  font-size: 14px;
  background: #f5f5f5;
  padding: 2px 8px;
  border-radius: 4px;
  margin-right: 8px;
  font-weight: normal;
  vertical-align: middle;
}

.time-value.bold {
  font-weight: 700;
  color: #1890ff;
}

@media (max-width: 768px) {
  .contests-container {
    padding: 15px;
  }
  
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-box,
  .search-box {
    width: 100%;
  }
  
  .contest-card {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .contest-action {
    margin-left: 0;
    margin-top: 15px;
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .contest-action button {
    flex: 1;
    min-width: 120px;
  }
  
  .time-info {
    flex-direction: column;
    gap: 5px;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 10px;
  }
}
</style> 
