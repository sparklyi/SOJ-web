<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail, getLanguages, runCode as runCodeAPI, submitCode as submitCodeAPI, getSubmissionList, getSubmissionDetail } from '../api/problem'
import { getContestRank, getContestDetail } from '../api/contest'
import { message } from 'ant-design-vue'
import { marked } from 'marked'
import { getUserId } from '../utils/auth'
import MonacoEditor from 'monaco-editor-vue3'

const route = useRoute()
const router = useRouter()
const problem = ref(null)
const loading = ref(false)
const code = ref('')
const language = ref('cpp')
const languageId = ref(null)
const showEditor = ref(true)
const languageOptions = ref([])
const runResult = ref(null)
const testInput = ref('')
const isRunning = ref(false)
const showTestPanel = ref(false)
const activeTab = ref('problem')

// 提交代码相关状态
const isSubmitting = ref(false)
const judgeResult = ref(null)
const showJudgeAnimation = ref(false)

// 提交记录相关
const submissionLoading = ref(false)
const submissionList = ref([])
const submissionTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const submissionDetail = ref(null)
const showSubmissionDetail = ref(false)
const submissionDetailLoading = ref(false)

// 竞赛排行榜数据
const rankLoading = ref(false)
const rankList = ref([])
const rankTotal = ref(0)

// 存储竞赛问题列表
const contestProblems = ref([])

// 存储竞赛信息
const contestInfo = ref(null)

// 获取当前竞赛ID
const getCurrentContestId = () => {
  // 先尝试从URL参数获取竞赛ID
  const contestIdFromQuery = route.query.contestId
  if (contestIdFromQuery) {
    return Number(contestIdFromQuery)
  }
  
  // 如果URL中没有，则从localStorage中获取
  const contestIdFromStorage = localStorage.getItem('current_contest_id')
  if (contestIdFromStorage) {
    return Number(contestIdFromStorage)
  }
  
  return null
}

// 获取竞赛状态相关数据
const getContestStatus = (contest) => {
  if (!contest) return { status: '未知', statusClass: '' }
  
  const now = new Date().getTime()
  const start = new Date(contest.started_at).getTime()
  const end = new Date(contest.ended_at).getTime()
  
  if (now < start) {
    return { status: '未开始', statusClass: 'upcoming' }
  } else if (now < end) {
    return { status: '进行中', statusClass: 'ongoing' }
  } else {
    return { status: '已结束', statusClass: 'ended' }
  }
}

// 格式化时间间隔
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  const h = hours % 24
  const m = minutes % 60
  const s = seconds % 60
  
  const parts = []
  if (h > 0) parts.push(`${h}小时`)
  if (m > 0) parts.push(`${m}分钟`)
  if (s > 0 || parts.length === 0) parts.push(`${s}秒`)
  
  return parts.join(' ')
}

// 格式化内存显示
const formatMemory = (memoryInBytes) => {
  if (memoryInBytes < 1024) {
    return memoryInBytes + 'B'
  } else if (memoryInBytes < 1024 * 1024) {
    return (memoryInBytes / 1024).toFixed(2) + 'KB'
  } else {
    return (memoryInBytes / (1024 * 1024)).toFixed(2) + 'MB'
  }
}

// 获取竞赛进度百分比
const getContestProgress = computed(() => {
  if (!contestInfo.value) return 0
  
  const now = new Date().getTime()
  const start = new Date(contestInfo.value.started_at).getTime()
  const end = new Date(contestInfo.value.ended_at).getTime()
  
  // 如果未开始
  if (now < start) return 0
  // 如果已结束
  if (now > end) return 100
  
  // 计算进度百分比
  const total = end - start
  const elapsed = now - start
  return Math.floor((elapsed / total) * 100)
})

// 获取剩余时间描述
const getContestRemainingTime = computed(() => {
  if (!contestInfo.value) return ''
  
  const now = new Date().getTime()
  const start = new Date(contestInfo.value.started_at).getTime()
  const end = new Date(contestInfo.value.ended_at).getTime()
  
  // 如果未开始
  if (now < start) {
    const diff = start - now
    return `距离开始还有 ${formatDuration(diff)}`
  }
  
  // 如果已结束
  if (now > end) {
    return '竞赛已结束'
  }
  
  // 计算剩余时间
  const diff = end - now
  return `距离结束还有 ${formatDuration(diff)}`
})

