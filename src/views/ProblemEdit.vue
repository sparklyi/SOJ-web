<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProblemDetail, updateProblemAPI, getLanguages } from '../api/problem'
import { message, Modal } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const problemId = route.params.id
const languages = ref([])
const languagesLoading = ref(false)
const selectedLanguages = ref([])

// 当前步骤
const currentStep = ref(0)
const totalSteps = 4

// 检查权限
const hasPermission = computed(() => userStore.isAdmin)

// 权限检查
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有编辑题目的权限')
    router.push('/')
    return
  }
  
  // 先获取语言列表，然后再获取题目详情
  fetchLanguages()
    .then(() => {
      fetchProblemDetail()
    })
    .catch(() => {
      message.error('初始化数据失败')
    })
})

// 表单数据
const problemForm = reactive({
  name: '',              // 题目名称
  description: '',       // 题目描述
  input_description: '', // 输入描述
  output_description: '', // 输出描述
  level: 'easy',         // 难度级别
  example: [],           // 样例
  lang_limit: {},        // 语言限制
  remark: '',            // 备注
  visible: false,        // 是否可见，默认设为私有
  owner: 0               // 所属竞赛ID，0表示非竞赛题目
})

// 用于动态添加/删除样例的列表
const examples = ref([])

// 难度级别选项
const levelOptions = [
  { value: 'easy', label: '简单' },
  { value: 'mid', label: '中等' },
  { value: 'hard', label: '困难' }
]

// 设置时间限制
const setTimeLimit = (langId, value) => {
  const id = Number(langId);
  // 确保对象存在
  if (!problemForm.lang_limit[id]) {
    problemForm.lang_limit[id] = {
      time_limit: 1,
      memory_limit: 262144
    };
  }
  // 设置新值
  problemForm.lang_limit[id].time_limit = Number(value);
}

// 设置内存限制
const setMemoryLimit = (langId, value) => {
  const id = Number(langId);
  // 确保对象存在
  if (!problemForm.lang_limit[id]) {
    problemForm.lang_limit[id] = {
      time_limit: 1,
      memory_limit: 262144
    };
  }
  // 设置新值
  problemForm.lang_limit[id].memory_limit = Number(value);
}

// 获取时间限制
const getTimeLimit = (langId) => {
  const id = Number(langId);
  if (problemForm.lang_limit[id] && problemForm.lang_limit[id].time_limit !== undefined) {
    return problemForm.lang_limit[id].time_limit;
  }
  return 1; // 默认值
}

// 获取内存限制
const getMemoryLimit = (langId) => {
  const id = Number(langId);
  if (problemForm.lang_limit[id] && problemForm.lang_limit[id].memory_limit !== undefined) {
    return problemForm.lang_limit[id].memory_limit;
  }
  return 262144; // 默认值
}

