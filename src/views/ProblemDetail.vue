<script setup>
import { ref, onMounted, computed, watch, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail, getLanguages, runCode as runCodeAPI, submitCode as submitCodeAPI, getSubmissionList, getSubmissionDetail, getProblemJudgeCount, getProblemRanking } from '../api/problem'
import { message, Tabs } from 'ant-design-vue'
import * as echarts from 'echarts'
import { marked } from 'marked'
import { getUserId } from '../utils/auth'
// import lottie from 'lottie-web'

const TabPane = Tabs.TabPane

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
const activeTab = ref('problem') // 当前激活的选项卡: problem, solution, submissions, statistics

// 提交代码相关状态
const isSubmitting = ref(false) // 是否正在提交代码
const judgeResult = ref(null) // 判题结果
const showJudgeAnimation = ref(false) // 是否显示判题动画

// 提交记录相关
const submissionLoading = ref(false)
const submissionList = ref([])
const submissionTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const submissionDetail = ref(null)
const showSubmissionDetail = ref(false)
const submissionDetailLoading = ref(false)

// 动画引用对象
const lottieContainer = ref(null)
const loadingAnimation = ref(null)
const successAnimation = ref(null)
const errorAnimation = ref(null)
const warningAnimation = ref(null)

// 竞赛排行榜数据
const rankLoading = ref(false)
const rankList = ref([])
const rankTotal = ref(0)
const contestInfo = ref(null)

// 统计数据相关
const statisticsLoading = ref(false)
const pieChart = ref(null)
const judgeCount = ref({}) // 从API获取的题目判题统计
const statusColors = {
  'Accepted': '#52c41a',
  'Wrong Answer': '#f5222d',
  'Time Limit Exceeded': '#faad14',
  'Memory Limit Exceeded': '#fa8c16',
  'Runtime Error': '#eb2f96',
  'Compilation Error': '#1890ff',
  'Unknown Error': '#8c8c8c'
}

// 排行榜数据
const rankingLoading = ref(false)
const timeRanking = ref([])
const memoryRanking = ref([])

// 计算总提交数
const totalSubmissions = computed(() => {
  let total = 0
  for (const key in judgeCount.value) {
    total += parseInt(judgeCount.value[key] || 0)
  }
  return total
})

// 计算通过提交数
const acceptedSubmissions = computed(() => {
  return parseInt(judgeCount.value['Accepted'] || 0)
})

// 计算通过率
const passRate = computed(() => {
  if (totalSubmissions.value === 0) return 0
  return Math.round((acceptedSubmissions.value / totalSubmissions.value) * 100)
})

// 获取题目判题统计数据
const fetchJudgeCount = async () => {
  statisticsLoading.value = true
  try {
    const res = await getProblemJudgeCount(route.params.id)
    if (res.code === 200) {
      judgeCount.value = res.data
      nextTick(() => {
        initStatisticsCharts()
      })
    } else {
      message.error(res.message || '获取题目统计数据失败')
    }
  } catch (error) {
    console.error('获取题目统计数据失败:', error)
    message.error('获取题目统计数据失败')
  } finally {
    statisticsLoading.value = false
  }
}

