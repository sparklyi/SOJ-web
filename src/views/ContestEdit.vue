<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message, Modal, DatePicker, TimePicker } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'
import { getContestDetail, updateContest } from '../api/contest'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const contestId = route.params.id
const savingDraft = ref(false)

// 检查权限
const hasPermission = computed(() => userStore.isAdmin)

// 比赛表单数据
const contestForm = reactive({
  name: '',           // 比赛名称
  tag: '',            // 标签，如：Div 1
  sponsor: '',        // 组织方
  description: '',    // 比赛描述
  start_time: null,   // 开始时间
  end_time: null,     // 结束时间
  freeze_time: null,  // 封榜时间
  public: false,      // 是否公开
  type: 'ACM',        // 比赛类型
  publish: false,     // 是否发布
})

// 比赛类型选项
const contestTypes = [
  { value: 'ACM', label: 'ACM' },
  { value: 'OI', label: 'OI' },
]

// 权限检查和数据加载
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有编辑比赛的权限')
    router.push('/admin')
    return
  }
  
  // 加载比赛详情
  fetchContestDetail()
  
  // 尝试加载本地保存的草稿
  loadDraftFromLocal()
})

// 获取比赛详情
const fetchContestDetail = async () => {
  loading.value = true
  try {
    const res = await getContestDetail(contestId)
    if (res.code === 200 && res.data) {
      const contest = res.data
      
      // 填充表单数据
      contestForm.name = contest.name || ''
      contestForm.tag = contest.tag || ''
      contestForm.sponsor = contest.sponsor || ''
      contestForm.description = contest.description || ''
      
      // 转换时间字符串为日期对象
      if (contest.start_time) {
        contestForm.start_time = new Date(contest.start_time)
      }
      if (contest.end_time) {
        contestForm.end_time = new Date(contest.end_time)
      }
      if (contest.freeze_time) {
        contestForm.freeze_time = new Date(contest.freeze_time)
      }
      
      contestForm.public = contest.public || false
      contestForm.type = contest.type || 'ACM'
      contestForm.publish = contest.publish || false
      
      message.success('比赛信息加载成功')
    } else {
      message.error(res.message || '获取比赛详情失败')
      router.push('/admin')
    }
  } catch (error) {
    console.error('获取比赛详情失败:', error)
    message.error('获取比赛详情失败')
    router.push('/admin')
  } finally {
    loading.value = false
  }
}

// 表单验证
const validateForm = () => {
  if (!contestForm.name) {
    message.error('请输入比赛名称')
    return false
  }
  
  if (!contestForm.tag) {
    message.error('请输入比赛标签')
    return false
  }
  
  if (!contestForm.sponsor) {
    message.error('请输入组织方名称')
    return false
  }
  
  if (!contestForm.description) {
    message.error('请输入比赛描述')
    return false
  }
  
  if (!contestForm.start_time) {
    message.error('请设置开始时间')
    return false
  }
  
  if (!contestForm.end_time) {
    message.error('请设置结束时间')
    return false
  }
  
  if (!contestForm.freeze_time) {
    message.error('请设置封榜时间')
    return false
  }
  
  // 检查时间先后顺序
  const startTime = new Date(contestForm.start_time).getTime()
  const endTime = new Date(contestForm.end_time).getTime()
  const freezeTime = new Date(contestForm.freeze_time).getTime()
  
  if (startTime >= endTime) {
    message.error('结束时间必须晚于开始时间')
    return false
  }
  
  if (freezeTime > endTime) {
    message.error('封榜时间不能晚于结束时间')
    return false
  }

  if (freezeTime < startTime) {
    message.error('封榜时间不能早于开始时间')
    return false
  }

  // 检查时间间隔是否合理
  const minDuration = 30 * 60 * 1000 // 最小30分钟
  const maxDuration = 7 * 24 * 60 * 60 * 1000 // 最大7天
  
  const duration = endTime - startTime
  if (duration < minDuration) {
    message.error('比赛时长不能少于30分钟')
    return false
  }
  
  if (duration > maxDuration) {
    message.error('比赛时长不能超过7天')
    return false
  }
  
  return true
}

// 格式化时间为ISO字符串格式
const formatTimeForAPI = (date) => {
  if (!date) return null
  try {
    return date.toISOString()
  } catch (error) {
    console.error('日期格式化错误:', error)
    return null
  }
}

