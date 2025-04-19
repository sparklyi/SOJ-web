<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProblemDetail, getProblemTestCaseAPI, createProblemTestCaseAPI, updateProblemTestCaseAPI } from '../api/problem'
import { message } from 'ant-design-vue'
import { useUserStore } from '../store/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const problemId = route.params.id
const loading = ref(false)
const submitting = ref(false)
const problemInfo = ref(null)
const hasTestCase = ref(false)

// 测试点数据
const testCases = ref([
  // 初始默认为空，将从API获取
])

// 检查权限
onMounted(async () => {
  if (!userStore.isAdmin) {
    message.error('您没有编辑测试点的权限')
    router.push('/')
    return
  }
  
  // 获取题目信息和测试点
  await fetchProblemInfo()
  await fetchTestCases()
})

// 获取题目信息
const fetchProblemInfo = async () => {
  loading.value = true
  try {
    const res = await getProblemDetail(problemId)
    if (res.code === 200 && res.data) {
      problemInfo.value = res.data
      message.success('题目信息加载成功')
    } else {
      message.error(res.message || '获取题目信息失败')
      router.push('/problem-manage')
    }
  } catch (error) {
    console.error('获取题目信息失败:', error)
    message.error('获取题目信息失败')
    router.push('/problem-manage')
  } finally {
    loading.value = false
  }
}

// 获取测试点
const fetchTestCases = async () => {
  loading.value = true
  try {
    const res = await getProblemTestCaseAPI(problemId)
    if (res.code === 200 && res.data) {
      if (res.data.content && Array.isArray(res.data.content) && res.data.content.length > 0) {
        testCases.value = res.data.content
        hasTestCase.value = true
      } else {
        // 没有测试点数据，添加一个空测试点
        testCases.value = [{ stdin: '', expected_output: '' }]
        hasTestCase.value = false
      }
    } else {
      // 获取测试点失败，添加一个空测试点
      testCases.value = [{ stdin: '', expected_output: '' }]
      hasTestCase.value = false
      message.warning('未找到测试点数据，将创建新的测试点')
    }
  } catch (error) {
    console.error('获取测试点失败:', error)
    message.error('获取测试点失败')
    // 添加一个空测试点
    testCases.value = [{ stdin: '', expected_output: '' }]
    hasTestCase.value = false
  } finally {
    loading.value = false
  }
}

// 添加新测试点
const addTestCase = () => {
  testCases.value.push({ stdin: '', expected_output: '' })
}

// 删除测试点
const removeTestCase = (index) => {
  testCases.value.splice(index, 1)
}

// 验证测试点
const validateTestCases = () => {
  if (testCases.value.length === 0) {
    message.error('至少需要一个测试点')
    return false
  }
  
  for (let i = 0; i < testCases.value.length; i++) {
    const tc = testCases.value[i]
    if (!tc.stdin.trim() || !tc.expected_output.trim()) {
      message.error(`测试点 ${i + 1} 的输入或输出不能为空`)
      return false
    }
  }
  
  return true
}

// 保存测试点
const saveTestCases = async () => {
  if (!validateTestCases()) return
  
  submitting.value = true
  try {
    let res
    if (hasTestCase.value) {
      // 更新测试点
      res = await updateProblemTestCaseAPI(problemId, testCases.value)
    } else {
      // 创建测试点
      res = await createProblemTestCaseAPI(problemId, testCases.value)
    }
    
    if (res.code === 200) {
      message.success(hasTestCase.value ? '测试点更新成功' : '测试点创建成功')
      hasTestCase.value = true
    } else {
      message.error(res.message || (hasTestCase.value ? '更新测试点失败' : '创建测试点失败'))
    }
  } catch (error) {
    console.error(hasTestCase.value ? '更新测试点失败:' : '创建测试点失败:', error)
    message.error(hasTestCase.value ? '更新测试点失败' : '创建测试点失败')
  } finally {
    submitting.value = false
  }
}
let previousPage = route.query.from;
// 返回题目管理页
const goBack = () => {
  console.log(previousPage)
  router.push(previousPage)
}
</script>

<template>
  <div class="test-case-container">
    <div class="page-header">
      <h1>测试点管理</h1>
      <div v-if="problemInfo" class="problem-info">
        题目: {{ problemInfo.name || problemInfo.title }} (ID: {{ problemId }})
      </div>
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载题目数据中...</p>
    </div>
    
    <template v-else>
      <div class="test-cases-header">
        <div class="test-case-info">
          <span class="test-case-count">测试点数量: {{ testCases.length }}</span>
          <span class="test-case-status">{{ hasTestCase ? '已有测试点' : '新建测试点' }}</span>
        </div>
        <button class="add-btn" @click="addTestCase">添加测试点</button>
      </div>
      
      <div class="test-cases-list">
        <div v-for="(testCase, index) in testCases" :key="index" class="test-case-item">
          <div class="test-case-header">
            <h3>测试点 {{ index + 1 }}</h3>
            <button 
              v-if="testCases.length > 1" 
              class="remove-btn" 
              @click="removeTestCase(index)"
            >
              删除
            </button>
          </div>
          
          <div class="test-case-content">
            <div class="form-group">
              <label>输入 <span class="required">*</span></label>
              <textarea 
                v-model="testCase.stdin" 
                placeholder="测试点输入数据"
                class="form-control"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>期望输出 <span class="required">*</span></label>
              <textarea 
                v-model="testCase.expected_output" 
                placeholder="期望的输出结果"
                class="form-control"
              ></textarea>
            </div>
          </div>
        </div>
        
        <div v-if="testCases.length === 0" class="empty-test-cases">
          <p>暂无测试点，请点击"添加测试点"按钮添加</p>
        </div>
      </div>
      
      <div class="actions">
        <button class="back-btn" @click="goBack">返回</button>
        <button 
          class="save-btn" 
          @click="saveTestCases"
          :disabled="submitting"
        >
          {{ submitting ? '保存中...' : (hasTestCase ? '更新测试点' : '创建测试点') }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.test-case-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
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

.problem-info {
  font-size: 16px;
  color: #666;
}

.loading-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 300px;
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

.test-cases-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.test-case-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.test-case-count {
  font-size: 16px;
  font-weight: 500;
}

.test-case-status {
  font-size: 14px;
  color: #666;
}

.required {
  color: #ff4d4f;
  margin-left: 4px;
}

.add-btn {
  padding: 8px 16px;
  background: #52c41a;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  background: #73d13d;
}

.test-cases-list {
  min-height: 200px;
}

.test-case-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.test-case-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.remove-btn {
  padding: 6px 12px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.remove-btn:hover {
  background: #ff7875;
}

.test-case-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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
  min-height: 150px;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  font-size: 14px;
}

.form-control:focus {
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  outline: none;
}

.empty-test-cases {
  background: #f5f5f5;
  padding: 40px;
  text-align: center;
  border-radius: 8px;
  color: #999;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
}

.back-btn, .save-btn {
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
  font-weight: 500;
  min-width: 120px;
}

.back-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
}

.back-btn:hover {
  background: #e8e8e8;
}

.save-btn {
  background: #1890ff;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.save-btn:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .test-case-content {
    grid-template-columns: 1fr;
  }
  
  .page-header, .test-cases-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .problem-info {
    margin-top: 8px;
  }
  
  .actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .back-btn, .save-btn {
    width: 100%;
  }
}
</style> 