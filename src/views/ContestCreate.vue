<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal, DatePicker, TimePicker } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

// 检查权限
const hasPermission = computed(() => userStore.isAdmin)

// 权限检查
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有创建比赛的权限')
    router.push('/')
    return
  }
})

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
  
  return true
}

// 创建比赛API
const createContestAPI = (data) => {
  return request({
    url: '/api/v1/contest/create',
    method: 'post',
    data
  })
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

// 提交表单创建比赛
const submitForm = async () => {
  if (!validateForm()) return
  
  // 准备提交数据
  const formData = {
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
    problem_set: [], // 创建后再添加题目
  }
  
  loading.value = true
  try {
    const res = await createContestAPI(formData)
    if (res.code === 200) {
      message.success('创建比赛成功')
      Modal.confirm({
        title: '比赛创建成功',
        content: `比赛已创建成功，比赛代码为：${res.data.code}。是否立即前往比赛管理页面添加题目？`,
        okText: '前往管理',
        cancelText: '稍后处理',
        onOk: () => {
          router.push('/contest-manage')
        },
        onCancel: () => {
          router.push('/contests')
        }
      })
    } else {
      message.error(res.message || '创建比赛失败')
    }
  } catch (error) {
    console.error('创建比赛失败:', error)
    message.error('创建比赛失败，请检查网络连接')
  } finally {
    loading.value = false
  }
}

// 取消创建
const cancel = () => {
  Modal.confirm({
    title: '确认取消',
    content: '确定要取消创建比赛吗？所有已填写的内容将丢失。',
    okText: '确认',
    cancelText: '继续编辑',
    onOk: () => {
      router.push('/contests')
    }
  })
}
</script>

<template>
  <div class="contest-create-container">
    <div class="page-header">
      <h1>创建新比赛</h1>
    </div>
    
    <div class="form-container">
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
            :disabled-date="(current) => current && current < Date.now() - 8.64e7"
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
            <p class="status-desc">{{ contestForm.publish ? '创建后立即发布' : '创建后先保存为草稿状态' }}</p>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button class="cancel-btn" @click="cancel">取消</button>
        <button 
          class="submit-btn" 
          @click="submitForm" 
          :disabled="loading"
        >
          {{ loading ? '创建中...' : '创建比赛' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contest-create-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
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
  border-color: #4a90e2;
  color: #4a90e2;
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
  background-color: #4a90e2;
}

input:focus + .slider {
  box-shadow: 0 0 1px #4a90e2;
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
  justify-content: flex-end;
  gap: 16px;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
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
  background: #4a90e2;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #357dd8;
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
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
}
</style> 