// 获取题目排行榜
const fetchProblemRanking = async () => {
  rankingLoading.value = true
  try {
    const res = await getProblemRanking(route.params.id)
    if (res.code === 200 && Array.isArray(res.data)) {
      // 直接使用API返回的数据
      timeRanking.value = res.data.map((item, index) => ({
        rank: index + 1,
        submissionId: item.ID,
        username: item.user_name,
        time: item.time.toFixed(3) + 's',
        memory: formatMemory(item.memory),
        language: item.language,
        // 保存完整的原始数据，便于查看详情
        originalData: item
      }))
      
      // memoryRanking不再需要单独排序
      memoryRanking.value = timeRanking.value
    } else {
      message.error(res.message || '获取排行榜失败')
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    message.error('获取排行榜失败')
  } finally {
    rankingLoading.value = false
  }
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

// 获取当前竞赛ID（如果存在）
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

// 检查是否是竞赛题目
const isContestProblem = computed(() => {
  return !!getCurrentContestId()
})

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
      
      // 如果没有样例，初始化一个空数组
      if (!problem.value.samples) {
        problem.value.samples = []
      }
      
      console.log('题目详情获取成功:', problem.value)
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

// 从完整语言名称中提取简称
const getShortLanguageName = (fullName) => {
  if (fullName.includes('Python')) return 'python'
  if (fullName.includes('C++')) return 'cpp'
  if (fullName.includes('Java')) return 'java'
  if (fullName.includes('Go')) {
    // 区分不同版本的Go
    if (fullName.includes('1.13')) return 'go1.13'
    if (fullName.includes('1.18')) return 'go1.18'
    return 'go'
  }
  // 默认返回小写的语言名称
  return fullName.toLowerCase()
}

// 设置默认代码
const setDefaultCode = () => {
  if (!problem.value) return
  
  // 先尝试从本地存储加载代码
  if (loadCodeFromLocalStorage()) {
    return
  }
  
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
    // 尝试加载缓存的代码，如果没有则使用默认模板
    if (!loadCodeFromLocalStorage()) {
      setDefaultCode()
    }
  }
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
    isSubmitting.value = true
    judgeResult.value = null
    showJudgeAnimation.value = true
    
    // 保存代码到本地
    saveCodeToLocalStorage()
    
    const params = {
      problem_id: Number(route.params.id),
      source_code: code.value,
      language_id: languageId.value,
    }
    
    const res = await submitCodeAPI(params)
    
    if (res.code === 200) {
      message.success('提交成功')
      judgeResult.value = res.data
      
      // 不再跳转到提交记录选项卡
    } else {
      message.error(res.message || '提交失败')
    }
  } catch (error) {
    console.error('提交代码失败:', error)
    message.error('提交代码失败: ' + (error.message || '未知错误'))
  } finally {
    isSubmitting.value = false
    setTimeout(() => {
      showJudgeAnimation.value = false
    }, 1500)
  }
}

