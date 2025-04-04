<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserAppliedContests, getContestDetail, applyContest } from '../api/contest'
import { message } from 'ant-design-vue'
import { getUserId } from '../utils/auth'

const router = useRouter()
const loading = ref(false)
const contestsLoading = ref(false)
const appliedContests = ref([])
const contestsDetails = ref({})
const total = ref(0)
const editLoading = ref(false)
const currentApply = ref(null)
const editDialogVisible = ref(false)
const editForm = reactive({
  name: '',
  email: ''
})

// 分页参数
const pagination = reactive({
  page: 1,
  page_size: 10
})

// 获取个人报名比赛列表
const fetchAppliedContests = async () => {
  loading.value = true
  try {
    const res = await getUserAppliedContests(pagination)
    if (res.code === 200) {
      appliedContests.value = res.data.detail || []
      total.value = res.data.count || 0
      
      // 获取比赛详情
      await fetchContestsDetails()
    } else {
      message.error(res.message || '获取报名比赛列表失败')
    }
  } catch (error) {
    console.error('获取报名比赛列表失败:', error)
    message.error('获取报名比赛列表失败')
  } finally {
    loading.value = false
  }
}

// 获取比赛详情
const fetchContestsDetails = async () => {
  if (!appliedContests.value.length) return
  
  contestsLoading.value = true
  try {
    const promises = appliedContests.value.map(apply => 
      getContestDetail(apply.contest_id)
    )
    
    const results = await Promise.all(promises)
    
    results.forEach((res, index) => {
      if (res.code === 200) {
        const contestId = appliedContests.value[index].contest_id
        contestsDetails.value[contestId] = res.data
      }
    })
  } catch (error) {
    console.error('获取比赛详情失败:', error)
  } finally {
    contestsLoading.value = false
  }
}

// 页面变化
const handlePageChange = (page) => {
  pagination.page = page
  fetchAppliedContests()
}

// 每页数量变化
const handleSizeChange = () => {
  pagination.page = 1
  fetchAppliedContests()
}

// 进入比赛
const enterContest = (contestId) => {
  router.push(`/contest/${contestId}`)
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

// 编辑报名信息
const editApply = async () => {
  if (!currentApply.value) return;
  
  editLoading.value = true;
  try {
    const data = {
      id: currentApply.value.ID,
      contest_id: currentApply.value.contest_id,
      name: editForm.name,
      email: editForm.email
    };
    
    const res = await applyContest(data);
    if (res.code === 200) {
      message.success('报名信息更新成功');
      editDialogVisible.value = false;
      await fetchAppliedContests();
    } else {
      message.error(res.message || '更新报名信息失败');
    }
  } catch (error) {
    console.error('更新报名信息失败:', error);
    message.error('更新报名信息失败');
  } finally {
    editLoading.value = false;
  }
}

// 打开编辑对话框
const openEditDialog = (apply) => {
  currentApply.value = apply
  editForm.name = apply.name
  editForm.email = apply.email
  editDialogVisible.value = true
}

// 关闭编辑对话框
const closeEditDialog = () => {
  currentApply.value = null
  editDialogVisible.value = false
}

onMounted(() => {
  fetchAppliedContests()
})
</script>

<template>
  <div class="contests-applies-container">
    <h1>个人报名比赛</h1>
    
    <!-- 竞赛列表 -->
    <div class="contests-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="appliedContests.length === 0" class="empty">您还没有报名任何比赛</div>
      <div v-else>
        <div v-for="apply in appliedContests" :key="apply.ID" class="contest-card">
          <div class="contest-info">
            <div class="contest-header">
              <div v-if="contestsDetails[apply.contest_id]">
                <h2 class="contest-title">
                  <span class="contest-id">ID: {{ apply.contest_id }}</span>
                  {{ contestsDetails[apply.contest_id].name }}
                </h2>
                <div class="contest-tags">
                  <span :class="['status-tag', getContestStatus(contestsDetails[apply.contest_id]).class]">
                    {{ getContestStatus(contestsDetails[apply.contest_id]).status }}
                  </span>
                  <span :class="['type-tag', contestsDetails[apply.contest_id].type === 'ACM' ? 'acm' : 'oi']">
                    {{ contestsDetails[apply.contest_id].type }}
                  </span>
                  <span :class="['public-tag', contestsDetails[apply.contest_id].public ? 'public' : 'private']">
                    {{ contestsDetails[apply.contest_id].public ? '公开' : '私有' }}
                  </span>
                  <span class="tag-badge">{{ contestsDetails[apply.contest_id].tag }}</span>
                </div>
              </div>
              <div v-else class="contest-loading">
                加载比赛信息中...
              </div>
            </div>
            <div class="apply-info">
              <div class="time-item">
                <span class="apply-label">报名时间:</span>
                <span class="apply-value">{{ formatDate(apply.CreatedAt) }}</span>
              </div>
              <div class="time-item">
                <span class="apply-label">报名用户:</span>
                <span class="apply-value">{{ apply.name }}</span>
              </div>
              <div class="time-item">
                <span class="apply-label">邮箱:</span>
                <span class="apply-value">{{ apply.email }}</span>
              </div>
            </div>
            <div v-if="contestsDetails[apply.contest_id]" class="contest-times">
              <div class="time-item">
                <span class="time-label">开始时间:</span>
                <span class="time-value">{{ formatDate(contestsDetails[apply.contest_id].start_time) }}</span>
              </div>
              <div class="time-item">
                <span class="time-label">结束时间:</span>
                <span class="time-value">{{ formatDate(contestsDetails[apply.contest_id].end_time) }}</span>
              </div>
            </div>
          </div>
          <div class="contest-action">
            <button 
              class="enter-btn" 
              @click="enterContest(apply.contest_id)"
            >
              进入比赛
            </button>
            <button 
              class="edit-btn"
              @click="openEditDialog(apply)"
            >
              编辑
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

    <!-- 编辑对话框 -->
    <div v-if="editDialogVisible" class="edit-dialog">
      <div class="edit-dialog-content">
        <h2>编辑报名信息</h2>
        <div class="form-item">
          <label for="name">姓名:</label>
          <input id="name" v-model="editForm.name" />
        </div>
        <div class="form-item">
          <label for="email">邮箱:</label>
          <input id="email" v-model="editForm.email" />
        </div>
        <div class="form-actions">
          <button @click="closeEditDialog">取消</button>
          <button @click="editApply" :disabled="editLoading">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contests-applies-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
  font-size: 28px;
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

.contest-loading {
  color: #999;
  font-style: italic;
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

.apply-info {
  margin-bottom: 15px;
  padding: 12px;
  background: #f8f8f8;
  border-radius: 6px;
}

.time-item {
  margin-bottom: 8px;
}

.apply-label, .time-label {
  font-weight: 500;
  color: #666;
  margin-right: 8px;
}

.apply-value, .time-value {
  color: #333;
}

.contest-times {
  margin-top: 10px;
}

.contest-action {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 20px;
  min-width: 120px;
}

.enter-btn, .edit-btn {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.enter-btn:hover, .edit-btn:hover {
  background: #40a9ff;
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

.edit-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.edit-dialog-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-height: 80%;
  overflow-y: auto;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  margin-bottom: 8px;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-actions button {
  padding: 8px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.form-actions button:hover {
  background: #40a9ff;
}
</style> 