// 提交表单更新比赛
const submitForm = async () => {
  if (!validateForm()) return
  
  // 准备提交数据
  const formData = {
    id: Number(contestId),  // 必须包含比赛ID
    name: contestForm.name,
    tag: contestForm.tag,
    sponsor: contestForm.sponsor,
    description: contestForm.description,
    start_time: formatTimeForAPI(contestForm.start_time),
    end_time: formatTimeForAPI(contestForm.end_time),
    freeze_time: formatTimeForAPI(contestForm.freeze_time),
    public: contestForm.public,
    type: contestForm.type,
    publish: contestForm.publish,
  }
  
  loading.value = true
  try {
    const res = await updateContest(formData)
    if (res.code === 200) {
      message.success('更新比赛成功')
      // 清除本地草稿
      clearLocalDraft()
      router.push('/admin')
    } else {
      message.error(res.message || '更新比赛失败')
    }
  } catch (error) {
    console.error('更新比赛失败:', error)
    message.error('更新比赛失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 暂存草稿到本地
const saveDraft = () => {
  try {
    savingDraft.value = true
    const draftData = {
      ...contestForm,
      start_time: contestForm.start_time ? contestForm.start_time.toISOString() : null,
      end_time: contestForm.end_time ? contestForm.end_time.toISOString() : null,
      freeze_time: contestForm.freeze_time ? contestForm.freeze_time.toISOString() : null
    }
    localStorage.setItem(`contest_edit_draft_${contestId}`, JSON.stringify(draftData))
    message.success('已保存草稿')
    setTimeout(() => {
      savingDraft.value = false
    }, 1000)
  } catch (error) {
    console.error('保存草稿失败:', error)
    message.error('保存草稿失败')
    savingDraft.value = false
  }
}

// 从本地加载草稿
const loadDraftFromLocal = () => {
  try {
    const draftData = localStorage.getItem(`contest_edit_draft_${contestId}`)
    if (draftData) {
      Modal.confirm({
        title: '发现本地草稿',
        content: '是否加载上次编辑的草稿？',
        okText: '加载草稿',
        cancelText: '不需要',
        onOk: () => {
          const draft = JSON.parse(draftData)
          
          // 转换时间字符串为日期对象
          if (draft.start_time) {
            draft.start_time = new Date(draft.start_time)
          }
          if (draft.end_time) {
            draft.end_time = new Date(draft.end_time)
          }
          if (draft.freeze_time) {
            draft.freeze_time = new Date(draft.freeze_time)
          }
          
          Object.assign(contestForm, draft)
          message.success('草稿加载成功')
        }
      })
    }
  } catch (error) {
    console.error('加载草稿失败:', error)
    message.error('加载草稿失败')
  }
}

// 清除本地草稿
const clearLocalDraft = () => {
  localStorage.removeItem(`contest_edit_draft_${contestId}`)
}

// 取消编辑
const cancel = () => {
  Modal.confirm({
    title: '确认取消',
    content: '确定要取消编辑比赛吗？所有未保存的修改将丢失。',
    okText: '确认',
    cancelText: '继续编辑',
    onOk: () => {
      router.push('/admin')
    }
  })
}

// 返回上一页或比赛管理页面
const navigateBack = () => {
  if (hasUnsavedChanges()) {
    Modal.confirm({
      title: '未保存的更改',
      content: '您有未保存的更改，是否保存为草稿？',
      okText: '保存草稿',
      cancelText: '放弃更改',
      onOk: () => {
        saveDraft()
        router.push('/admin')
      },
      onCancel: () => {
        router.push('/admin')
      }
    })
  } else {
    router.push('/admin')
  }
}

// 检查是否有未保存的更改
const hasUnsavedChanges = () => {
  const draftData = localStorage.getItem(`contest_edit_draft_${contestId}`)
  if (!draftData) return false
  
  try {
    const draft = JSON.parse(draftData)
    const currentForm = {
      ...contestForm,
      start_time: contestForm.start_time ? contestForm.start_time.toISOString() : null,
      end_time: contestForm.end_time ? contestForm.end_time.toISOString() : null,
      freeze_time: contestForm.freeze_time ? contestForm.freeze_time.toISOString() : null
    }
    
    return JSON.stringify(draft) !== JSON.stringify(currentForm)
  } catch (error) {
    console.error('检查未保存更改失败:', error)
    return false
  }
}

// 监听页面离开事件
const beforeUnload = (e) => {
  if (hasUnsavedChanges()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

// 挂载页面离开监听器
onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload)
})

// 卸载页面离开监听器
const onUnmounted = () => {
  window.removeEventListener('beforeunload', beforeUnload)
}
</script>

<template>
  <div class="contest-edit-container">
    <div class="page-header">
      <h1>编辑比赛</h1>
      <div class="header-actions">
        <button class="draft-btn" @click="saveDraft" :disabled="savingDraft">
          {{ savingDraft ? '保存中...' : '保存草稿' }}
        </button>
        <button class="back-btn" @click="navigateBack">返回</button>
      </div>
    </div>
    
    <div class="form-container" :class="{ 'is-loading': loading }">
      <div v-if="loading" class="loading-overlay">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
      
      <div class="form-section">
        <h2 class="section-title">基本信息</h2>
        
        <div class="form-group">
          <label>比赛名称 <span class="required">*</span></label>
          <input 
            v-model="contestForm.name" 
            type="text"
            class="form-control"
            placeholder="请输入比赛名称" 
          />
        </div>
        
        <div class="form-row">
          <div class="form-group half">
            <label>比赛标签 <span class="required">*</span></label>
            <input 
              v-model="contestForm.tag" 
              type="text"
              class="form-control"
              placeholder="例如：Div 1" 
            />
          </div>
          
          <div class="form-group half">
            <label>组织方 <span class="required">*</span></label>
            <input 
              v-model="contestForm.sponsor" 
              type="text"
              class="form-control"
              placeholder="请输入组织方名称" 
            />
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
      </div>
      
      <div class="form-section">
        <h2 class="section-title">时间设置</h2>
        
        <div class="form-group">
          <label>开始时间 <span class="required">*</span></label>
          <a-date-picker
            v-model:value="contestForm.start_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </div>
        
        <div class="form-group">
          <label>结束时间 <span class="required">*</span></label>
          <a-date-picker
            v-model:value="contestForm.end_time"
            show-time
            format="YYYY-MM-DD HH:mm:ss"
            placeholder="选择结束时间"
            :disabled-date="(current) => current && current < contestForm.start_time"
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
            :disabled-date="(current) => current && (current < contestForm.start_time || current > contestForm.end_time)"
            style="width: 100%"
          />
          <div class="form-help">封榜时间必须在比赛开始和结束时间之间</div>
        </div>
      </div>
      
      <div class="form-section">
        <h2 class="section-title">其他设置</h2>
        
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
                <input type="checkbox" v-model="contestForm.public">
                <span class="slider"></span>
              </label>
              <span class="status-text">{{ contestForm.public ? '公开比赛' : '私有比赛' }}</span>
            </div>
            <p class="status-desc">{{ contestForm.public ? '所有人都可以参加' : '仅限指定用户参加' }}</p>
          </div>
        </div>
        
        <div class="form-group">
          <div class="status-toggle">
            <div class="switch-wrapper">
              <label class="switch">
                <input type="checkbox" v-model="contestForm.publish">
                <span class="slider"></span>
              </label>
              <span class="status-text">{{ contestForm.publish ? '立即发布' : '保存为草稿' }}</span>
            </div>
            <p class="status-desc">{{ contestForm.publish ? '更新后立即发布' : '更新后保存为草稿状态' }}</p>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="cancel-btn" @click="cancel">取消</button>
        <div class="right-actions">
          <button class="draft-btn" @click="saveDraft" :disabled="savingDraft">
            {{ savingDraft ? '保存中...' : '保存草稿' }}
          </button>
          <button 
            class="submit-btn" 
            @click="submitForm" 
            :disabled="loading"
          >
            {{ loading ? '更新中...' : '更新比赛' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contest-edit-container {
  max-width: 800px;
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
  border-left: 4px solid #4CAF50;
  padding-left: 15px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.back-btn, .draft-btn {
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

.draft-btn {
  background-color: #e6f7ff;
  color: #1890ff;
  border-color: #91d5ff;
}

.draft-btn:hover:not(:disabled) {
  background-color: #bae7ff;
  border-color: #1890ff;
}

.draft-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  position: relative;
}

.is-loading {
  opacity: 0.7;
  pointer-events: none;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-title {
  font-size: 18px;
  color: #333;
  margin: 0 0 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-of-type {
  margin-bottom: 0;
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

.form-row {
  display: flex;
  gap: 16px;
  margin-bottom: 0;
}

.form-group.half {
  flex: 1;
  margin-bottom: 20px;
}

.form-help {
  margin-top: 8px;
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
  width: 50px;
  height: 24px;
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
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
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
  transform: translateX(26px);
}

.status-text {
  font-weight: 500;
}

.status-desc {
  margin-top: 4px;
  color: #999;
  font-size: 12px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.right-actions {
  display: flex;
  gap: 12px;
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
  background: #096dd9;
}

.submit-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

/* 自定义日期选择器样式 */
:deep(.ant-picker) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

:deep(.ant-picker:hover) {
  border-color: #40a9ff;
}

:deep(.ant-picker-focused) {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .form-group.half {
    width: 100%;
  }
  
  .form-actions, .right-actions {
    flex-direction: column;
  }
  
  .form-actions button, .right-actions button {
    width: 100%;
    margin-bottom: 10px;
  }
  
  .header-actions {
    display: none;
  }
}
</style> 