// 获取提交记录列表
const fetchSubmissionList = async () => {
  submissionLoading.value = true
  try {
    const res = await getSubmissionList({
      problem_id: Number(route.params.id),
      page: currentPage.value,
      page_size: pageSize.value,
      user_id: Number(getUserId())
    })
    
    if (res.code === 200) {
      submissionList.value = res.data.detail || []
      submissionTotal.value = res.data.count || 0
    } else {
      message.error(res.message)
    }
  } catch (error) {
    console.error('获取提交记录失败:', error)
    message.error(error.response?.data?.message || '获取提交记录失败')
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
      message.error(res.message)
    }
  } catch (error) {
    console.error('获取提交详情失败:', error)
    message.error(error.response?.data?.message || '获取提交详情失败')
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

// 获取判题状态样式
const getJudgeStatusClass = (status) => {
  if (status === 'Accepted') return 'judge-success'
  if (status === 'Wrong Answer') return 'judge-error'
  if (status.includes('Time Limit') || status.includes('Memory Limit')) return 'judge-warning'
  if (status.includes('Error')) return 'judge-error'
  return 'judge-default'
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
watch(() => activeTab.value, (newTab) => {
  if (newTab === 'submissions') {
    fetchSubmissions()
  } else if (newTab === 'statistics') {
    // 获取题目统计数据
    fetchJudgeCount()
    // 获取排行榜数据
    fetchProblemRanking()
  }
})

// 使用样例输入
const useExampleInput = (index) => {
  if (problem.value && problem.value.samples && problem.value.samples[index]) {
    testInput.value = problem.value.samples[index].input
    showTestPanel.value = true
  }
}

// 代码缓存相关函数
const getLocalStorageKey = () => {
  return `soj_code_${route.params.id}_${languageId.value}`
}

const saveCodeToLocalStorage = () => {
  try {
    const key = getLocalStorageKey()
    localStorage.setItem(key, code.value)
  } catch (error) {
    console.error('保存代码到本地失败:', error)
  }
}

const loadCodeFromLocalStorage = () => {
  try {
    const key = getLocalStorageKey()
    const savedCode = localStorage.getItem(key)
    if (savedCode) {
      code.value = savedCode
      return true
    }
  } catch (error) {
    console.error('从本地加载代码失败:', error)
  }
  return false
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
    
    const result = await runCodeAPI({
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
  // 保存当前的弹窗状态
  const wasSubmissionDetailVisible = showSubmissionDetail.value
  const currentSubmissionDetail = submissionDetail.value
  
  activeTab.value = tab
  
  // 当切换到提交记录选项卡时获取提交记录
  if (tab === 'submissions') {
    fetchSubmissions()
  } else if (tab === 'statistics') {
    // 获取题目统计数据
    fetchJudgeCount()
    // 获取排行榜数据
    fetchProblemRanking()
  }
  
  // 如果之前弹窗是开着的，确保切换后仍然显示
  if (wasSubmissionDetailVisible && currentSubmissionDetail) {
    submissionDetail.value = currentSubmissionDetail
    nextTick(() => {
      showSubmissionDetail.value = true
    })
  }
}

// 处理Tab键
const handleTabKey = (event) => {
  if (event.key === 'Tab') {
    event.preventDefault()
    const cursorPosition = event.target.selectionStart
    const cursorEnd = event.target.selectionEnd
    
    // 在光标位置插入Tab字符
    code.value = code.value.slice(0, cursorPosition) + '\t' + code.value.slice(cursorEnd)
    
    // 手动更新光标位置
    setTimeout(() => {
      event.target.selectionStart = event.target.selectionEnd = cursorPosition + 1
    }, 0)
  }
}

// 初始化Lottie动画
const initLottieAnimations = () => {
  // 加载中动画
  loadingAnimation.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: true,
    autoplay: false,
    path: 'https://assets6.lottiefiles.com/packages/lf20_x62chJ.json' // 加载中动画
  })
  
  // 成功动画
  successAnimation.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: 'https://assets7.lottiefiles.com/packages/lf20_jAT409.json' // 成功动画
  })
  
  // 错误动画
  errorAnimation.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: 'https://assets9.lottiefiles.com/packages/lf20_ckcn4hvm.json' // 错误动画
  })
  
  // 警告动画
  warningAnimation.value = lottie.loadAnimation({
    container: lottieContainer.value,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: 'https://assets2.lottiefiles.com/temp/lf20_WdDF6Z.json' // 警告动画
  })
}

// 播放评测动画
const playJudgeAnimation = (status) => {
  // 停止所有动画
  loadingAnimation.value?.stop()
  successAnimation.value?.stop()
  errorAnimation.value?.stop()
  warningAnimation.value?.stop()
  
  // 根据状态播放对应动画
  if (!status) {
    loadingAnimation.value?.play()
    return
  }
  
  if (status === 'Accepted') {
    successAnimation.value?.play()
  } else if (status === 'Wrong Answer' || status.includes('Error')) {
    errorAnimation.value?.play()
  } else if (status.includes('Time Limit') || status.includes('Memory Limit')) {
    warningAnimation.value?.play()
  } else {
    loadingAnimation.value?.play()
  }
}

// 判题状态对应的图标和消息
const getJudgeStatusInfo = (status) => {
  if (!status) {
    return {
      icon: '⏳',
      message: '评测中...',
      description: '正在提交您的代码并进行评测'
    }
  }
  
  if (status === 'Accepted') {
    return {
      icon: '✅',
      message: '通过',
      description: '恭喜，您的代码已通过所有测试用例！'
    }
  } else if (status === 'Wrong Answer') {
    return {
      icon: '❌',
      message: '答案错误',
      description: '您的代码输出与预期结果不符'
    }
  } else if (status.includes('Time Limit')) {
    return {
      icon: '⏱️',
      message: '超时',
      description: '您的代码运行时间超出限制'
    }
  } else if (status.includes('Memory Limit')) {
    return {
      icon: '📈',
      message: '内存超限',
      description: '您的代码使用的内存超出限制'
    }
  } else if (status.includes('Compilation Error')) {
    return {
      icon: '🛠️',
      message: '编译错误',
      description: '您的代码存在语法错误，无法编译'
    }
  } else if (status.includes('Error')) {
    return {
      icon: '⚠️',
      message: '错误',
      description: '运行时发生错误'
    }
  } else {
    return {
      icon: '❓',
      message: status,
      description: '未知状态'
    }
  }
}

