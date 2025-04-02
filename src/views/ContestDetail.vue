<script setup>
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  getContestDetail, 
  joinPrivateContest,
  applyContest,
  cancelApply,
  getUserApply 
} from '../api/contest'
import { message, Modal } from 'ant-design-vue'
import { getUserId } from '../utils/auth'
import { useUserStore } from '../store/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const contestId = computed(() => route.params.id)
const currentUserId = getUserId()

// 比赛详情数据
const contestDetail = ref(null)
const loading = ref(false)
const applyLoading = ref(false)
const cancelLoading = ref(false)
const accessDenied = ref(false)

// 当前活动标签页
const activeTab = ref('intro')

// 对话框控制
const joinDialogVisible = ref(false)
const joinCode = ref('')
const joinLoading = ref(false)

// 报名表单
const applyForm = reactive({
  name: '',
  email: '',
  code: ''
})

// 报名对话框控制
const applyDialogVisible = ref(false)

// 用户报名信息
const userApply = ref(null)
const checkingApply = ref(false)

// 计算当前时间是否小于比赛开始时间
const isBeforeStart = computed(() => {
  if (!contestDetail.value) return false
  const now = new Date()
  const startTime = new Date(contestDetail.value.start_time)
  return now < startTime
})

// 计算当前用户是否是竞赛创建者
const isContestCreator = computed(() => {
  if (!contestDetail.value || !currentUserId) return false
  return contestDetail.value.user_id === Number(currentUserId)
})

// 计算是否公开访问（非参赛者也可以看基本信息的竞赛）
const isPublicAccess = computed(() => {
  if (!contestDetail.value) return false
  return contestDetail.value.public
})

// 获取竞赛详情
const fetchContestDetail = async () => {
  loading.value = true
  try {
    const res = await getContestDetail(contestId.value)
    if (res.code === 200) {
      contestDetail.value = res.data
      // 解析题目集
      if (contestDetail.value.problem_set) {
        try {
          contestDetail.value.problemList = JSON.parse(contestDetail.value.problem_set)
        } catch (e) {
          contestDetail.value.problemList = []
          console.error('解析题目集失败:', e)
        }
      } else {
        contestDetail.value.problemList = []
      }
      
      // 获取用户报名信息
      if (currentUserId) {
        await fetchUserApply()
        
        // 检查用户是否有权限访问竞赛
        if (!isContestCreator.value && !userApply.value && !isPublicAccess.value) {
          accessDenied.value = true
          message.warning('您尚未报名该竞赛，请先报名')
          // 延迟返回竞赛列表页
          setTimeout(() => {
            router.push('/contests')
          }, 2000)
        }
      } else {
        // 未登录用户只能访问公开竞赛的基本信息
        if (!contestDetail.value.public) {
          accessDenied.value = true
          message.warning('私有竞赛需要登录并报名后访问')
          // 延迟返回竞赛列表页
          setTimeout(() => {
            router.push('/contests')
          }, 2000)
        }
      }
    } else {
      message.error(res.message || '获取竞赛详情失败')
      if (res.code === 403) {
        // 如果是私有竞赛且没有权限，显示加入对话框
        showJoinDialog()
      }
    }
  } catch (error) {
    console.error('获取竞赛详情失败:', error)
    message.error('获取竞赛详情失败')
  } finally {
    loading.value = false
  }
}

// 获取用户报名信息
const fetchUserApply = async () => {
  if (!currentUserId || !contestId.value) return
  
  checkingApply.value = true
  try {
    const res = await getUserApply(currentUserId, contestId.value)
    if (res.code === 200 && res.data) {
      // 已报名，有报名信息
      userApply.value = res.data
    } else if (res.code === 404) {
      // 未报名
      userApply.value = null
    } else {
      // 请求错误
      console.error('获取用户报名信息失败:', res.message)
      userApply.value = null
    }
  } catch (error) {
    console.error('获取用户报名信息失败:', error)
    userApply.value = null
  } finally {
    checkingApply.value = false
  }
}