// 获取竞赛信息
const fetchContestInfo = async () => {
  const contestId = getCurrentContestId()
  if (!contestId) return
  
  try {
    const res = await getContestDetail(contestId)
    if (res.code === 200) {
      contestInfo.value = res.data
      
      // 尝试从竞赛详情中提取题目列表
      if (contestInfo.value.problem_set) {
        try {
          const problemList = JSON.parse(contestInfo.value.problem_set)
          if (problemList && problemList.length > 0) {
            contestProblems.value = problemList
            console.log('从竞赛详情获取到题目列表：', contestProblems.value)
          }
        } catch (e) {
          console.error('解析题目集失败:', e)
        }
      } else if (contestInfo.value.problemList && contestInfo.value.problemList.length > 0) {
        contestProblems.value = contestInfo.value.problemList
        console.log('从竞赛详情problemList获取到题目列表：', contestProblems.value)
      }
    }
  } catch (error) {
    console.error('获取竞赛信息失败:', error)
  }
}

// 获取题目详情
const fetchProblemDetail = async () => {
  loading.value = true
  try {
    const contestId = getCurrentContestId()
    const res = await getProblemDetail(route.params.id, contestId)
    if (res.code === 200) {
      problem.value = res.data
      // 确保样例存在，适配新API格式
      if (problem.value.example && !problem.value.samples) {
        problem.value.samples = problem.value.example.map(item => ({
          input: item.stdin,
          output: item.expected_output
        }))
      }
      
      // 如果没有样例，初始化一个空数组
      if (!problem.value.samples) {
        problem.value.samples = []
      }
    } else {
      console.error('获取题目详情失败:', res.message)
      message.error(res.message)
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
    message.error(error.response?.data?.message || '获取题目详情失败')
  } finally {
    loading.value = false
  }
}

// 转换Markdown内容为HTML
const parseMarkdown = (content) => {
  if (!content) return ''
  try {
    return marked(content)
  } catch (error) {
    console.error('Markdown解析错误:', error)
    return content
  }
}

// 计算属性：解析后的题目描述
const parsedDescription = computed(() => {
  return parseMarkdown(problem.value?.description || '')
})

// 计算属性：解析后的输入格式
const parsedInputFormat = computed(() => {
  return parseMarkdown(problem.value?.input_description || problem.value?.input_format || '')
})

// 计算属性：解析后的输出格式
const parsedOutputFormat = computed(() => {
  return parseMarkdown(problem.value?.output_description || problem.value?.output_format || '')
})

// 计算属性：解析后的备注
const parsedRemark = computed(() => {
  return parseMarkdown(problem.value?.remark || '')
})

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

// 切换编辑器显示状态（主要用于移动端）
const toggleEditor = () => {
  showEditor.value = !showEditor.value
}

// 从完整语言名称中提取简称
const getShortLanguageName = (fullName) => {
  if (fullName.includes('Python')) return 'python'
  if (fullName.includes('C++')) return 'cpp'
  if (fullName.includes('Java')) return 'java'
  if (fullName.includes('Go')) {
    // 区分不同版本的Go
    if (fullName.includes('1.13')) return 'go'
    if (fullName.includes('1.18')) return 'go'
    return 'go'
  }
  // 默认返回小写的语言名称
  return fullName.toLowerCase()
}

// 根据语言保存和获取本地存储的代码
const getStorageKey = (langName) => {
  return `code_${problem.value.ID}_${langName || language.value}`
}

// 在本地存储中加载代码
const loadCodeFromLocalStorage = (langName) => {
  if (!problem.value) return false
  const key = getStorageKey(langName)
  const savedCode = localStorage.getItem(key)
  if (savedCode) {
    code.value = savedCode
    return true
  }
  return false
}

// 保存代码到本地存储
const saveCodeToLocalStorage = (langName) => {
  if (!problem.value) return
  const key = getStorageKey(langName)
  localStorage.setItem(key, code.value)
}

// 设置默认代码
const setDefaultCode = (langName) => {
  if (!problem.value) return
  
  // 先尝试从本地存储加载代码
  if (loadCodeFromLocalStorage(langName)) {
    return
  }
  
  // 根据选择的语言设置默认代码模板
  const langToUse = langName || language.value
  switch (langToUse) {
    case 'cpp':
      code.value = `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\n// ${problem.value.name}\n\nint main() {\n    // 在这里编写代码\n    return 0;\n}`
      break
    case 'java':
      code.value = `import java.util.*;\n\npublic class Solution {\n    // ${problem.value.name}\n    \n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // 在这里编写代码\n    }\n}`
      break
    case 'python':
      code.value = `# ${problem.value.name}\n\n# 在这里编写代码\n`
      break
    case 'go':
      code.value = `package main\n\nimport (\n    "fmt"\n)\n\n// ${problem.value.name}\n\nfunc main() {\n    // 在这里编写代码\n}\n`
      break
    default:
      code.value = `// ${problem.value.name}\n\n// 在这里编写代码\n`
  }
  
  // 保存到本地存储
  saveCodeToLocalStorage(langToUse)
}

// 语言切换事件处理
const handleLanguageChange = (event) => {
  const newLang = event.target.value
  // 先保存当前语言的代码
  saveCodeToLocalStorage()
  
  // 更新语言
  language.value = newLang
  
  // 更新语言ID
  const selectedLang = languageOptions.value.find(opt => opt.value === newLang)
  if (selectedLang) {
    languageId.value = selectedLang.id
  }
  
  // 加载新语言的代码或设置默认代码
  loadCodeFromLocalStorage(newLang) || setDefaultCode(newLang)
}

// 切换自测面板
const toggleTestPanel = () => {
  showTestPanel.value = !showTestPanel.value
}

// 自测运行代码
const runCode = async () => {
  if (!code.value.trim()) {
    message.warning('请先编写代码')
    return
  }
  
  if (!languageId.value) {
    message.warning('请选择编程语言')
    return
  }
  
  isRunning.value = true
  runResult.value = null
  
  try {
    const res = await runCodeAPI({
      problem_id: Number(route.params.id),
      language_id: languageId.value,
      source_code: code.value,
      stdin: testInput.value
    })
    
    if (res.code === 200) {
      runResult.value = res.data
    } else {
      message.error(res.message || '运行失败')
    }
  } catch (error) {
    console.error('运行代码失败:', error)
    message.error('运行失败，请检查网络连接')
  } finally {
    isRunning.value = false
  }
}

// 提交代码
const submitCode = async () => {
  if (!code.value.trim()) {
    message.warning('请先编写代码')
    return
  }
  
  if (!languageId.value) {
    message.warning('请选择编程语言')
    return
  }
  
  isSubmitting.value = true
  showJudgeAnimation.value = true
  judgeResult.value = null
  
  try {
    const submitData = {
      problem_id: Number(route.params.id),
      language_id: languageId.value,
      source_code: code.value
    }
    
    // 如果是竞赛题目，添加竞赛ID
    const contestId = getCurrentContestId()
    if (contestId) {
      submitData.contest_id = contestId
    }
    
    const res = await submitCodeAPI(submitData)
    
    if (res.code === 200) {
      judgeResult.value = res.data
      message.success('提交成功')
      
      // 如果在提交记录选项卡，刷新提交记录
      if (activeTab.value === 'submissions') {
        await fetchSubmissionList()
      }
    } else {
      message.error(res.message || '提交失败')
    }
  } catch (error) {
    console.error('提交代码失败:', error)
    message.error('提交失败，请检查网络连接')
  } finally {
    isSubmitting.value = false
    // 延迟关闭动画
    setTimeout(() => {
      showJudgeAnimation.value = false
    }, 1500)
  }
}

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
  
  // 如果切换到提交记录标签页，加载提交记录
  if (tab === 'submissions') {
    fetchSubmissionList()
  } else if (tab === 'ranking') {
    // 如果切换到排行榜标签页，加载排行榜
    fetchRankList()
    // 确保每次切换到排行榜时都能看到最新的竞赛信息
    fetchContestInfo()
  }
}

