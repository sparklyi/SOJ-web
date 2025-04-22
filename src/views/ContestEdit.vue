<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal, DatePicker } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import dayjs from 'dayjs'; // 引入 dayjs
import utc from 'dayjs/plugin/utc'; // 如果API返回/需要UTC时间
import timezone from 'dayjs/plugin/timezone'; // 处理时区

dayjs.extend(utc);
dayjs.extend(timezone);

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const contestId = route.params.id

// 检查权限
const hasPermission = computed(() => userStore.isAdmin)

// 比赛表单数据
const contestForm = reactive({
  name: '',           // 比赛名称（不可修改）
  tag: '',            // 标签（不可修改）
  sponsor: '',        // 组织方（不可修改）
  description: '',    // 比赛描述
  start_time: null,   // 开始时间（不可修改, 存储为 dayjs 对象或 null）
  end_time: null,     // 结束时间 (存储为 dayjs 对象或 null)
  freeze_time: null,  // 封榜时间 (存储为 dayjs 对象或 null)
  public: false,      // 是否公开
  type: 'ACM',        // 比赛类型
  publish: false,     // 是否发布
})

// 原始数据，用于检测变更
const originalData = ref({})

// 比赛类型选项
const contestTypes = [
  { value: 'ACM', label: 'ACM' },
  // { value: 'OI', label: 'OI' },
]

// 权限检查并获取比赛详情
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有编辑比赛的权限')
    router.push('/')
    return
  }
  fetchContestDetail()
})

// 获取比赛详情API
const getContestDetailAPI = (id) => {
  return request({
    url: `/api/v1/contest/${id}`, 
    method: 'get'
  })
}

// 更新比赛信息API
const updateContestAPI = (data) => {
  return request({
    url: `/api/v1/contest/update`,
    method: 'put',
    data
  })
}