// 显示加入竞赛对话框
const showJoinDialog = () => {
  joinDialogVisible.value = true
  joinCode.value = ''
}

// 加入私有竞赛
const handleJoinContest = async () => {
  if (!joinCode.value) {
    message.warning('请输入竞赛码')
    return
  }
  
  joinLoading.value = true
  try {
    const res = await joinPrivateContest(contestId.value, joinCode.value)
    if (res.code === 200) {
      message.success('加入竞赛成功')
      joinDialogVisible.value = false
      // 重新获取竞赛详情
      fetchContestDetail()
    } else {
      message.error(res.message || '加入竞赛失败')
    }
  } catch (error) {
    console.error('加入竞赛失败:', error)
    message.error('加入竞赛失败')
  } finally {
    joinLoading.value = false
  }
}

// 显示报名对话框
const showApplyDialog = () => {
  if (!contestDetail.value) return
  
  // 如果用户已报名，填充已有的报名信息
  if (userApply.value) {
    applyForm.name = userApply.value.name || ''
    applyForm.email = userApply.value.email || ''
    // 更新报名信息时不需要邀请码
    applyForm.code = ''
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
  
  // 如果是私有竞赛且首次报名，需要填写邀请码
  if (contestDetail.value && !contestDetail.value.public && !userApply.value && !applyForm.code) {
    message.warning('请输入邀请码')
    return
  }
  
  applyLoading.value = true
  try {
    const data = {
      contest_id: Number(contestId.value),
      name: applyForm.name,
      email: applyForm.email
    }
    
    // 如果已经报名，添加报名ID
    if (userApply.value) {
      data.id = userApply.value.ID
    }
    
    // 如果是私有竞赛且首次报名，添加邀请码
    if (contestDetail.value && !contestDetail.value.public && !userApply.value) {
      data.code = applyForm.code
    }
    
    const res = await applyContest(data)
    if (res.code === 200) {
      message.success(userApply.value ? '更新报名信息成功' : '报名成功')
      applyDialogVisible.value = false
      // 更新用户报名信息
      userApply.value = res.data
    } else {
      message.error(res.message || (userApply.value ? '更新报名信息失败' : '报名失败'))
    }
  } catch (error) {
    console.error(userApply.value ? '更新报名信息失败' : '报名失败:', error)
    message.error(userApply.value ? '更新报名信息失败' : '报名失败')
  } finally {
    applyLoading.value = false
  }
}

// 取消报名
const handleCancelApply = () => {
  if (!userApply.value) return
  
  Modal.confirm({
    title: '确认取消报名',
    content: '您确定要取消报名此竞赛吗？',
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      cancelLoading.value = true
      try {
        const res = await cancelApply(userApply.value.ID)
        if (res.code === 200) {
          message.success('取消报名成功')
          userApply.value = null
        } else {
          message.error(res.message || '取消报名失败')
        }
      } catch (error) {
        console.error('取消报名失败:', error)
        message.error('取消报名失败')
      } finally {
        cancelLoading.value = false
      }
    }
  })
}

// 前往竞赛管理页面
const goToContestManage = () => {
  router.push(`/admin/contest/${contestId.value}`)
}

// 格式化时间
const formatDate = (dateStr) => {
  if (!dateStr) return ''
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

// 前往题目详情
const goToProblem = (problem) => {
  router.push(`/problem/${problem.id}?contestId=${contestId.value}`)
}

// 当路由变化时，重新获取竞赛详情
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchContestDetail()
  }
})

onMounted(() => {
  fetchContestDetail()
})
</script>