// 获取提交记录
const fetchSubmissionList = async () => {
  submissionLoading.value = true
  try {
    // 添加竞赛ID和用户ID筛选
    const params = {
      problem_id: Number(route.params.id),
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 如果是竞赛题目，添加竞赛ID筛选
    const contestId = getCurrentContestId()
    if (contestId) {
      params.contest_id = contestId
    }
    
    // 如果用户已登录，添加用户ID筛选
    const userId = getUserId()
    if (userId) {
      params.user_id = Number(userId)
    }
    
    const res = await getSubmissionList(params)
    if (res.code === 200) {
      submissionList.value = res.data.detail || []
      submissionTotal.value = res.data.count || 0
    } else {
      console.error('获取提交记录失败:', res.message)
      message.error(res.message || '获取提交记录失败')
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
    } else {
      message.error(res.message || '获取提交详情失败')
    }
  } catch (error) {
    console.error('获取提交详情失败:', error)
    message.error('获取提交详情失败')
  } finally {
    submissionDetailLoading.value = false
  }
}

// 关闭提交详情对话框
const closeSubmissionDetail = () => {
  showSubmissionDetail.value = false
  submissionDetail.value = null
}

// 获取排行榜
const fetchRankList = async () => {
  const contestId = getCurrentContestId()
  if (!contestId) return
  
  rankLoading.value = true
  try {
    // 先获取竞赛详情，确保contestInfo中有最新的数据
    const detailRes = await getContestDetail(contestId)
    if (detailRes.code === 200) {
      contestInfo.value = detailRes.data
    }
    
    const res = await getContestRank(contestId)
    if (res.code === 200 && res.data) {
      rankList.value = res.data.detail || []
      rankTotal.value = res.data.count || 0
      
      // 确保problem_list存在并保存下来
      if (res.data.problem_list && res.data.problem_list.length > 0) {
        contestProblems.value = res.data.problem_list
        console.log('题目列表已获取:', contestProblems.value)
      } else {
        console.warn('排行榜返回的题目列表为空')
        
        // 如果排行榜API没有返回题目列表，尝试从竞赛详情获取
        if (contestInfo.value && contestInfo.value.problemList) {
          contestProblems.value = contestInfo.value.problemList
          console.log('从竞赛详情获取题目列表:', contestProblems.value)
        }
      }
    } else {
      message.error(res.message || '获取排行榜失败')
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
  } finally {
    rankLoading.value = false
  }
}

// 获取字母序号
const getLetterIndex = (index) => {
  return String.fromCharCode(65 + index) // A, B, C, D...
}

// 获取用户解题详情
const getProblemStatus = (userInfo, problemId) => {
  if (!userInfo || !userInfo.info || !userInfo.info.freeze || !userInfo.info.freeze.details) {
    return null
  }
  
  return userInfo.info.freeze.details[problemId] || null
}

// 获取题目状态样式
const getProblemStatusClass = (status) => {
  if (!status) return ''
  
  switch (status.status) {
    case 3: // 已通过
      return 'accepted'
    case 4: // 部分通过
      return 'partial'
    case 5: // 未通过
      return 'failed'
    default:
      return ''
  }
}

// 是否显示题目尝试次数和AC时间
const showProblemAttempt = (status) => {
  return status && (status.status === 3 || status.status === 4 || status.attempts > 0)
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 获取状态样式类名
const getStatusClass = (status) => {
  if (!status) return ''
  
  switch (status) {
    case 'Accepted':
      return 'status-accepted'
    case 'Wrong Answer':
      return 'status-wrong'
    case 'Time Limit Exceeded':
      return 'status-tle'
    case 'Memory Limit Exceeded':
      return 'status-mle'
    case 'Runtime Error':
      return 'status-runtime'
    case 'Compilation Error':
      return 'status-compile'
    case 'Pending':
    case 'Judging':
      return 'status-pending'
    default:
      return 'status-other'
  }
}

// 处理分页变化
const handlePageChange = (page) => {
  if (page < 1 || page > Math.ceil(submissionTotal.value / pageSize.value)) {
    return
  }
  currentPage.value = page
  fetchSubmissionList()
}

// 使用样例输入
const useExampleInput = (index) => {
  if (problem.value && problem.value.samples && problem.value.samples[index]) {
    testInput.value = problem.value.samples[index].input
    showTestPanel.value = true
  }
}

// 语言映射函数 - 将内部语言标识映射到 Monaco 支持的语言
const mapMonacoLanguage = (lang) => {
  const languageMap = {
    'cpp': 'cpp',
    'java': 'java',
    'python': 'python',
    'javascript': 'javascript',
    'js': 'javascript',
    'html': 'html',
    'go': 'go',
    'go1.13': 'go',
    'go1.18': 'go'
  }
  return languageMap[lang] || lang
}

// 生命周期钩子
onMounted(async () => {
  // 先获取竞赛信息，再获取题目详情和语言
  await fetchContestInfo() 
  fetchProblemDetail()
  fetchLanguages()
  
  // 如果当前有竞赛ID，获取排行榜数据
  if (getCurrentContestId()) {
    // 如果此时排行榜为空，获取排行榜数据
    if (!contestProblems.value || contestProblems.value.length === 0) {
      await fetchRankList()
    }
    
    // 默认展示题目
    activeTab.value = 'problem'
  }
})

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    fetchProblemDetail()
  }
})

