<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getProblemDetail, getLanguages, runCode, submitCode as submitCodeAPI, getSubmissionList, getSubmissionDetail } from '../api/problem'
import { message } from 'ant-design-vue'

const route = useRoute()
const problem = ref(null)
const loading = ref(false)
const code = ref('')
const language = ref('cpp') // 还是使用简称作为内部标识
const languageId = ref(null) // 用于API调用的真实语言ID
const showEditor = ref(true)  // 控制编辑器显示状态
const languageOptions = ref([]) // 语言选项列表
const runResult = ref(null) // 运行结果
const testInput = ref('') // 自测输入
const isRunning = ref(false) // 是否正在运行代码
const showTestPanel = ref(false) // 是否显示自测面板
const activeTab = ref('problem') // 当前激活的选项卡: problem, solution, submissions

// 提交记录相关
const submissionLoading = ref(false)
const submissionList = ref([])
const submissionTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const submissionDetail = ref(null)
const showSubmissionDetail = ref(false)
const submissionDetailLoading = ref(false)

// 获取题目详情
const fetchProblemDetail = async () => {
  loading.value = true
  try {
    const res = await getProblemDetail(route.params.id)
    if (res.code === 200) {
      problem.value = res.data
      // 确保样例存在，适配新API格式
      if (problem.value.example && !problem.value.samples) {
        problem.value.samples = problem.value.example.map(item => ({
          input: item.stdin,
          output: item.expected_output
        }))
      }
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取支持的编程语言列表
const fetchLanguages = async () => {
  try {
    const res = await getLanguages()
    if (res.code === 200 && Array.isArray(res.data)) {
      // 转换后端语言列表为前端语言选择器可用的格式
      languageOptions.value = res.data.map(lang => ({
        value: getShortLanguageName(lang.name), // 转换为简称
        label: lang.name,
        id: lang.id
      }))
      
      // 设置默认语言
      if (languageOptions.value.length > 0) {
        language.value = languageOptions.value[0].value
        languageId.value = languageOptions.value[0].id
        setDefaultCode()
      }
    }
  } catch (error) {
    console.error('获取语言列表失败:', error)
  }
}

// 从完整语言名称中提取简称
const getShortLanguageName = (fullName) => {
  if (fullName.includes('Python')) return 'python'
  if (fullName.includes('C++')) return 'cpp'
  if (fullName.includes('Java')) return 'java'
  if (fullName.includes('Go')) return 'go'
  // 默认返回小写的语言名称
  return fullName.toLowerCase()
}

// 设置默认代码
const setDefaultCode = () => {
  if (!problem.value) return
  
  // 根据选择的语言设置默认代码模板
  switch (language.value) {
    case 'cpp':
      code.value = `#include <iostream>
#include <vector>
#include <string>
using namespace std;

// ${problem.value.name}
${problem.value.description.split('\n').map(line => '// ' + line).join('\n')}

int main() {
    // 在这里编写代码
    return 0;
}`
      break
    case 'java':
      code.value = `import java.util.*;

public class Solution {
    // ${problem.value.name}
    ${problem.value.description.split('\n').map(line => '    // ' + line).join('\n')}
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // 在这里编写代码
    }
}`
      break
    case 'python':
      code.value = `# ${problem.value.name}
${problem.value.description.split('\n').map(line => '# ' + line).join('\n')}

# 在这里编写代码
`
      break
    case 'go':
      code.value = `package main

import (
    "fmt"
)

// ${problem.value.name}
${problem.value.description.split('\n').map(line => '// ' + line).join('\n')}

func main() {
    // 在这里编写代码
}
`
      break
    default:
      code.value = `// ${problem.value.name}
${problem.value.description.split('\n').map(line => '// ' + line).join('\n')}

// 在这里编写代码
`
  }
}

// 更改编程语言
const changeLanguage = (lang) => {
  language.value = lang
  // 更新语言ID
  const selectedLang = languageOptions.value.find(opt => opt.value === lang)
  if (selectedLang) {
    languageId.value = selectedLang.id
  }
  setDefaultCode()
}

// 提交代码
const submitCode = async () => {
  if (!code.value.trim()) {
    message.warning('请先编写代码')
    return
  }
  
  if (!languageId.value) {
    message.warning('请先选择编程语言')
    return
  }
  
  try {
    const result = await submitCodeAPI({
      problem_id: Number(route.params.id),
      source_code: code.value,
      language_id: languageId.value
    })
    
    if (result.code === 200) {
      message.success('代码提交成功')
      // 切换到提交记录页面
      activeTab.value = 'submissions'
      // 刷新提交记录
      fetchSubmissionList()
    } else {
      message.error(result.message || '代码提交失败')
    }
  } catch (error) {
    console.error('提交代码出错:', error)
    message.error('提交代码失败: ' + (error.message || '未知错误'))
  }
}

// 获取提交记录列表
const fetchSubmissionList = async () => {
  submissionLoading.value = true
  try {
    const res = await getSubmissionList({
      problem_id: Number(route.params.id),
      page: currentPage.value,
      page_size: pageSize.value
    })
    
    if (res.code === 200) {
      submissionList.value = res.data.detail || []
      submissionTotal.value = res.data.count || 0
    }
  } catch (error) {
    console.error('获取提交记录失败:', error)
    message.error('获取提交记录失败')
  } finally {
    submissionLoading.value = false
  }
}

// 获取提交详情
const fetchSubmissionDetail = async (submissionId) => {
  submissionDetailLoading.value = true
  try {
    const res = await getSubmissionDetail(submissionId)
    if (res.code === 200) {
      submissionDetail.value = res.data
      showSubmissionDetail.value = true
    }
  } catch (error) {
    console.error('获取提交详情失败:', error)
    message.error('获取提交详情失败')
  } finally {
    submissionDetailLoading.value = false
  }
}

// 页码改变
const handlePageChange = (page) => {
  currentPage.value = page
  fetchSubmissionList()
}

// 关闭提交详情
const closeSubmissionDetail = () => {
  showSubmissionDetail.value = false
  submissionDetail.value = null
}

// 状态样式映射
const getStatusClass = (status) => {
  const statusMap = {
    'Accepted': 'status-success',
    'Wrong Answer': 'status-error',
    'Time Limit Exceeded': 'status-warning',
    'Memory Limit Exceeded': 'status-warning',
    'Runtime Error': 'status-error',
    'Compilation Error': 'status-info',
    'Unknown Error': 'status-default'
  }
  return statusMap[status] || 'status-default'
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 监听选项卡变化
watch(activeTab, (newVal) => {
  if (newVal === 'submissions') {
    fetchSubmissionList()
  }
})

// 使用样例输入
const useExampleInput = (index) => {
  if (problem.value && problem.value.samples && problem.value.samples[index]) {
    testInput.value = problem.value.samples[index].input
    showTestPanel.value = true
  }
}

// 运行代码
const runTestCode = async () => {
  if (!code.value.trim()) {
    message.warning('请先编写代码')
    return
  }
  
  if (!languageId.value) {
    message.warning('请先选择编程语言')
    return
  }
  
  try {
    isRunning.value = true
    runResult.value = null
    
    const result = await runCode({
      problem_id: Number(route.params.id),
      source_code: code.value,
      language_id: languageId.value,
      stdin: testInput.value
    })
    
    if (result.code === 200) {
      runResult.value = result.data
      message.success('代码运行成功')
    } else {
      message.error(result.message || '代码运行失败')
    }
  } catch (error) {
    console.error('运行代码出错:', error)
    message.error('运行代码失败: ' + (error.message || '未知错误'))
  } finally {
    isRunning.value = false
  }
}

// 切换编辑器显示状态（适用于移动设备）
const toggleEditor = () => {
  showEditor.value = !showEditor.value
}

// 切换自测面板
const toggleTestPanel = () => {
  showTestPanel.value = !showTestPanel.value
}

// 格式化代码
const formatCode = () => {
  try {
    // 基础格式化逻辑，根据不同语言可以扩展
    let formattedCode = ''
    
    switch (language.value) {
      case 'cpp':
      case 'java':
      case 'go': 
        // 从缩进上做基础处理
        const lines = code.value.split('\n')
        let indentLevel = 0
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim()
          
          if (line.endsWith('{')) {
            formattedCode += ' '.repeat(indentLevel * 4) + line + '\n'
            indentLevel++
          } else if (line.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1)
            formattedCode += ' '.repeat(indentLevel * 4) + line + '\n'
          } else {
            formattedCode += ' '.repeat(indentLevel * 4) + line + '\n'
          }
        }
        break
      
      case 'python':
        // Python简单处理，主要是空行和注释
        formattedCode = code.value.trim()
          .split('\n')
          .map(line => line.trim())
          .join('\n')
        break
        
      default:
        formattedCode = code.value
    }
    
    code.value = formattedCode
    message.success('代码已格式化')
  } catch (error) {
    console.error('格式化代码出错:', error)
    message.error('格式化失败')
  }
}

// 切换选项卡
const switchTab = (tab) => {
  activeTab.value = tab
}

onMounted(() => {
  fetchProblemDetail()
  fetchLanguages()
})
</script>

<template>
  <div class="problem-detail-container">
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-else-if="!problem" class="empty">
      题目不存在
    </div>
    <div v-else class="problem-detail">
      <!-- 题目导航栏 -->
      <div class="problem-tabs">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'problem' }"
          @click="switchTab('problem')"
        >
          题目描述
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'solution' }"
          @click="switchTab('solution')"
        >
          题解
        </div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'submissions' }"
          @click="switchTab('submissions')"
        >
          提交记录
        </div>
      </div>
      
      <!-- 移动端切换按钮 -->
      <div class="mobile-toggle">
        <button @click="toggleEditor" class="toggle-btn">
          {{ showEditor ? '查看题目' : '查看编辑器' }}
        </button>
      </div>
      
      <!-- 题目描述选项卡 -->
      <div v-if="activeTab === 'problem'" class="split-layout">
        <!-- 左侧题目详情 -->
        <div class="problem-info" :class="{ 'hidden-mobile': showEditor }">
          <div class="problem-header">
            <h1>{{ problem.name }}</h1>
            <div class="problem-meta">
              <span :class="['level-tag', problem.level]">
                {{ problem.level === 'easy' ? '简单' : problem.level === 'mid' ? '中等' : '困难' }}
              </span>
              <span class="create-time" v-if="problem.CreatedAt">
                创建时间：{{ new Date(problem.CreatedAt).toLocaleDateString() }}
              </span>
            </div>
          </div>

          <div class="problem-content">
            <div class="section">
              <h2>题目描述</h2>
              <div class="description">
                {{ problem.description }}
              </div>
            </div>

            <div class="section">
              <h2>输入格式</h2>
              <div class="input-format">
                {{ problem.input_description || problem.input_format }}
              </div>
            </div>

            <div class="section">
              <h2>输出格式</h2>
              <div class="output-format">
                {{ problem.output_description || problem.output_format }}
              </div>
            </div>

            <div class="section" v-if="problem.remark">
              <h2>备注</h2>
              <div class="remark">
                {{ problem.remark }}
              </div>
            </div>

            <div class="section">
              <h2>样例</h2>
              <div class="samples">
                <div v-for="(sample, index) in problem.samples" :key="index" class="sample">
                  <div class="sample-header">
                    <div class="sample-title">样例 {{ index + 1 }}</div>
                    <button class="use-example-btn" @click="useExampleInput(index)">使用此样例</button>
                  </div>
                  <div class="sample-content">
                    <div class="sample-input">
                      <div class="label">输入：</div>
                      <pre>{{ sample.input }}</pre>
                    </div>
                    <div class="sample-output">
                      <div class="label">输出：</div>
                      <pre>{{ sample.output }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 右侧在线IDE编辑器 -->
        <div class="code-editor" :class="{ 'hidden-mobile': !showEditor }">
          <div class="editor-header">
            <div class="editor-actions">
              <div class="selector-wrapper">
                <select 
                  id="language-select"
                  v-model="language" 
                  @change="changeLanguage(language)"
                  class="language-select"
                >
                  <option v-for="option in languageOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <div class="select-icon">
                  <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
              
              <button class="format-btn" @click="formatCode" title="格式化代码">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10H7" />
                  <path d="M21 6H3" />
                  <path d="M21 14H3" />
                  <path d="M21 18H7" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="editor-container">
            <textarea 
              v-model="code" 
              class="code-textarea" 
              spellcheck="false"
              placeholder="在此编写代码..."
            ></textarea>
          </div>
          
          <!-- 自测面板 -->
          <div class="test-panel" v-if="showTestPanel">
            <div class="panel-header">
              <h3>自测输入</h3>
            </div>
            <div class="input-area">
              <textarea 
                v-model="testInput" 
                class="test-input-textarea" 
                placeholder="输入测试数据..."
                spellcheck="false"
              ></textarea>
            </div>
            
            <div v-if="runResult" class="output-area">
              <div class="panel-header">
                <h3>运行结果</h3>
                <div class="run-stats">
                  <span class="stat-item">时间: {{ runResult.time }}s</span>
                  <span class="stat-item">内存: {{ Math.round(runResult.memory / 1024) }}MB</span>
                </div>
              </div>
              
              <!-- 编译错误输出 -->
              <div v-if="runResult.compile_output" class="compile-error">
                <div class="output-label error-label">编译错误:</div>
                <pre class="run-output error-output">{{ runResult.compile_output }}</pre>
              </div>
              
              <!-- 标准输出 -->
              <div v-if="runResult.stdout">
                <div class="output-label">标准输出:</div>
                <pre class="run-output">{{ runResult.stdout }}</pre>
              </div>
              
              <!-- 标准错误输出 -->
              <div v-if="runResult.stderr">
                <div class="output-label error-label">标准错误:</div>
                <pre class="run-output error-output">{{ runResult.stderr }}</pre>
              </div>
              
              <!-- 没有任何输出的情况 -->
              <div v-if="!runResult.stdout && !runResult.stderr && !runResult.compile_output" class="no-output">
                <div class="output-label">程序运行完成，没有任何输出</div>
              </div>
            </div>
            
            <div class="panel-actions">
              <button 
                class="run-test-btn" 
                @click="runTestCode" 
                :disabled="isRunning"
              >
                {{ isRunning ? '运行中...' : '运行' }}
              </button>
            </div>
          </div>
          
          <div class="editor-footer">
            <button class="run-btn" @click="toggleTestPanel">{{ showTestPanel ? '隐藏自测' : '自测' }}</button>
            <button class="submit-btn" @click="submitCode">提交代码</button>
          </div>
        </div>
      </div>
      
      <!-- 题解选项卡 -->
      <div v-else-if="activeTab === 'solution'" class="tab-content solution-tab">
        <div class="empty-placeholder">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>题解即将上线</h3>
          <p>敬请期待更多解题思路和技巧分享</p>
        </div>
      </div>
      
      <!-- 提交记录选项卡 -->
      <div v-else-if="activeTab === 'submissions'" class="tab-content submissions-tab">
        <div v-if="submissionLoading" class="loading">加载中...</div>
        <div v-else-if="submissionList.length === 0" class="empty-placeholder">
          <div class="placeholder-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3>暂无提交记录</h3>
          <p>提交代码后可以在此查看历史记录</p>
        </div>
        <div v-else class="submission-list">
          <div class="submission-table">
            <div class="table-header">
              <div class="header-id">ID</div>
              <div class="header-status">状态</div>
              <div class="header-language">语言</div>
              <div class="header-time">提交时间</div>
              <div class="header-runtime">运行时间</div>
              <div class="header-memory">内存</div>
              <div class="header-actions">操作</div>
            </div>
            <div 
              v-for="item in submissionList" 
              :key="item.ID" 
              class="table-row"
            >
              <div class="cell-id">{{ item.ID }}</div>
              <div 
                class="cell-status" 
                :class="getStatusClass(item.status)"
              >
                {{ item.status }}
              </div>
              <div class="cell-language">{{ item.language }}</div>
              <div class="cell-time">{{ formatDateTime(item.CreatedAt) }}</div>
              <div class="cell-runtime">{{ item.time ? item.time + 's' : '-' }}</div>
              <div class="cell-memory">{{ item.memory ? Math.round(item.memory / 1024) + 'MB' : '-' }}</div>
              <div class="cell-actions">
                <button 
                  class="view-code-btn" 
                  @click="fetchSubmissionDetail(item.ID)"
                >
                  查看源码
                </button>
              </div>
            </div>
          </div>
          
          <!-- 分页 -->
          <div class="pagination">
            <div class="page-total">共 {{ submissionTotal }} 条记录</div>
            <div class="page-controls">
              <button 
                class="page-btn" 
                :disabled="currentPage <= 1"
                @click="handlePageChange(currentPage - 1)"
              >
                上一页
              </button>
              <span class="page-info">{{ currentPage }} / {{ Math.ceil(submissionTotal / pageSize) }}</span>
              <button 
                class="page-btn" 
                :disabled="currentPage >= Math.ceil(submissionTotal / pageSize)"
                @click="handlePageChange(currentPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </div>
        
        <!-- 提交详情对话框 -->
        <div class="submission-detail-modal" v-if="showSubmissionDetail">
          <div class="modal-overlay" @click="closeSubmissionDetail"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h3>提交详情 #{{ submissionDetail?.ID }}</h3>
              <button class="close-btn" @click="closeSubmissionDetail">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div v-if="submissionDetailLoading" class="modal-loading">加载中...</div>
            <div v-else class="modal-body">
              <div class="detail-info">
                <div class="detail-item">
                  <span class="label">题目:</span>
                  <span class="value">{{ submissionDetail?.problem_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">用户:</span>
                  <span class="value">{{ submissionDetail?.user_name }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">语言:</span>
                  <span class="value">{{ submissionDetail?.language }}</span>
                </div>
                <div class="detail-item">
                  <span class="label">状态:</span>
                  <span class="value" :class="getStatusClass(submissionDetail?.status)">{{ submissionDetail?.status }}</span>
                </div>
                <div class="detail-item" v-if="submissionDetail?.time">
                  <span class="label">运行时间:</span>
                  <span class="value">{{ submissionDetail?.time }}s</span>
                </div>
                <div class="detail-item" v-if="submissionDetail?.memory">
                  <span class="label">内存占用:</span>
                  <span class="value">{{ Math.round(submissionDetail?.memory / 1024) }}MB</span>
                </div>
                <div class="detail-item">
                  <span class="label">提交时间:</span>
                  <span class="value">{{ formatDateTime(submissionDetail?.CreatedAt) }}</span>
                </div>
              </div>
              <div class="code-container">
                <h4>源代码</h4>
                <pre class="source-code">{{ submissionDetail?.source_code }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-detail-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.problem-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.split-layout {
  display: flex;
  gap: 20px;
  height: calc(100vh - 150px);
  min-height: 600px;
}

.problem-info {
  flex: 1;
  overflow-y: auto;
  padding-right: 15px;
}

.code-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #eee;
  padding-left: 15px;
}

.problem-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.problem-header h1 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.problem-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.level-tag.easy {
  background: #e8f5e9;
  color: #4caf50;
}

.level-tag.mid {
  background: #fff3e0;
  color: #ff9800;
}

.level-tag.hard {
  background: #ffebee;
  color: #f44336;
}

.create-time {
  color: #666;
  font-size: 14px;
}

.section {
  margin-bottom: 25px;
}

.section h2 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.description,
.input-format,
.output-format {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.samples {
  display: grid;
  gap: 15px;
}

.sample {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sample-title {
  color: #333;
  font-weight: 500;
}

.use-example-btn {
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.use-example-btn:hover {
  background: #40a9ff;
}

.sample-content {
  display: grid;
  gap: 10px;
}

.sample-input,
.sample-output {
  display: flex;
  gap: 8px;
}

.label {
  color: #666;
  font-size: 14px;
  min-width: 60px;
}

pre {
  flex: 1;
  margin: 0;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.editor-header {
  padding: 12px 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selector-wrapper {
  position: relative;
  width: 180px;
}

.language-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background-color: white;
  color: #333;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  appearance: none;
  -webkit-appearance: none;
  padding-right: 30px;
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #888;
}

.language-select:hover {
  border-color: #40a9ff;
}

.language-select:focus {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.editor-container {
  flex: 1;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 15px;
}

.code-textarea {
  width: 100%;
  height: 100%;
  padding: 15px;
  border: none;
  resize: none;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  background: #2d2d2d;
  color: #ccc;
}

/* 自测面板 */
.test-panel {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 15px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  color: #333;
}

.run-stats {
  font-size: 13px;
  color: #666;
}

.stat-item {
  margin-left: 10px;
}

.input-area, .output-area {
  margin-bottom: 10px;
}

.test-input-textarea {
  width: 100%;
  height: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  background: white;
}

.run-output {
  background: white;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  max-height: 150px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  margin: 0;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
}

.run-test-btn {
  padding: 6px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.run-test-btn:hover {
  background: #40a9ff;
}

.run-test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 0;
}

.run-btn,
.submit-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.run-btn {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.run-btn:hover {
  background: #e0e0e0;
}

.submit-btn {
  background: #4CAF50;
  color: white;
}

.submit-btn:hover {
  background: #45a049;
}

.remark {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  background-color: #fff8e1;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

/* 移动端适配 */
.mobile-toggle {
  display: none;
}

@media (max-width: 768px) {
  .problem-detail-container {
    padding: 10px;
  }
  
  .problem-detail {
    padding: 15px;
  }
  
  .split-layout {
    flex-direction: column;
    height: auto;
    min-height: auto;
  }
  
  .problem-info,
  .code-editor {
    flex: none;
    width: 100%;
    border-left: none;
    padding-right: 0;
    padding-left: 0;
  }
  
  .mobile-toggle {
    display: block;
    margin-bottom: 15px;
    text-align: center;
  }
  
  .toggle-btn {
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .hidden-mobile {
    display: none;
  }
  
  .problem-header h1 {
    font-size: 20px;
  }
  
  .problem-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .sample-input,
  .sample-output {
    flex-direction: column;
  }
  
  .sample-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
  
  .editor-container {
    height: 300px;
  }
  
  .test-input-textarea {
    height: 60px;
  }
  
  .run-output {
    max-height: 120px;
  }
  
  .problem-tabs {
    overflow-x: auto;
    white-space: nowrap;
    margin-bottom: 12px;
  }
  
  .tab-item {
    padding: 10px 16px;
    font-size: 14px;
  }
}

.output-label {
  font-size: 13px;
  color: #333;
  margin-bottom: 5px;
  font-weight: 500;
}

.error-label {
  color: #f5222d;
}

.error-output {
  background: #fff2f0;
  border-color: #ffccc7;
}

.compile-error {
  margin-bottom: 10px;
}

.no-output {
  padding: 10px;
  text-align: center;
  color: #666;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px dashed #d9d9d9;
}

.problem-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 16px;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  color: #595959;
  font-size: 16px;
  transition: all 0.3s;
  position: relative;
}

.tab-item.active {
  color: #1890ff;
  font-weight: 500;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: #1890ff;
  border-radius: 2px 2px 0 0;
}

.tab-item:hover {
  color: #40a9ff;
}

.tab-content {
  min-height: 400px;
}

.editor-header {
  padding: 12px 0;
  margin-bottom: 15px;
  border-bottom: 1px solid #eaeaea;
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.format-btn {
  padding: 8px;
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: all 0.3s;
}

.format-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
  background: #e6f7ff;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #666;
  text-align: center;
}

.placeholder-icon {
  color: #d9d9d9;
  margin-bottom: 16px;
}

.empty-placeholder h3 {
  margin: 0 0 8px;
  font-size: 18px;
  color: #333;
}

.empty-placeholder p {
  margin: 0;
  font-size: 14px;
  color: #999;
}

/* 提交记录表格样式 */
.submission-list {
  margin-top: 20px;
}

.submission-table {
  width: 100%;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: flex;
  background-color: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: 500;
  color: #333;
}

.table-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.3s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row:hover {
  background-color: #fafafa;
}

.table-header > div,
.table-row > div {
  padding: 12px 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-id, .cell-id {
  width: 8%;
  text-align: center;
}

.header-status, .cell-status {
  width: 18%;
  text-align: center;
}

.header-language, .cell-language {
  width: 15%;
}

.header-time, .cell-time {
  width: 25%;
}

.header-runtime, .cell-runtime,
.header-memory, .cell-memory {
  width: 12%;
  text-align: center;
}

.header-actions, .cell-actions {
  width: 10%;
  text-align: center;
}

.view-code-btn {
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.view-code-btn:hover {
  background: #40a9ff;
}

/* 状态样式 */
.status-success {
  color: #52c41a;
  font-weight: 500;
}

.status-error {
  color: #f5222d;
  font-weight: 500;
}

.status-warning {
  color: #faad14;
  font-weight: 500;
}

.status-info {
  color: #1890ff;
  font-weight: 500;
}

.status-default {
  color: #666;
}

/* 分页样式 */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding: 10px 0;
}

.page-total {
  color: #666;
  font-size: 14px;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 12px;
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
  background: #f5f5f5;
}

.page-info {
  color: #666;
  font-size: 14px;
}

/* 提交详情模态框 */
.submission-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1001;
}

.modal-content {
  position: relative;
  width: 80%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1002;
  display: flex;
  flex-direction: column;
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
  color: #999;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.3s;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.modal-loading {
  padding: 40px;
  text-align: center;
  color: #666;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  background: #f9f9f9;
  padding: 16px;
  border-radius: 4px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}

.detail-item .value {
  font-weight: 500;
  color: #333;
}

.code-container {
  margin-top: 16px;
}

.code-container h4 {
  margin: 0 0 12px 0;
  color: #333;
}

.source-code {
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  /* ... existing mobile styles ... */
  
  .submission-table {
    display: block;
    overflow-x: auto;
  }
  
  .table-header, .table-row {
    min-width: 800px;
  }
  
  .modal-content {
    width: 95%;
    max-height: 80vh;
  }
}
</style> 