// 获取比赛详情
const fetchContestDetail = async () => {
  loading.value = true
  try {
    const res = await getContestDetailAPI(contestId)
    if (res.code === 200 && res.data) {
      const contest = res.data
      
      // 填充表单数据，将日期字符串转为 dayjs 对象
      contestForm.name = contest.name || ''
      contestForm.tag = contest.tag || ''
      contestForm.sponsor = contest.sponsor || ''
      contestForm.description = contest.description || ''
      contestForm.start_time = contest.start_time ? dayjs(contest.start_time) : null
      contestForm.end_time = contest.end_time ? dayjs(contest.end_time) : null
      contestForm.freeze_time = contest.freeze_time ? dayjs(contest.freeze_time) : null
      contestForm.public = !!contest.public
      contestForm.type = contest.type || 'ACM'
      contestForm.publish = !!contest.publish
      
      // 保存原始数据用于对比（需要同样转换为dayjs对象或保存转换前的ISO字符串）
      // 为了简单起见，我们可以在比较时再转换原始数据
      originalData.value = {
        ...contest,
        start_time: contest.start_time, // 保存原始ISO字符串
        end_time: contest.end_time,     // 保存原始ISO字符串
        freeze_time: contest.freeze_time, // 保存原始ISO字符串
        public: !!contest.public,
        publish: !!contest.publish
      };
      
      message.success('比赛信息加载成功')
    } else {
      message.error(res.message || '获取比赛详情失败')
      router.push('/contest-manage')
    }
  } catch (error) {
    console.error('获取比赛详情失败:', error)
    message.error('获取比赛详情失败')
    router.push('/contest-manage')
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = () => {
  if (!contestForm.end_time) {
    message.error('请设置结束时间')
    return false
  }
  if (!contestForm.freeze_time) {
    message.error('请设置封榜时间')
    return false
  }
  // 确保开始时间存在（虽然只读，但验证时需要）
  if (!contestForm.start_time) {
     message.error('比赛开始时间缺失，无法验证')
     return false
  }
  
  // 使用 dayjs 进行时间比较
  if (!contestForm.end_time.isAfter(contestForm.start_time)) {
    message.error('结束时间必须晚于开始时间')
    return false
  }
  
  if (contestForm.freeze_time.isAfter(contestForm.end_time)) {
    message.error('封榜时间不能晚于结束时间')
    return false
  }
  if (!contestForm.freeze_time.isAfter(contestForm.start_time)) {
    message.error('封榜时间必须晚于开始时间')
    return false
  }
  
  return true
}

// 格式化 dayjs 对象为 API 需要的 ISO 字符串
const formatDayjsForAPI = (dayjsObj) => {
  if (!dayjsObj || !dayjs.isDayjs(dayjsObj)) return null
  try {
    // 根据需要决定是否转为 UTC 或保留本地时区
    return dayjsObj.toISOString() 
  } catch (error) {
    console.error('Dayjs 对象格式化错误:', error)
    return null
  }
}

// 提交表单更新比赛
const submitForm = async () => {
  if (!validateForm()) return

  // API需要所有字段，移除变更检查
  /*
  const currentEndTimeAPI = formatDayjsForAPI(contestForm.end_time)
  const currentFreezeTimeAPI = formatDayjsForAPI(contestForm.freeze_time)
  const originalEndTimeAPI = originalData.value.end_time
  const originalFreezeTimeAPI = originalData.value.freeze_time

  // 检查是否有变更
  if (
    contestForm.type === originalData.value.type &&
    contestForm.description === originalData.value.description &&
    currentEndTimeAPI === originalEndTimeAPI &&
    currentFreezeTimeAPI === originalFreezeTimeAPI &&
    // contestForm.public === originalData.value.public && // Public 不允许修改，不检查
    contestForm.publish === originalData.value.publish
  ) {
    message.info('未检测到变更，无需保存')
    return
  }
  */
  
  // 准备提交数据 - 包含所有字段，除了 public
  const formData = {
    id: Number(contestId),
    name: contestForm.name, // 包含只读字段
    tag: contestForm.tag, // 包含只读字段
    sponsor: contestForm.sponsor, // 包含只读字段
    description: contestForm.description,
    type: contestForm.type,
    start_time: formatDayjsForAPI(contestForm.start_time), // 包含只读字段，确保格式正确
    end_time: formatDayjsForAPI(contestForm.end_time),
    freeze_time: formatDayjsForAPI(contestForm.freeze_time),
    publish: contestForm.publish
    // public: contestForm.public, // 明确移除 public 字段
  }
  
  submitting.value = true
  try {
    const res = await updateContestAPI(formData)
    if (res.code === 200) {
      message.success('比赛更新成功')
      router.push('/contest-manage')
    } else {
      message.error(res.message || '更新失败')
    }
  } catch (error) {
    console.error('提交更新失败:', error)
    message.error('更新失败，请检查网络连接')
  } finally {
    submitting.value = false
  }
}

let previousPage = route.query.from;
// 取消编辑
const cancel = () => {
  Modal.confirm({
    title: '确认取消',
    content: '确定要取消编辑吗？所有未保存的修改将丢失。',
    okText: '确认',
    cancelText: '继续编辑',
    onOk: () => {
      // 确保路由跳转正确
      router.push(previousPage) 
    }
  })
}

// 格式化 dayjs 对象用于显示
const formatDayjsForDisplay = (dayjsObj) => {
  if (!dayjsObj || !dayjs.isDayjs(dayjsObj)) return '-'
  return dayjsObj.format('YYYY-MM-DD HH:mm:ss') // 使用 dayjs format
}

</script>

<template>
  <div class="contest-edit-container">
    <div class="page-header">
      <h1>编辑比赛</h1>
      <button class="back-btn" @click="cancel">返回</button>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载比赛数据中...</p>
    </div>
    
    <div v-else class="form-container">
      <!-- 基本信息（只读） -->
      <div class="form-section">
        <h2 class="section-title">基本信息 <span class="readonly-badge">只读</span></h2>
        
        <div class="form-group">
          <label>比赛名称</label>
          <div class="readonly-field">{{ contestForm.name }}</div>
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>比赛标签</label>
            <div class="readonly-field">{{ contestForm.tag }}</div>
          </div>
          
          <div class="form-group half">
            <label>组织方</label>
            <div class="readonly-field">{{ contestForm.sponsor }}</div>
          </div>
        </div>
        
        <div class="form-group">
          <label>比赛描述 <span class="required">*</span></label>
          <div class="markdown-tip">支持 Markdown 格式</div>
          <textarea 
            v-model="contestForm.description" 
            class="form-control textarea-large"
            placeholder="请输入比赛描述、规则等信息" 
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>开始时间</label>
          <div class="readonly-field">{{ formatDayjsForDisplay(contestForm.start_time) }}</div>
        </div>
      </div>
      
      <!-- 可编辑信息 -->
      <div class="form-section">
        <h2 class="section-title">可编辑信息</h2>
        
        <div class="form-group">
          <label>结束时间 <span class="required">*</span></label>
          <a-date-picker
            v-model:value="contestForm.end_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </div>
        
        <div class="form-group">
          <label>封榜时间 <span class="required">*</span></label>
          <a-date-picker
            v-model:value="contestForm.freeze_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择封榜时间"
            style="width: 100%"
          />
        </div>
        
        <div class="form-group">
          <label>比赛类型</label>
          <div class="radio-group">
            <label 
              v-for="type in contestTypes" 
              :key="type.value" 
              class="radio-label"
              :class="{ active: contestForm.type === type.value }"
            >
              <input 
                type="radio" 
                :value="type.value" 
                v-model="contestForm.type"
              />
              {{ type.label }}
            </label>
          </div>
        </div>
        
        <div class="form-group">
          <div class="status-toggle">
            <div class="switch-wrapper">
              <label class="switch">
                <input type="checkbox" v-model="contestForm.public" disabled>
                <span class="slider"></span>
              </label>
              <span class="status-text">{{ contestForm.public ? '公开比赛' : '私有比赛' }}</span>
            </div>
            <p class="status-desc">{{ contestForm.public ? '所有人都可以参加' : '仅限指定用户参加' }} (此项不可修改)</p>
          </div>
        </div>
        
        <div class="form-group">
          <div class="status-toggle">
            <div class="switch-wrapper">
              <label class="switch">
                <input type="checkbox" v-model="contestForm.publish">
                <span class="slider"></span>
              </label>
              <span class="status-text">{{ contestForm.publish ? '已发布' : '草稿' }}</span>
            </div>
            <p class="status-desc">{{ contestForm.publish ? '比赛将对符合条件的用户可见' : '比赛处于草稿状态，不对任何用户可见' }}</p>
          </div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="form-actions">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button 
          class="submit-btn" 
          @click="submitForm" 
          :disabled="submitting || loading"
        >
          {{ submitting ? '保存中...' : '保存修改' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contest-edit-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h1 {
  font-size: 28px;
  color: #333;
  margin: 0;
  font-weight: 600;
  border-left: 4px solid #1890ff;
  padding-left: 15px;
}

.back-btn {
  padding: 8px 16px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  color: #333;
}

.back-btn:hover {
  background-color: #e8e8e8;
  color: #40a9ff;
  border-color: #40a9ff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.loading-spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.form-section {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
  margin-bottom: 0;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.readonly-badge {
  font-size: 12px;
  font-weight: normal;
  background-color: #f0f0f0;
  color: #999;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.form-group {
  margin-bottom: 24px;
}

.form-row {
  display: flex;
  gap: 24px;
}

.half {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #ff4d4f;
  margin-left: 4px;
}

.readonly-field {
  padding: 10px 12px;
  background-color: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  color: #666;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
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

.textarea-large {
  min-height: 120px;
  resize: vertical;
}

.markdown-tip {
  margin: -4px 0 8px;
  font-size: 12px;
  color: #999;
}

.radio-group {
  display: flex;
  gap: 16px;
}

.radio-label {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.radio-label.active {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.radio-label input {
  display: none;
}

.status-toggle {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #1890ff;
}

input:focus + .slider {
  box-shadow: 0 0 1px #1890ff;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.status-text {
  font-weight: 500;
  color: #333;
}

.status-desc {
  color: #999;
  font-size: 13px;
  margin: 4px 0 0 52px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 30px;
}

.cancel-btn, .submit-btn {
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-weight: 500;
  min-width: 100px;
}

.cancel-btn {
  background: #f0f0f0;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #1890ff;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.submit-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style> 