// 当语言变化时，加载该语言的代码或设置默认代码
watch(language, (newLanguage) => {
  const matchedLanguage = languageOptions.value.find(opt => opt.value === newLanguage)
  if (matchedLanguage) {
    languageId.value = matchedLanguage.id
  }
  
  if (problem.value) {
    if (!loadCodeFromLocalStorage()) {
      // 如果没有保存的代码，则设置默认代码
      setDefaultCode()
    }
  }
})

// 检查是否是竞赛题目
const isContestProblem = computed(() => {
  return !!getCurrentContestId()
})
</script>

<template>
  <div class="problem-detail-container">
    <!-- 将标签栏移到最顶层 -->
    <div v-if="!loading && problem" class="problem-tabs">
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'problem' }"
        @click="switchTab('problem')"
      >
        题目描述
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'submissions' }"
        @click="switchTab('submissions')"
      >
        提交记录
      </div>
      <div 
        class="tab-item" 
        :class="{ active: activeTab === 'ranking' }"
        @click="switchTab('ranking')"
      >
        排行榜
      </div>
    </div>
    
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-else-if="!problem" class="empty">
      题目不存在
    </div>
    <div v-else class="problem-detail">
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
            <div class="section description-section">
              <h2>题目描述</h2>
              <div class="description markdown-body" v-html="parsedDescription"></div>
            </div>

            <div class="section input-section">
              <h2>输入格式</h2>
              <div class="input-format markdown-body" v-html="parsedInputFormat"></div>
            </div>

            <div class="section output-section">
              <h2>输出格式</h2>
              <div class="output-format markdown-body" v-html="parsedOutputFormat"></div>
            </div>

            <div class="section samples-section" v-if="problem.samples && problem.samples.length > 0">
              <h2>示例</h2>
              <div class="samples">
                <div v-for="(sample, index) in problem.samples" :key="index" class="sample">
                  <div class="sample-header">
                    <span class="sample-title">示例 {{ index + 1 }}</span>
                    <button class="use-example-btn" @click="useExampleInput(index)">使用此示例</button>
                  </div>
                  <div class="sample-content">
                    <div class="sample-input">
                      <div class="label">输入:</div>
                      <pre>{{ sample.input }}</pre>
                    </div>
                    <div class="sample-output">
                      <div class="label">输出:</div>
                      <pre>{{ sample.output }}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="section remark-section" v-if="problem.remark">
              <h2>备注</h2>
              <div class="remark markdown-body" v-html="parsedRemark"></div>
            </div>
          </div>
        </div>
        
        <!-- 右侧代码编辑器 -->
        <div class="editor-container" :class="{ 'hidden-mobile': !showEditor }">
          <div class="editor-header">
            <div class="editor-toolbar">
              <div class="language-selector">
                <select id="language" v-model="language" @change="handleLanguageChange">
                  <option v-for="lang in languageOptions" :key="lang.id" :value="lang.value">
                    {{ lang.label }}
                  </option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="code-editor">
            <MonacoEditor
              v-model:value="code"
              :language="mapMonacoLanguage(language)"
              theme="vs-dark"
              @change="saveCodeToLocalStorage"
              :options="{
                automaticLayout: true,
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
                fontSize: 14
              }"
              style="height: 100%;"
            />
          </div>
          
          <!-- 测试面板 -->
          <div v-if="showTestPanel" class="test-panel">
            <div class="test-input">
              <div class="panel-header">测试输入</div>
              <textarea 
                v-model="testInput" 
                class="test-textarea" 
                placeholder="输入测试样例..."
              ></textarea>
            </div>
            <div class="test-output" v-if="runResult">
              <div class="panel-header">
                <span>测试输出</span>
                <span class="status-badge" :class="runResult.status">
                  {{ runResult.status }}
                </span>
              </div>
              <div class="output-content">
                <pre v-if="runResult.stdout">{{ runResult.stdout }}</pre>
                <pre v-else-if="runResult.stderr" class="error-output">{{ runResult.stderr }}</pre>
                <div v-else class="empty-output">运行完成，无输出</div>
              </div>
              <div class="run-stats" v-if="runResult.time">
                <span>运行耗时: {{ runResult.time }}s</span>
                <span>内存使用: {{ formatMemory(runResult.memory) }}</span>
              </div>
            </div>
            <div class="test-actions">
              <button 
                class="run-btn" 
                @click="runCode" 
                :disabled="isRunning"
              >
                {{ isRunning ? '运行中...' : '运行' }}
              </button>
            </div>
          </div>
          
          <div class="editor-footer">
            <button class="run-btn" @click="toggleTestPanel">{{ showTestPanel ? '隐藏自测' : '自测' }}</button>
            <button class="submit-btn" @click="submitCode" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : '提交代码' }}
            </button>
          </div>
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
              <div class="cell-memory">{{ item.memory ? formatMemory(item.memory) : '-' }}</div>
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
              <span class="page-info">{{ currentPage }} / {{ Math.floor(submissionTotal / pageSize) }}</span>
              <button 
                class="page-btn" 
                :disabled="currentPage > Math.floor(submissionTotal / pageSize)"
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
                  <span class="value">{{ formatMemory(submissionDetail?.memory) }}</span>
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
      
      <!-- 排行榜内容 -->
      <div v-else-if="activeTab === 'ranking'" class="ranking-content">
        <div class="ranking-list card">
          <h2>排行榜</h2>
          
          <div v-if="rankLoading" class="loading-row">加载中...</div>
          <div v-else-if="rankList.length === 0" class="empty-ranking">
            <div class="empty-icon">🏆</div>
            <div class="empty-text">暂无排名数据</div>
          </div>
          <div v-else class="rank-table-container">
            <div class="contest-problems">
              <h3>竞赛题目</h3>
              <div class="problem-list">
                <div v-for="(problem, index) in contestProblems" :key="problem.id" class="problem-item">
                  <span class="problem-letter">{{ getLetterIndex(index) }}</span>
                  <span class="problem-name">{{ problem.name }}</span>
                </div>
              </div>
            </div>
            
            <table class="rank-table">
              <thead>
                <tr>
                  <th class="rank-number">排名</th>
                  <th class="user-name">参赛者</th>
                  <th class="solved-count">通过题数</th>
                  <th class="total-score">总分</th>
                  <th class="total-penalty">罚时</th>
                  <!-- 为每个题目创建一列，以字母命名 -->
                  <template v-if="contestProblems && contestProblems.length > 0">
                    <th 
                      v-for="(problem, index) in contestProblems" 
                      :key="problem.id" 
                      class="problem-status"
                    >
                      {{ getLetterIndex(index) }}
                    </th>
                  </template>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(user, index) in rankList" :key="index">
                  <td class="rank-number">{{ index + 1 }}</td>
                  <td class="user-name">{{ user.apply_name }}</td>
                  <td class="solved-count">
                    {{ user.info && user.info.freeze ? user.info.freeze.accepted_count : 0 }}
                  </td>
                  <td class="total-score">
                    {{ user.info && user.info.freeze ? user.info.freeze.score_count : 0 }}
                  </td>
                  <td class="total-penalty">
                    {{ user.info && user.info.freeze && user.info.freeze.penalty_count ? 
                      Math.floor(user.info.freeze.penalty_count)  : '-' }}
                  </td>
                  
                  <!-- 题目状态列 -->
                  <template v-if="contestProblems && contestProblems.length > 0">
                    <td 
                      v-for="problem in contestProblems" 
                      :key="problem.id" 
                      class="problem-status"
                      :class="getProblemStatusClass(getProblemStatus(user, problem.id))"
                    >
                      <template v-if="getProblemStatus(user, problem.id)">
                        <template v-if="getProblemStatus(user, problem.id).status === 3">
                          <!-- 已通过，显示尝试次数 -->
                          {{ getProblemStatus(user, problem.id).count || 0 }}
                        </template>
                        <template v-else>
                          <!-- 未通过，显示红色尝试次数 -->
                          <span class="failed-count">{{ getProblemStatus(user, problem.id).count || 0 }}</span>
                        </template>
                      </template>
                      <template v-else>-</template>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 判题动画 -->
    <div class="judge-animation" v-if="showJudgeAnimation">
      <div class="animation-container">
        <div class="judge-loading" v-if="!judgeResult">
          <div class="loading-text">正在判题...</div>
        </div>
        <div class="judge-result" v-else>
          <div class="result-status" :class="judgeResult.status === 'Accepted' ? 'success' : 'error'">
            {{ judgeResult.status }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-detail-container {
  width: 135%;
  max-width: none;
  padding: 20px;
  margin-left: -17%;
  background-color: #f6f8fa;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.problem-tabs {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  background: white;
  margin-bottom: 16px;
  border-radius: 4px 4px 0 0;
  overflow-x: auto;
}

.tab-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 15px;
  position: relative;
  transition: all 0.3s;
  white-space: nowrap;
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
}