// 修复点击题目不显示问题
watch(route, (newRoute) => {
  if (newRoute.params.id) {
    fetchProblemDetail()
  }
}, { immediate: true })

onMounted(() => {
  fetchProblemDetail()
  fetchLanguages()
  
  // 检查是否从竞赛页面跳转而来
  if (getCurrentContestId()) {
    console.log('从竞赛页面跳转而来，竞赛ID:', getCurrentContestId())
  }
  
  // 卸载前移除事件监听器
  return () => {
    if (pieChart.value) {
      window.removeEventListener('resize', pieChart.value.resize)
      pieChart.value.dispose()
    }
  }
})

// 筛选当前用户在当前竞赛的提交记录
const fetchSubmissions = async () => {
  submissionLoading.value = true
  try {
    // 添加题目ID和用户ID筛选
    const params = {
      problem_id: Number(route.params.id),
      page: currentPage.value,
      size: pageSize.value
    }
    
    // 不再携带contest_id参数
    
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

// 获取排行榜
const fetchRankList = async () => {
  const contestId = getCurrentContestId()
  if (!contestId) return
  
  rankLoading.value = true
  try {
    const res = await getContestRank(contestId)
    if (res.code === 200 && res.data) {
      rankList.value = res.data.detail || []
      rankTotal.value = res.data.count || 0
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

// 初始化统计图表
const initStatisticsCharts = () => {
  // 确保DOM元素已经渲染完成
  nextTick(() => {
    // 确保DOM元素存在
    const chartDom = document.getElementById('status-distribution-chart')
    if (chartDom) {
      // 如果已有实例，先销毁
      if (pieChart.value) {
        pieChart.value.dispose()
      }
      
      // 初始化饼图
      pieChart.value = echarts.init(chartDom)
      
      // 准备数据
      const data = []
      let totalCount = 0
      
      // 首先计算总提交数，排除count字段
      for (const [status, count] of Object.entries(judgeCount.value)) {
        if (status !== 'count') {
          totalCount += parseInt(count)
        }
      }
      
      // 然后添加各状态的数据
      for (const [status, count] of Object.entries(judgeCount.value)) {
        if (status !== 'count') { // 排除count字段
          data.push({
            value: parseInt(count),
            name: status,
            itemStyle: {
              color: statusColors[status] || '#8c8c8c'
            }
          })
        }
      }
      
      // 配置饼图选项
      const option = {
        title: {
          text: '提交状态分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {d}%'
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          data: Object.keys(judgeCount.value).filter(key => key !== 'count') // 从图例中排除count
        },
        series: [
          {
            name: '提交状态',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold',
                formatter: '{b}: {d}%'
              }
            },
            labelLine: {
              show: false
            },
            data: data
          }
        ]
      }
      
      // 应用配置
      pieChart.value.setOption(option)
      
      // 处理窗口大小变化
      window.addEventListener('resize', () => {
        if (pieChart.value) {
          pieChart.value.resize()
        }
      })
    }
  })
}

// 释放图表资源
const disposeCharts = () => {
  if (pieChart.value) {
    pieChart.value.dispose()
    pieChart.value = null
  }
}

// 卸载组件时清理资源
onUnmounted(() => {
  disposeCharts()
  window.removeEventListener('resize', () => {
    if (pieChart.value) {
      pieChart.value.resize()
    }
  })
})

// 自定义标签页状态
const activeRankTab = ref('time')

// 切换排行榜标签页
const switchRankTab = (tab) => {
  activeRankTab.value = tab
}

// 查看排行榜中的提交详情
const viewRankSubmissionDetail = (submissionId) => {
  if (!submissionId) return
  
  // 在排行榜中查找对应submissionId的数据
  const submissionData = timeRanking.value.find(item => item.submissionId === submissionId)
  
  if (submissionData && submissionData.originalData) {
    // 重要：先关闭可能已经打开的模态窗
    showSubmissionDetail.value = false
    
    // 然后设置数据
    submissionDetail.value = submissionData.originalData
    submissionDetailLoading.value = false
    
    // 使用nextTick确保DOM更新后再显示模态窗
    nextTick(() => {
      showSubmissionDetail.value = true
      console.log('显示提交详情:', submissionId, showSubmissionDetail.value)
    })
  } else {
    message.warning('未找到对应的提交详情')
  }
}
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
        :class="{ active: activeTab === 'statistics' }"
        @click="switchTab('statistics')"
      >
        统计
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
            <div class="section">
              <h2>题目描述</h2>
              <div class="description markdown-body" v-html="parsedDescription"></div>
            </div>

            <div class="section">
              <h2>输入格式</h2>
              <div class="input-format markdown-body" v-html="parsedInputFormat"></div>
            </div>

            <div class="section">
              <h2>输出格式</h2>
              <div class="output-format markdown-body" v-html="parsedOutputFormat"></div>
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
            
            <div class="section" v-if="problem.remark">
              <h2>备注</h2>
              <div class="remark markdown-body" v-html="parsedRemark"></div>
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
              @keydown="handleTabKey"
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
            <button class="submit-btn" @click="submitCode" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : '提交代码' }}
            </button>
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
      </div>
      
      <!-- 统计选项卡 -->
      <div v-else-if="activeTab === 'statistics'" class="tab-content statistics-tab">
        <div v-if="statisticsLoading && rankingLoading" class="loading">加载中...</div>
        <div v-else class="statistics-content">
          <!-- 题目通过率信息卡片 -->
          <div class="stat-card">
            <h2>题目通过率</h2>
            <div class="pass-rate-container">
              <div class="pass-rate-circle" :style="{ background: `conic-gradient(#52c41a ${passRate}%, #f5f5f5 0)` }">
                <div class="inner-circle">
                  <span class="pass-rate-text">{{ passRate }}%</span>
                </div>
              </div>
              <div class="pass-rate-info">
                <div class="info-item">
                  <div class="info-title">总提交数</div>
                  <div class="info-value">{{ totalSubmissions }}</div>
                </div>
                <div class="info-item">
                  <div class="info-title">通过提交数</div>
                  <div class="info-value">{{ acceptedSubmissions }}</div>
                </div>
                <div class="info-item">
                  <div class="info-title">难度级别</div>
                  <div class="info-value">{{ problem.level === 'easy' ? '简单' : problem.level === 'mid' ? '中等' : '困难' }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 提交状态分布图表 -->
          <div class="stat-card">
            <h2>提交状态分布</h2>
            <div v-if="statisticsLoading" class="chart-loading">加载中...</div>
            <div v-else-if="Object.keys(judgeCount).length === 0" class="empty-chart">
              暂无提交数据
            </div>
            <div v-else id="status-distribution-chart" class="chart-container"></div>
          </div>
          
          <!-- 排行榜卡片 -->
          <div class="stat-card ranking-section">
            <h2>排行榜</h2>
            <div v-if="rankingLoading" class="chart-loading">加载中...</div>
            <div v-else-if="timeRanking.length === 0" class="empty-chart">
              暂无排行数据
            </div>
            <div v-else class="rank-table-wrapper">
              <table class="rank-table">
                <thead>
                  <tr>
                    <th class="rank-col">#</th>
                    <th class="user-col">用户</th>
                    <th class="stat-col">运行时间</th>
                    <th class="stat-col">内存</th>
                    <th class="lang-col">语言</th>
                    <th class="action-col">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in timeRanking" :key="item.submissionId">
                    <td class="rank-col">{{ item.rank }}</td>
                    <td class="user-col">{{ item.username }}</td>
                    <td class="stat-col highlight">{{ item.time }}</td>
                    <td class="stat-col">{{ item.memory }}</td>
                    <td class="lang-col">{{ item.language }}</td>
                    <td class="action-col">
                      <button 
                        class="view-detail-btn" 
                        @click.stop="viewRankSubmissionDetail(item.submissionId)"
                      >
                        查看详情
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 排行榜内容 -->
      <div v-if="activeTab === 'ranking'" class="ranking-content">
        <div class="ranking-list card">
          <h2>排行榜</h2>
          
          <div v-if="rankLoading" class="loading-row">加载中...</div>
          <div v-else-if="rankList.length === 0" class="empty-ranking">
            <div class="empty-icon">🏆</div>
            <div class="empty-text">暂无排名数据</div>
          </div>
          <div v-else class="rank-table-container">
            <table class="rank-table">
              <thead>
                <tr>
                  <th class="rank-number">排名</th>
                  <th class="user-name">参赛者</th>
                  <th class="solved-count">通过题数</th>
                  <th class="total-score">总分</th>
                  <th class="total-penalty">罚时</th>
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
                      Math.floor(user.info.freeze.penalty_count) + '秒' : '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 提交详情对话框 - 移到根级别 -->
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
    
    <!-- 判题动画 -->
    <div class="judge-animation-container" v-if="showJudgeAnimation">
      <div class="judge-animation-overlay"></div>
      <div class="judge-animation-content">
        <div class="animation-box" :class="judgeResult ? getJudgeStatusClass(judgeResult.status) : ''">
          <!-- 状态图标 -->
          <div class="judge-icon" v-if="!judgeResult">
            <div class="loading-spinner">
              <div class="spinner"></div>
            </div>
          </div>
          <div class="judge-icon" v-else>
            <div class="status-icon">{{ getJudgeStatusInfo(judgeResult.status).icon }}</div>
          </div>
          
          <!-- 状态信息 -->
          <div class="judge-message">
            <div class="status-title">
              {{ judgeResult ? getJudgeStatusInfo(judgeResult.status).message : '评测中...' }}
            </div>
            <div class="status-description">
              {{ judgeResult ? getJudgeStatusInfo(judgeResult.status).description : '正在提交您的代码并进行评测' }}
            </div>
          </div>
          
          <!-- 结果信息 -->
          <div v-if="judgeResult" class="result-display">
            <div class="result-details">
              <span>运行时间: {{ judgeResult.time }}s</span>
              <span>内存: {{ Math.round(judgeResult.memory / 1024) }}MB</span>
            </div>
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
  border-radius: 8px 8px 0 0;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: white;
  min-height: 50px;
  position: sticky;
  top: 0;
  z-index: 10;
  margin-bottom: 10px;
  width: 100%;
}

.tab-item {
  padding: 14px 20px;
  cursor: pointer;
  color: #595959;
  font-size: 16px;
  transition: all 0.3s;
  position: relative;
  text-align: center;
  flex: 1;
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

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: auto;
}

.problem-detail {
  border-radius: 8px;
  padding: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
  max-width: none;
  margin: 0;
}

.split-layout {
  display: flex;
  gap: 10px;
  flex: 1;
  overflow: hidden;
  width: 100%;
  max-width: none;
  padding: 0;
}

.problem-info {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  height: 100%;
  width: 100%;
  max-width: none;
}

.code-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  height: 100%;
  width: 100%;
  max-width: none;
}