<template>
  <div class="contest-detail-container">
    <div v-if="loading" class="loading">正在加载竞赛信息...</div>
    
    <template v-else-if="contestDetail && !accessDenied">
      <div class="contest-header">
        <div class="contest-title-section">
          <div class="title-info">
            <h1 class="contest-title">{{ contestDetail.name }}</h1>
            <div class="sponsor-tag">
              <span class="sponsor-label">主办方:</span>
              <span class="sponsor-value">{{ contestDetail.sponsor }}</span>
            </div>
          </div>
          
          <div class="contest-action-buttons">
            <!-- 如果未到比赛开始时间且未报名，显示报名按钮 -->
            <button 
              v-if="currentUserId && isBeforeStart && !userApply && !checkingApply" 
              class="apply-btn" 
              @click="showApplyDialog"
              :disabled="applyLoading"
            >
              {{ applyLoading ? '报名中...' : '报名竞赛' }}
            </button>
            
            <!-- 如果已报名且未开始，显示取消报名按钮 -->
            <button 
              v-if="currentUserId && isBeforeStart && userApply && !checkingApply" 
              class="cancel-btn" 
              @click="handleCancelApply"
              :disabled="cancelLoading"
            >
              {{ cancelLoading ? '取消中...' : '取消报名' }}
            </button>
            
            <!-- 正在加载报名状态 -->
            <button 
              v-if="checkingApply" 
              class="loading-btn" 
              disabled
            >
              检查报名状态...
            </button>
          </div>
        </div>
        
        <div class="contest-meta">
          <div class="contest-info-grid">
            <div class="info-item">
              <span class="info-label">竞赛类型</span>
              <span :class="['type-badge', contestDetail.type === 'ACM' ? 'acm' : 'oi']">
                {{ contestDetail.type }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">访问权限</span>
              <span :class="['access-badge', contestDetail.public ? 'public' : 'private']">
                {{ contestDetail.public ? '公开' : '私有' }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">竞赛状态</span>
              <span :class="['status-badge', getContestStatus(contestDetail).class]">
                {{ getContestStatus(contestDetail).status }}
              </span>
            </div>
            
            <div class="info-item">
              <span class="info-label">竞赛标签</span>
              <span class="tag-badge">{{ contestDetail.tag }}</span>
            </div>
          </div>
          
          <div class="time-info">
            <div class="time-item">
              <span class="time-label">开始时间:</span>
              <span class="time-value">{{ formatDate(contestDetail.start_time) }}</span>
            </div>
            <div class="time-item">
              <span class="time-label">结束时间:</span>
              <span class="time-value">{{ formatDate(contestDetail.end_time) }}</span>
            </div>
            <div class="time-item" v-if="contestDetail.freeze_time">
              <span class="time-label">封榜时间:</span>
              <span class="time-value">{{ formatDate(contestDetail.freeze_time) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 报名状态提示 -->
        <div v-if="userApply" class="apply-status">
          <div class="apply-info">
            <div class="apply-badge">已报名</div>
            <div class="apply-detail">
              <div class="apply-item">
                <span class="apply-label">姓名:</span>
                <span class="apply-value">{{ userApply.name }}</span>
              </div>
              <div class="apply-item">
                <span class="apply-label">邮箱:</span>
                <span class="apply-value">{{ userApply.email }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="contest-tabs">
        <div class="tab-list">
          <div 
            :class="['tab-item', activeTab === 'intro' ? 'active' : '']"
            @click="activeTab = 'intro'"
          >
            竞赛简介
          </div>
          <div 
            :class="['tab-item', activeTab === 'problems' ? 'active' : '']"
            @click="activeTab = 'problems'"
          >
            竞赛题目
          </div>
          <div 
            :class="['tab-item', activeTab === 'ranking' ? 'active' : '']"
            @click="activeTab = 'ranking'"
          >
            排行榜
          </div>
        </div>
        
        <div class="tab-content">
          <!-- 竞赛简介 -->
          <div v-if="activeTab === 'intro'" class="tab-pane">
            <div class="contest-description card">
              <div v-if="contestDetail.description" v-html="contestDetail.description" class="description-content"></div>
              <div v-else class="empty-description">
                <div class="empty-icon">📝</div>
                <div class="empty-text">暂无竞赛描述</div>
              </div>
            </div>
          </div>
          
          <!-- 竞赛题目 -->
          <div v-else-if="activeTab === 'problems'" class="tab-pane">
            <div class="problems-list card">
              <h2>题目列表</h2>
              
              <table v-if="contestDetail.problemList && contestDetail.problemList.length > 0" class="problems-table">
                <thead>
                  <tr>
                    <th class="id-column">题目ID</th>
                    <th class="name-column">题目名称</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="problem in contestDetail.problemList" :key="problem.id" @click="goToProblem(problem)" class="problem-row">
                    <td class="id-column">{{ problem.id }}</td>
                    <td class="name-column">{{ problem.name }}</td>
                  </tr>
                </tbody>
              </table>
              
              <div v-else class="empty-problems">
                <div class="empty-icon">📋</div>
                <div class="empty-text">暂无竞赛题目</div>
              </div>
            </div>
          </div>
          
          <!-- 排行榜 -->
          <div v-else-if="activeTab === 'ranking'" class="tab-pane">
            <div class="ranking-list card">
              <h2>排行榜</h2>
              
              <div class="empty-ranking">
                <div class="empty-icon">🏆</div>
                <div class="empty-text">排行榜功能即将上线</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    
    <div v-else-if="accessDenied" class="access-denied card">
      <div class="empty-icon">🔒</div>
      <div class="empty-text">您尚未报名该竞赛，无法访问详细内容</div>
      <div class="redirect-tip">正在返回竞赛列表...</div>
    </div>
    
    <div v-else class="not-found card">
      <div class="empty-icon">🔍</div>
      <div class="empty-text">竞赛信息不存在或无权访问</div>
      <button class="join-btn" @click="showJoinDialog">加入私有竞赛</button>
    </div>
    
    <!-- 加入私有竞赛对话框 -->
    <div v-if="joinDialogVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>加入私有竞赛</h3>
          <button class="close-btn" @click="joinDialogVisible = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>竞赛码</label>
            <input 
              v-model="joinCode" 
              type="text" 
              placeholder="请输入竞赛码"
              class="form-control"
              @keyup.enter="handleJoinContest"
            />
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" @click="joinDialogVisible = false">取消</button>
            <button 
              class="join-btn" 
              @click="handleJoinContest" 
              :disabled="joinLoading"
            >
              {{ joinLoading ? '加入中...' : '加入' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 报名竞赛对话框 -->
    <div v-if="applyDialogVisible" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ userApply ? '编辑报名信息' : '报名竞赛' }}</h3>
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
          <div class="form-group" v-if="contestDetail && !contestDetail.public && !userApply">
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
              :disabled="applyLoading"
            >
              {{ applyLoading ? '提交中...' : userApply ? '更新信息' : '确认报名' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contest-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #666;
  font-size: 16px;
}

.contest-header {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 20px;
}

.contest-title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

.title-info {
  flex: 1;
  margin-right: 24px;
}

.contest-title {
  margin: 0 0 8px 0;
  color: #1890ff;
  font-size: 28px;
  font-weight: 600;
}

.sponsor-tag {
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.sponsor-label {
  font-size: 14px;
  color: #666;
  margin-right: 8px;
}

.sponsor-value {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.contest-action-buttons {
  display: flex;
  gap: 12px;
  min-width: 150px;
}

.apply-btn,
.cancel-btn,
.loading-btn {
  padding: 8px 20px;
  border-radius: 4px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
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

.loading-btn {
  background: #f0f0f0;
  color: #999;
  cursor: not-allowed;
}

.contest-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 20px;
}

.contest-info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  min-width: 120px;
}

.info-label {
  font-weight: 500;
  margin-bottom: 8px;
  color: #666;
  font-size: 13px;
}

.info-value {
  color: #666;
  font-size: 14px;
}

.type-badge,
.access-badge,
.status-badge,
.tag-badge,
.apply-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
}

.type-badge.acm {
  background: #fff3e0;
  color: #ff9800;
}

.type-badge.oi {
  background: #e8eaf6;
  color: #3f51b5;
}

.access-badge.public {
  background: #e8f5e9;
  color: #4caf50;
}

.access-badge.private {
  background: #ffebee;
  color: #f44336;
}

.status-badge.upcoming {
  background: #e3f2fd;
  color: #2196f3;
}

.status-badge.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}

.status-badge.ended {
  background: #f5f5f5;
  color: #9e9e9e;
}

.tag-badge {
  background: #f0f2f5;
  color: #666;
}

.apply-badge {
  background: #52c41a;
  color: white;
}

.time-info {
  color: #666;
  font-size: 14px;
  background: #f9f9f9;
  padding: 12px 16px;
  border-radius: 4px;
}

.time-item {
  margin-bottom: 8px;
}

.time-item:last-child {
  margin-bottom: 0;
}

.time-label {
  font-weight: 500;
  margin-right: 8px;
  color: #666;
}

.time-value {
  color: #333;
}

/* 报名状态样式 */
.apply-status {
  margin-top: 16px;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  padding: 12px 16px;
}

.apply-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.apply-detail {
  display: flex;
  gap: 24px;
}

.apply-item {
  display: flex;
  align-items: center;
}

.apply-label {
  color: #666;
  margin-right: 8px;
  font-size: 14px;
}

.apply-value {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.contest-tabs {
  margin-top: 20px;
}

.tab-list {
  display: flex;
  background: white;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #eee;
  overflow: hidden;
}

.tab-item {
  padding: 14px 24px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
  position: relative;
  white-space: nowrap;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 500;
  background-color: #e6f7ff;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: #1890ff;
  border-radius: 2px 2px 0 0;
}

.tab-item:hover:not(.active) {
  color: #40a9ff;
  background-color: #f5f5f5;
}

.tab-content {
  min-height: 400px;
}

.tab-pane {
  padding: 20px 0;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 20px;
}

.contest-description {
  min-height: 300px;
}

.description-content {
  line-height: 1.6;
}

.problems-list h2,
.ranking-list h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
  position: relative;
  padding-left: 12px;
}

.problems-list h2::before,
.ranking-list h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background: #1890ff;
  border-radius: 2px;
}

.problems-table {
  width: 100%;
  border-collapse: collapse;
}

.problems-table th,
.problems-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.problems-table th {
  font-weight: 500;
  background: #fafafa;
}

.problem-row {
  cursor: pointer;
  transition: all 0.3s;
}

.problem-row:hover {
  background: #f0f7ff;
}

.id-column {
  width: 100px;
}

.name-column {
  width: 300px;
}

.empty-description,
.empty-problems,
.empty-ranking,
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

.redirect-tip {
  margin-top: 20px;
  color: #999;
  font-size: 14px;
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

@media (max-width: 768px) {
  .contest-detail-container {
    padding: 15px;
  }
  
  .contest-title-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .title-info {
    margin-right: 0;
    width: 100%;
  }
  
  .contest-title {
    font-size: 24px;
  }
  
  .contest-action-buttons {
    width: 100%;
  }
  
  .apply-btn,
  .cancel-btn,
  .loading-btn {
    width: 100%;
  }
  
  .contest-meta {
    flex-direction: column;
    gap: 15px;
  }
  
  .contest-info-grid {
    flex-direction: column;
    gap: 12px;
  }
  
  .apply-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .apply-detail {
    flex-direction: column;
    gap: 12px;
  }
  
  .tab-list {
    overflow-x: auto;
  }
  
  .tab-item {
    padding: 10px 16px;
    font-size: 14px;
  }
  
  .problems-table th,
  .problems-table td {
    padding: 8px;
  }
}
</style> 