.tab-item:hover:not(.active) {
  color: #40a9ff;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #666;
  background: white;
  border-radius: 4px;
}

.empty {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: 16px;
  color: #666;
  background: white;
  border-radius: 4px;
}

.problem-detail {
  background: white;
  border-radius: 4px;
  min-height: 600px;
}

.mobile-toggle {
  display: none;
  margin-bottom: 16px;
}

.toggle-btn {
  width: 100%;
  padding: 8px 0;
  background: #f0f2f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.3s;
}

.toggle-btn:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.split-layout {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 160px); /* 增加高度 */
  min-height: 600px;
  max-width: 1600px; /* 增加最大宽度 */
  margin: 0 auto; /* 居中 */
  overflow: hidden;
}

.problem-info {
  width: 45%; /* 调整宽度比例 */
  padding: 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

.problem-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.problem-header h1 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #333;
}

.problem-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
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
  font-size: 12px;
  color: #999;
}

.problem-content {
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.section {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s;
  width: 100%;
}

.section:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.section h2 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 18px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.description,
.input-format,
.output-format,
.remark {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
}

.markdown-body {
  font-size: 15px;
  line-height: 1.6;
}

.markdown-body pre {
  background-color: #f6f8fa;
  border-radius: 4px;
  padding: 12px;
  margin: 12px 0;
  overflow-x: auto;
}

.markdown-body code {
  background-color: #f6f8fa;
  border-radius: 3px;
  padding: 2px 4px;
  font-family: monospace;
}

.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
}