// 获取题目详情
const fetchProblemDetail = async () => {
  loading.value = true
  try {
    const res = await getProblemDetail(problemId)
    if (res.code === 200 && res.data) {
      const problem = res.data
      
      // 填充表单数据
      problemForm.name = problem.name || problem.title || ''
      problemForm.description = problem.description || ''
      problemForm.input_description = problem.input_description || ''
      problemForm.output_description = problem.output_description || ''
      problemForm.level = problem.level || problem.difficulty || 'easy'
      problemForm.remark = problem.remark || ''
      problemForm.visible = problem.visible || false
      problemForm.owner = problem.owner || 0
      
      // 填充样例数据
      if (problem.example && Array.isArray(problem.example)) {
        examples.value = problem.example
      }
      
      // 填充语言限制
      if (problem.lang_limit && typeof problem.lang_limit === 'object') {
        // 清空已有的限制
        problemForm.lang_limit = {};
        
        // 填充语言限制，确保ID为数字类型
        Object.keys(problem.lang_limit).forEach(id => {
          const numId = Number(id);
          problemForm.lang_limit[numId] = {
            time_limit: problem.lang_limit[id].time_limit || 1,
            memory_limit: problem.lang_limit[id].memory_limit || 262144
          };
        });
        
        // 确保所有语言ID都是数字类型
        selectedLanguages.value = Object.keys(problem.lang_limit).map(id => Number(id));
        
        console.log('已初始化语言限制:', problemForm.lang_limit);
        console.log('已选择语言:', selectedLanguages.value);
      }
      
      message.success('题目信息加载成功')
    } else {
      message.error(res.message || '获取题目详情失败')
      router.push('/problem-manage')
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    message.error('获取题目详情失败')
    router.push('/problem-manage')
  } finally {
    loading.value = false
  }

  // 获取题目详情后尝试加载暂存数据
  loadFormFromLocal()
}

// 获取支持的编程语言列表
const fetchLanguages = async () => {
  languagesLoading.value = true
  try {
    const res = await getLanguages()
    if (res.code === 200 && Array.isArray(res.data)) {
      languages.value = res.data
      
      // 初始化语言限制，根据语言类型设置不同的默认值
      res.data.forEach(lang => {
        let defaultTimeLimit = 1; // 默认1秒
        let defaultMemoryLimit = 262144; // 默认256MB
        
        // 根据语言名称设置不同的默认值
        const langName = (lang.name || '').toLowerCase();
        
        if (langName.includes('python') || langName.includes('java') || langName.includes('go')) {
          defaultTimeLimit = 2; // Python/Java/Go设置为2秒
          defaultMemoryLimit = 524288; // 512MB
        } else if (langName.includes('c++') || langName.includes('c') || langName === 'c') {
          defaultTimeLimit = 1; // C/C++设置为1秒
          defaultMemoryLimit = 262144; // 256MB
        }
        
        // 确保使用数字类型的ID作为键
        const langId = Number(lang.id);
        
        // 仅当该语言不在已有配置中时添加默认值
        if (!problemForm.lang_limit[langId]) {
          problemForm.lang_limit[langId] = {
            time_limit: defaultTimeLimit,
            memory_limit: defaultMemoryLimit
          }
        }
      })
      
      console.log('全部语言限制初始化完成:', problemForm.lang_limit);
      return Promise.resolve()
    } else {
      message.error('获取编程语言列表失败')
      return Promise.reject('获取编程语言列表失败')
    }
  } catch (error) {
    console.error('获取编程语言列表失败:', error)
    message.error('获取编程语言列表失败')
    return Promise.reject(error)
  } finally {
    languagesLoading.value = false
  }
}

// 添加样例
const addExample = () => {
  examples.value.push({ stdin: '', expected_output: '' })
}

// 删除样例
const removeExample = (index) => {
  examples.value.splice(index, 1)
}

// 验证表单
const validateForm = (step) => {
  if (step === 0) {
    if (!problemForm.name) {
      message.error('请输入题目名称')
      return false
    }
    return true
  }
  
  if (step === 1) {
    if (!problemForm.description) {
      message.error('请输入题目描述')
      return false
    }
    if (!problemForm.input_description) {
      message.error('请输入输入格式描述')
      return false
    }
    if (!problemForm.output_description) {
      message.error('请输入输出格式描述')
      return false
    }
    return true
  }
  
  if (step === 2) {
    if (examples.value.length > 0) {
      for (let i = 0; i < examples.value.length; i++) {
        if (!examples.value[i].stdin || !examples.value[i].expected_output) {
          message.error(`请完整填写样例 ${i + 1}`)
          return false
        }
      }
    }
    return true
  }
  
  if (step === 3) {
    if (selectedLanguages.value.length === 0) {
      message.error('请至少选择一种编程语言')
      return false
    }
    return true
  }
  
  return true
}

// 下一步
const nextStep = () => {
  if (!validateForm(currentStep.value)) return
  
  if (currentStep.value < totalSteps - 1) {
    currentStep.value++
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// 获取题目详情后尝试加载暂存数据
const loadFormFromLocal = () => {
  try {
    const formData = localStorage.getItem(`problem_edit_draft_${problemId}`)
    if (formData) {
      const data = JSON.parse(formData)
      
      // 只在用户确认时加载暂存数据
      Modal.confirm({
        title: '发现暂存数据',
        content: '是否加载之前暂存的编辑数据？',
        okText: '确认加载',
        cancelText: '不需要',
        onOk: () => {
          // 合并数据，优先使用暂存数据
          const loadedForm = { ...data };
          
          // 确保lang_limit中的ID是数字类型
          if (loadedForm.lang_limit) {
            const newLangLimit = {};
            Object.keys(loadedForm.lang_limit).forEach(id => {
              const numId = Number(id);
              newLangLimit[numId] = {
                time_limit: loadedForm.lang_limit[id].time_limit || 1,
                memory_limit: loadedForm.lang_limit[id].memory_limit || 262144
              };
            });
            loadedForm.lang_limit = newLangLimit;
          }
          
          Object.assign(problemForm, loadedForm)
          
          if (data.example && Array.isArray(data.example)) {
            examples.value = data.example
          }
          
          if (data.selectedLanguages && Array.isArray(data.selectedLanguages)) {
            // 确保所有语言ID都是数字类型
            selectedLanguages.value = data.selectedLanguages.map(id => Number(id))
          }
          
          console.log('已加载暂存的数据，语言限制:', problemForm.lang_limit);
          console.log('已加载暂存的数据，选中的语言:', selectedLanguages.value);
          message.success('已加载暂存的数据')
        }
      })
    }
  } catch (error) {
    console.error('加载暂存数据失败:', error)
  }
}

// 提交表单
const submitForm = async () => {
  if (!validateForm(currentStep.value)) return
  
  // 准备提交数据
  const formData = {
    id: Number(problemId),
    name: problemForm.name,
    description: problemForm.description,
    input_description: problemForm.input_description,
    output_description: problemForm.output_description,
    level: problemForm.level,
    example: examples.value,
    lang_limit: selectedLanguages.value.reduce((acc, langId) => {
      // 确保langId是数字类型
      const id = Number(langId);
      if (problemForm.lang_limit[id]) {
        acc[id] = problemForm.lang_limit[id];
      }
      return acc;
    }, {}),
    remark: problemForm.remark,
    visible: problemForm.visible,
    owner: problemForm.owner
  }
  
  console.log('提交的表单数据:', formData);
  
  submitting.value = true
  try {
    const res = await updateProblemAPI(formData)
    if (res.code === 200) {
      message.success('题目更新成功')
      
      // 更新成功后清除本地暂存
      localStorage.removeItem(`problem_edit_draft_${problemId}`)
      
      // 跳转到题目管理页面
      router.push('/problem-manage')
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

// 取消编辑，返回题目管理页面
const cancel = () => {
  router.push('/problem-manage')
}

// 添加全选/取消全选方法
const toggleAllLanguages = () => {
  if (selectedLanguages.value.length === languages.value.length) {
    selectedLanguages.value = []
  } else {
    // 确保语言ID为数字类型
    selectedLanguages.value = languages.value.map(l => Number(l.id))
  }
}

// 暂存表单数据到本地存储
const saveFormToLocal = () => {
  try {
    const formData = {
      ...problemForm,
      example: examples.value,
      selectedLanguages: selectedLanguages.value
    }
    localStorage.setItem(`problem_edit_draft_${problemId}`, JSON.stringify(formData))
    message.success('已暂存表单数据')
  } catch (error) {
    console.error('暂存表单数据失败:', error)
    message.error('暂存表单数据失败')
  }
}
</script>

<template>
  <div class="problem-edit-container">
    <div class="page-header">
      <h1>编辑题目</h1>
      <div class="step-indicator">
        步骤 {{ currentStep + 1 }}/{{ totalSteps }}
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载题目数据中...</p>
    </div>
    
    <template v-else>
      <div class="steps-container">
        <div class="steps">
          <div 
            v-for="step in totalSteps" 
            :key="step" 
            :class="['step', { active: currentStep + 1 >= step, current: currentStep + 1 === step }]"
          >
            <div class="step-number">{{ step }}</div>
            <div class="step-title">
              {{ 
                step === 1 ? '基本信息' : 
                step === 2 ? '题目描述' : 
                step === 3 ? '样例和备注' : 
                '语言限制' 
              }}
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-container">
        <!-- 第一步：基本信息 -->
        <div v-if="currentStep === 0" class="form-section">
          <div class="form-group">
            <label>题目名称 <span class="required">*</span></label>
            <input 
              v-model="problemForm.name" 
              type="text" 
              placeholder="请输入题目名称，如：两数之和"
              class="form-control"
            />
          </div>
          
          <div class="form-group">
            <label>难度级别 <span class="required">*</span></label>
            <div class="radio-group">
              <label 
                v-for="option in levelOptions" 
                :key="option.value" 
                class="radio-label"
                :class="{ active: problemForm.level === option.value }"
              >
                <input 
                  type="radio" 
                  :value="option.value" 
                  v-model="problemForm.level"
                />
                {{ option.label }}
              </label>
            </div>
          </div>
          
          <div class="form-group">
            <label>可见性设置</label>
            <div class="status-toggle">
              <div class="switch-wrapper">
                <label class="switch">
                  <input type="checkbox" v-model="problemForm.visible">
                  <span class="slider"></span>
                </label>
                <span class="status-text">{{ problemForm.visible ? '公开' : '私有' }}</span>
              </div>
              <p class="status-desc">{{ problemForm.visible ? '题目将对所有用户可见' : '题目仅对您自己可见' }}</p>
            </div>
          </div>
        </div>
        
        <!-- 第二步：题目描述 -->
        <div v-if="currentStep === 1" class="form-section">
          <div class="form-group">
            <label>题目描述 <span class="required">*</span></label>
            <div class="markdown-tip">支持 Markdown 格式</div>
            <textarea 
              v-model="problemForm.description" 
              placeholder="请详细描述题目要求"
              class="form-control textarea-large"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>输入格式描述 <span class="required">*</span></label>
            <textarea 
              v-model="problemForm.input_description" 
              placeholder="请描述输入格式"
              class="form-control"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>输出格式描述 <span class="required">*</span></label>
            <textarea 
              v-model="problemForm.output_description" 
              placeholder="请描述输出格式"
              class="form-control"
            ></textarea>
          </div>
        </div>
        
        <!-- 第三步：样例和备注 -->
        <div v-if="currentStep === 2" class="form-section">
          <div class="section-header">
            <h2>样例</h2>
            <button class="add-btn" @click="addExample">添加样例</button>
          </div>
          
          <div v-if="examples.length === 0" class="empty-examples">
            <p>暂无样例，请点击"添加样例"按钮添加</p>
          </div>
          
          <div 
            v-for="(example, index) in examples" 
            :key="index" 
            class="example-item"
          >
            <div class="example-header">
              <h3>样例 {{ index + 1 }}</h3>
              <button 
                class="remove-btn" 
                @click="removeExample(index)"
              >
                删除
              </button>
            </div>
            
            <div class="example-content">
              <div class="form-group">
                <label>输入 <span class="required">*</span></label>
                <textarea 
                  v-model="example.stdin" 
                  placeholder="样例输入"
                  class="form-control"
                ></textarea>
              </div>
              
              <div class="form-group">
                <label>期望输出 <span class="required">*</span></label>
                <textarea 
                  v-model="example.expected_output" 
                  placeholder="预期的正确输出"
                  class="form-control"
                ></textarea>
              </div>
            </div>
          </div>
          
          <div class="form-group mt-4">
            <label>备注说明</label>
            <textarea 
              v-model="problemForm.remark" 
              placeholder="补充说明、提示或额外要求（可选）"
              class="form-control"
            ></textarea>
          </div>
        </div>
        
        <!-- 第四步：语言限制 -->
        <div v-if="currentStep === 3" class="form-section">
          <div v-if="languagesLoading" class="loading-placeholder">
            加载编程语言列表中...
          </div>
          
          <div v-else>
            <div class="languages-header">
              <div class="languages-title-row">
                <h3>编程语言限制</h3>
                <div class="select-all-container">
                  <label class="select-all-label">
                    <input 
                      type="checkbox" 
                      :checked="selectedLanguages.length === languages.length"
                      @change="toggleAllLanguages"
                    />
                    <span>全选/取消全选</span>
                  </label>
                </div>
              </div>
              <p class="languages-description">请选择支持的编程语言，并设置对应的时间和内存限制</p>
            </div>
            
            <div class="language-table">
              <div class="language-settings-header">
                <div class="language-column language-name-header">语言</div>
                <div class="language-column time-limit-header">时间限制 (s)</div>
                <div class="language-column memory-limit-header">内存限制 (KB)</div>
              </div>
              
              <div class="languages-list">
                <div 
                  v-for="lang in languages" 
                  :key="lang.id" 
                  class="language-item"
                  :class="{ 'selected': selectedLanguages.includes(Number(lang.id)) }"
                >
                  <div class="language-checkbox">
                    <input 
                      type="checkbox" 
                      :value="Number(lang.id)" 
                      v-model="selectedLanguages"
                      :id="`lang-${lang.id}`"
                    />
                    <label :for="`lang-${lang.id}`" class="language-name">{{ lang.name }}</label>
                  </div>
                  
                  <div class="language-limits">
                    <div class="time-limit">
                      <input 
                        type="number" 
                        :value="getTimeLimit(lang.id)" 
                        :disabled="!selectedLanguages.includes(Number(lang.id))"
                        min="0.5"
                        step="0.5"
                        class="form-control limit-input"
                        @input="setTimeLimit(lang.id, $event.target.value)"
                      />
                    </div>
                    
                    <div class="memory-limit">
                      <input 
                        type="number" 
                        :value="getMemoryLimit(lang.id)" 
                        :disabled="!selectedLanguages.includes(Number(lang.id))"
                        min="65536"
                        step="65536"
                        class="form-control limit-input"
                        @input="setMemoryLimit(lang.id, $event.target.value)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="form-actions">
        <!-- 首步操作 -->
        <div v-if="currentStep === 0" class="action-buttons">
          <button class="cancel-btn" @click="cancel">取消</button>
          <div class="right-buttons">
            <button class="save-btn" @click="saveFormToLocal">暂存</button>
            <button class="next-btn" @click="nextStep">下一步</button>
          </div>
        </div>
        
        <!-- 中间步骤 -->
        <div v-else-if="currentStep > 0 && currentStep < totalSteps - 1" class="action-buttons">
          <button class="prev-btn" @click="prevStep">上一步</button>
          <div class="right-buttons">
            <button class="save-btn" @click="saveFormToLocal">暂存</button>
            <button class="next-btn" @click="nextStep">下一步</button>
          </div>
        </div>
        
        <!-- 最后一步 -->
        <div v-else class="action-buttons">
          <div class="left-buttons">
            <button class="prev-btn" @click="prevStep">上一步</button>
            <button class="cancel-btn" @click="cancel">取消</button>
          </div>
          <div class="right-buttons">
            <button class="save-btn" @click="saveFormToLocal">暂存</button>
            <button 
              class="submit-btn" 
              @click="submitForm" 
              :disabled="submitting"
            >
              {{ submitting ? '保存中...' : '保存题目' }}
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.problem-edit-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #1890ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
}

.step-indicator {
  font-size: 16px;
  color: #666;
  font-weight: 500;
}

.steps-container {
  margin-bottom: 30px;
}

.steps {
  display: flex;
  justify-content: space-between;
  position: relative;
}

.steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #f0f0f0;
  z-index: 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  margin-bottom: 8px;
  color: #999;
  border: 2px solid #f0f0f0;
}

.step.active .step-number {
  background-color: #e6f7ff;
  color: #4a90e2;
  border-color: #4a90e2;
}

.step.current .step-number {
  background-color: #4a90e2;
  color: white;
  border-color: #4a90e2;
}

.step-title {
  font-size: 14px;
  color: #999;
}

.step.active .step-title {
  color: #4a90e2;
}

.form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  padding: 30px;
  min-height: 300px;
}

.form-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-group {
  margin-bottom: 24px;
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
  min-height: 150px;
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
  border-color: #4a90e2;
  color: #4a90e2;
  background: #e6f7ff;
}

.radio-label input {
  display: none;
}

/* 样例样式 */
.example-item {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.example-header h3 {
  font-size: 16px;
  margin: 0;
  color: #333;
}

.example-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.add-btn, .remove-btn {
  padding: 6px 14px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.add-btn {
  color: #4a90e2;
  border: 1px solid #4a90e2;
}

.add-btn:hover {
  background: #e6f7ff;
}

.remove-btn {
  color: #ff4d4f;
  border: 1px solid #ff4d4f;
}

.remove-btn:hover {
  background: #fff1f0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 18px;
  margin: 0;
  color: #333;
}

.empty-examples {
  background: #f9f9f9;
  padding: 30px;
  text-align: center;
  border-radius: 4px;
  color: #999;
  margin-bottom: 24px;
}

.loading-placeholder {
  text-align: center;
  padding: 20px;
  color: #999;
}

.languages-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}

.languages-header h3 {
  font-size: 18px;
  margin: 0 0 10px 0;
  color: #333;
}

.languages-description {
  color: #666;
  margin-bottom: 15px;
}

.select-all-container {
  margin-top: 15px;
}

.select-all-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.select-all-label input {
  margin-right: 8px;
}

.language-settings-header {
  display: grid;
  grid-template-columns: 1fr 120px 140px;
  padding: 10px 0;
  background-color: #fafafa;
  font-weight: 500;
  border-radius: 4px;
}

.language-column {
  padding: 0 15px;
}

.languages-list {
  max-height: 400px;
  overflow-y: auto;
}

.language-item {
  display: grid;
  grid-template-columns: 1fr 260px;
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  transition: background-color 0.2s;
}

.language-item:hover {
  background-color: #f9f9f9;
}

.language-item.selected {
  background-color: #f0f8ff;
}

.language-checkbox {
  display: flex;
  align-items: center;
}

.language-checkbox input {
  margin-right: 10px;
}

.language-limits {
  display: grid;
  grid-template-columns: 120px 140px;
}

.time-limit, .memory-limit {
  padding: 0 10px;
}

.language-name {
  font-weight: 500;
  cursor: pointer;
}

@media (max-width: 768px) {
  .example-content {
    grid-template-columns: 1fr;
  }
  
  .language-settings-header,
  .language-item {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .language-limits {
    grid-template-columns: 1fr 1fr;
    margin-left: 28px;
  }
  
  .time-limit, .memory-limit {
    padding: 0 5px;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions button {
    width: 100%;
  }
  
  .steps {
    overflow-x: auto;
    padding-bottom: 10px;
  }
  
  .step {
    min-width: 120px;
  }
}

.form-actions {
  padding: 20px 0;
  margin-top: 20px;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.right-buttons {
  display: flex;
  gap: 12px;
}

.cancel-btn, .prev-btn, .next-btn, .submit-btn {
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

.prev-btn {
  background: #fff;
  color: #1890ff;
  border: 1px solid #1890ff;
}

.prev-btn:hover {
  background: #e6f7ff;
}

.next-btn {
  background: #4a90e2;
  color: white;
}

.next-btn:hover {
  background: #357dd8;
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

.mt-4 {
  margin-top: 24px;
}

/* 可见性开关样式 */
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

.left-buttons {
  display: flex;
  gap: 12px;
}

.save-btn {
  background: #fff;
  color: #4a90e2;
  border: 1px solid #4a90e2;
  padding: 10px 20px;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
  min-width: 100px;
}

.save-btn:hover {
  background: #e6f7ff;
}

/* 语言限制布局优化 */
.languages-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.select-all-container {
  margin-top: 0;
}

.select-all-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  background: #f5f5f5;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.select-all-label:hover {
  background: #e8e8e8;
}

.select-all-label input {
  margin-right: 8px;
}

.language-table {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  margin-top: 15px;
  overflow: hidden;
}

.language-settings-header {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) 150px 150px;
  padding: 12px 15px;
  background-color: #fafafa;
  font-weight: 500;
  border-bottom: 1px solid #e8e8e8;
}

.language-item {
  display: grid;
  grid-template-columns: minmax(200px, 1fr) 300px;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.language-limits {
  display: grid;
  grid-template-columns: 150px 150px;
}

.language-checkbox {
  display: flex;
  align-items: center;
}

.language-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  margin-right: 10px;
}

.limit-input {
  width: 120px;
  padding: 6px 10px;
}

.languages-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>