/* 修复在移动端上的样式 */
@media (max-width: 768px) {
  .problem-detail-container {
    padding: 10px;
    height: 100vh;
  }
  
  .problem-tabs {
    position: sticky;
    top: 0;
    z-index: 10;
    border-radius: 8px;
  }
}

.problem-header {
  margin-bottom: 10px;
  padding: 15px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
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
.output-format {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  width: 100%;
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
  display: grid;
  gap: 12px;
}

.sample-input,
.sample-output {
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
}

pre {
  margin: 0;
  padding: 12px;
  background: white;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.editor-header {
  padding: 12px 16px;
  background: #fafafa;
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
  margin: 0;
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
  background: white;
  border-radius: 0;
  padding: 16px;
  margin: 0;
  border-top: 1px solid #eaeaea;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
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
  margin-bottom: 15px;
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
  transition: border-color 0.3s;
}

.test-input-textarea:focus {
  border-color: #40a9ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
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
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

.run-test-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: #fafafa;
  border-top: 1px solid #eaeaea;
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
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.submit-btn {
  background: #40a9ff;
  color: white;
}

.submit-btn:hover {
  background: #4dabf8;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.remark {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  background-color: #fff8e1;
  padding: 15px;
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
    height: 100vh;
  }
  
  .problem-tabs {
    position: sticky;
    top: 0;
    z-index: 10;
    border-radius: 8px 8px 0 0;
    margin-bottom: 0;
  }
  
  .split-layout {
    flex-direction: column;
    overflow-y: auto;
  }
  
  .problem-info,
  .code-editor {
    height: auto;
    min-height: 400px;
  }
  
  .code-editor {
    flex: 0 0 auto;
  }
  
  .hidden-mobile {
    display: none;
  }
  
  .mobile-toggle {
    display: block;
    margin-bottom: 15px;
    text-align: center;
  }
  
  .toggle-btn {
    width: 100%;
    padding: 10px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 15px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
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
  
  .section {
    padding: 15px;
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

.tab-content {
  flex: 1;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  overflow-y: auto;
  width: 100%;
  max-width: none;
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
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
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
  width: 98%;
  max-width: 1600px;
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

/* Markdown内容样式 */
.markdown-body {
  color: #333;
  line-height: 1.6;
  overflow-wrap: break-word;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
}

.markdown-body :deep(h1) {
  font-size: 2em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.markdown-body :deep(h2) {
  font-size: 1.5em;
  padding-bottom: 0.3em;
  border-bottom: 1px solid #eaecef;
}

.markdown-body :deep(h3) {
  font-size: 1.25em;
}

.markdown-body :deep(p) {
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 2em;
  margin-top: 0;
  margin-bottom: 16px;
}

.markdown-body :deep(li) {
  margin-top: 0.25em;
}

.markdown-body :deep(pre) {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 3px;
  margin-bottom: 16px;
}

.markdown-body :deep(code) {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.markdown-body :deep(pre code) {
  padding: 0;
  margin: 0;
  background-color: transparent;
  border: 0;
  word-break: normal;
  white-space: pre;
}

.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 16px;
  overflow: auto;
}

.markdown-body :deep(table th),
.markdown-body :deep(table td) {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-body :deep(table tr) {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-body :deep(table tr:nth-child(2n)) {
  background-color: #f6f8fa;
}

.markdown-body :deep(img) {
  max-width: 100%;
  box-sizing: content-box;
}

.markdown-body :deep(hr) {
  height: 0.25em;
  padding: 0;
  margin: 24px 0;
  background-color: #e1e4e8;
  border: 0;
}

.markdown-body :deep(blockquote) {
  padding: 0 0.1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin: 0 0 16px 0;
  width: 98%;
}

/* 更新备注样式，保持与markdown兼容 */
.remark {
  color: #666;
  line-height: 1.6;
  background-color: #fff8e1;
  padding: 16px;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}

/* 实现代码高亮 */
.markdown-body :deep(.hljs) {
  display: block;
  overflow-x: auto;
  padding: 0.5em;
  color: #333;
  background: #f8f8f8;
}

.markdown-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-quote) {
  color: #998;
  font-style: italic;
}

.markdown-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-selector-tag),
.markdown-body :deep(.hljs-subst) {
  color: #333;
  font-weight: bold;
}

.markdown-body :deep(.hljs-number),
.markdown-body :deep(.hljs-literal) {
  color: #008080;
}

.markdown-body :deep(.hljs-variable),
.markdown-body :deep(.hljs-template-variable),
.markdown-body :deep(.hljs-tag .hljs-attr) {
  color: #008080;
}

.markdown-body :deep(.hljs-string),
.markdown-body :deep(.hljs-doctag) {
  color: #d14;
}

.markdown-body :deep(.hljs-title),
.markdown-body :deep(.hljs-section),
.markdown-body :deep(.hljs-selector-id) {
  color: #900;
  font-weight: bold;
}

/* 判题动画样式 */
.judge-animation-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.judge-animation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(3px);
}

.judge-animation-content {
  position: relative;
  z-index: 2001;
  text-align: center;
}

.animation-box {
  background: white;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 30px;
  width: 320px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: all 0.5s ease;
  animation: fadeIn 0.3s ease forwards;
}

.judge-icon {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner {
  width: 60px;
  height: 60px;
  border: 5px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #1890ff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.spinner-text {
  color: #333;
  font-size: 18px;
  font-weight: 500;
}

.result-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.result-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #666;
}

/* 判题结果样式 */
.judge-success {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
}

.judge-success .result-status {
  color: #52c41a;
}

.judge-error {
  background: #fff2f0;
  border: 1px solid #ffccc7;
}

.judge-error .result-status {
  color: #f5222d;
}

.judge-warning {
  background: #fffbe6;
  border: 1px solid #ffe58f;
}

.judge-warning .result-status {
  color: #faad14;
}

.judge-default {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

/* 禁用提交按钮样式 */
.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.problem-id-badge {
  display: inline-block;
  padding: 4px 10px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  border: 1px solid #91d5ff;
}

.tab-badge {
  display: inline-block;
  font-size: 12px;
  padding: 1px 6px;
  margin-left: 8px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 12px;
  font-weight: normal;
  vertical-align: middle;
}

.status-icon {
  font-size: 64px;
  margin-bottom: 16px;
  animation: scale-in 0.5s ease forwards;
}

.status-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #333;
}

.status-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
}

@keyframes scale-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.2); opacity: 0.7; }
  100% { transform: scale(1); opacity: 1; }
}

/* 排行榜样式 */
.ranking-list {
  margin-bottom: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
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
  text-align: left;
  border-bottom: 1px solid #eee;
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

.rank-number {
  width: 60px;
  text-align: center;
}

.user-name {
  width: 150px;
  font-weight: 500;
}

.solved-count, .total-score, .total-penalty {
  width: 100px;
  text-align: center;
}

.loading-row {
  text-align: center;
  padding: 20px;
  color: #666;
}

.empty-ranking {
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

/* 统计页面样式 */
.statistics-tab {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
}

.statistics-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: box-shadow 0.3s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-card h2 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #333;
  padding-left: 12px;
  position: relative;
}

.stat-card h2::before {
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

/* 通过率样式 */
.pass-rate-container {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 20px;
}

.pass-rate-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.inner-circle {
  width: 130px;
  height: 130px;
  border-radius: 50%;
  background: white;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pass-rate-text {
  font-size: 24px;
  font-weight: bold;
  color: #52c41a;
}

.pass-rate-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-title {
  color: #666;
}

.info-value {
  font-weight: 500;
  color: #333;
}

/* 图表容器 */
.chart-container {
  height: 400px;
  width: 100%;
}

/* 排行榜样式 */
.ranking-section {
  overflow: hidden;
}

.ranking-tabs {
  margin-top: 16px;
}

.rank-table-wrapper {
  margin-top: 16px;
  overflow-x: auto;
}

.rank-table {
  width: 100%;
  border-collapse: collapse;
}

.rank-table th,
.rank-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #f0f0f0;
}

.rank-table th {
  background: #fafafa;
  font-weight: 500;
  color: #333;
}

.rank-table tr:hover {
  background-color: #f5f5f5;
}

.rank-col {
  width: 60px;
  text-align: center;
}

.user-col {
  width: 200px;
}

.stat-col {
  width: 100px;
  text-align: right;
}

.lang-col {
  width: 80px;
}

.highlight {
  color: #1890ff;
  font-weight: 500;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .pass-rate-container {
    flex-direction: column;
    gap: 20px;
    align-items: center;
  }
  
  .chart-container {
    height: 300px;
  }
  
  .rank-table th,
  .rank-table td {
    padding: 8px;
  }
}

/* 自定义标签页样式 */
.custom-tabs {
  margin-top: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.custom-tabs-header {
  display: flex;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.custom-tab-item {
  padding: 12px 16px;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
  font-size: 14px;
}

.custom-tab-item:hover {
  color: #1890ff;
}

.custom-tab-item.active {
  color: #1890ff;
  font-weight: 500;
  position: relative;
}

.custom-tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #1890ff;
}

.custom-tabs-content {
  padding: 16px;
  background: white;
}

.chart-loading, .empty-chart {
  height: 300px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #999;
  font-size: 14px;
}

.action-col {
  width: 100px;
  text-align: center;
}

.view-detail-btn {
  padding: 4px 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s;
}

.view-detail-btn:hover {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style> 