.markdown-body table th,
.markdown-body table td {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}

.markdown-body table th {
  background-color: #f6f8fa;
}

.samples {
  display: grid;
  gap: 15px;
}

.sample {
  background: #f9f9f9;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #eaeaea;
  transition: transform 0.2s, box-shadow 0.2s;
}

.sample:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 8px 12px;
  background: #fafafa;
  font-weight: 500;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
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
  transition: all 0.3s;
}

.use-example-btn:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sample-content {
  padding: 12px;
}

.sample-input, .sample-output {
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  overflow: hidden;
}

.label {
  color: #666;
  font-size: 14px;
  padding: 8px 12px;
  background: #f5f5f5;
  border-bottom: 1px solid #eaeaea;
  font-weight: 500;
}

.sample-input pre, .sample-output pre {
  margin: 0;
  padding: 12px;
  background: white;
  border-radius: 4px;
  overflow-x: auto;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.editor-container {
  width: 55%; /* 调整宽度比例 */
  display: flex;
  flex-direction: column;
  border-left: 1px solid #f0f0f0;
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.language-selector label {
  font-size: 14px;
  color: #666;
}

.language-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
}

.code-editor {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #1e1e1e;
}

/* 为CodeMirror编辑器添加样式 */
:deep(.cm-editor) {
  height: 100%;
  font-size: 14px;
}

:deep(.cm-content) {
  padding: 8px;
}

:deep(.cm-focused) {
  outline: none;
}

.editor-textarea {
  display: none;
}

.test-panel {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 500;
  font-size: 14px;
  color: #666;
}

.test-textarea {
  width: 100%;
  height: 100px;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  resize: none;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
}

.test-output {
  margin-top: 16px;
}

.output-content {
  padding: 8px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}

.output-content pre {
  margin: 0;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  white-space: pre-wrap;
}

.error-output {
  color: #ff4d4f;
}

.empty-output {
  padding: 8px;
  color: #999;
  text-align: center;
  font-style: italic;
}

.run-stats {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.test-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: normal;
}

.status-badge.Accepted, .status-badge.success {
  background: #f6ffed;
  color: #52c41a;
}

.status-badge.error {
  background: #fff1f0;
  color: #ff4d4f;
}

.editor-footer {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid #f0f0f0;
}

.run-btn, .submit-btn {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.run-btn {
  background: white;
  color: #1890ff;
  border: 1px solid #1890ff;
}

.run-btn:hover:not(:disabled) {
  background: #e6f7ff;
}

.submit-btn {
  background: #1890ff;
  color: white;
  border: none;
  flex: 1;
}

.submit-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.submit-btn:disabled, .run-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.judge-animation {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.animation-container {
  background: white;
  border-radius: 8px;
  padding: 24px;
  width: 80%;
  max-width: 400px;
  text-align: center;
}

.judge-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  font-size: 18px;
  color: #666;
}

.judge-result {
  padding: 16px;
}

.result-status {
  font-size: 24px;
  font-weight: 600;
}

.result-status.success {
  color: #52c41a;
}

.result-status.error {
  color: #ff4d4f;
}

/* 排行榜样式 */
.ranking-content {
  padding: 20px;
  background: white;
}

.ranking-list {
  margin-bottom: 20px;
}

.ranking-list h2 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 18px;
  color: #333;
  position: relative;
  padding-left: 12px;
}

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

/* 竞赛题目列表样式 */
.contest-problems {
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  border: 1px solid #eee;
}

.contest-problems h3 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}

.problem-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.problem-item {
  padding: 6px 12px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.problem-letter {
  font-weight: bold;
  color: #1890ff;
}

.problem-name {
  color: #333;
}

/* 竞赛进度条样式 */
.contest-progress-container {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 4px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-status {
  font-weight: 500;
  color: #333;
}

.progress-time {
  color: #666;
}

.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.loading-row {
  text-align: center;
  padding: 30px;
  color: #666;
}

.empty-ranking {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
}

.rank-table-container {
  overflow-x: auto;
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.rank-table th,
.rank-table td {
  padding: 12px;
  text-align: center;
  border-bottom: 1px solid #eee;
  vertical-align: middle;
}

.rank-table th {
  font-weight: 500;
  background: #fafafa;
  position: sticky;
  top: 0;
  z-index: 1;
}

.rank-table tr:hover {
  background-color: #f5f5f5;
}

.user-name {
  text-align: left;
  font-weight: 500;
}

.problem-status {
  width: 60px;
}

.failed-count {
  color: #ff4d4f;
}

/* 问题状态样式 */
.accepted {
  background-color: #d4edda;
}

.partial {
  background-color: #fff3cd;
}

.failed {
  background-color: #f8d7da;
}

/* 提交记录选项卡样式 */
.submissions-tab {
  padding: 20px;
}

.submission-list {
  background: white;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #999;
}

.placeholder-icon {
  margin-bottom: 16px;
  color: #d9d9d9;
}

.empty-placeholder h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #666;
}

.empty-placeholder p {
  margin: 0;
  font-size: 14px;
}

.submission-table {
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 80px 120px 120px 180px 100px 100px 1fr;
  background: #fafafa;
  padding: 12px 16px;
  font-weight: 500;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.table-row {
  display: grid;
  grid-template-columns: 80px 120px 120px 180px 100px 100px 1fr;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
}

.table-row:hover {
  background: #f5f5f5;
}

.cell-id, .header-id {
  font-weight: 500;
}

.cell-status, .header-status {
  font-weight: 500;
}

.status-accepted {
  color: #52c41a;
}

.status-wrong {
  color: #ff4d4f;
}

.status-tle {
  color: #faad14;
}

.status-mle {
  color: #faad14;
}

.status-runtime {
  color: #ff4d4f;
}

.status-compile {
  color: #ff4d4f;
}

.status-pending {
  color: #1890ff;
}

.status-other {
  color: #666;
}

.view-code-btn {
  background: transparent;
  color: #1890ff;
  border: none;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.view-code-btn:hover {
  color: #40a9ff;
  text-decoration: underline;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.page-total {
  font-size: 14px;
  color: #666;
}

.page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-btn {
  padding: 4px 12px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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

.page-info {
  font-size: 14px;
  color: #666;
}

.submission-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1001;
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
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #999;
}

.modal-loading {
  padding: 30px;
  text-align: center;
  color: #666;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.detail-info {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
}

.label {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.value {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.code-container {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.code-container h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.source-code {
  margin: 0;
  padding: 16px;
  background: white;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Courier New', Courier, monospace;
  font-size: 14px;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .split-layout {
    flex-direction: column;
    height: auto;
  }
  
  .problem-info, .editor-container {
    width: 100%;
    height: auto;
  }
  
  .editor-container {
    height: 500px;
  }
  
  .hidden-mobile {
    display: none;
  }
  
  .mobile-toggle {
    display: flex;
    justify-content: center;
    margin: 10px 0;
  }
  
  .table-header, .table-row {
    grid-template-columns: 60px 100px 100px 1fr;
  }
  
  .header-runtime, .header-memory, .header-actions,
  .cell-runtime, .cell-memory, .cell-actions {
    display: none;
  }
}
</style> 