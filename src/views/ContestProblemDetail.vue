<script setup>
import { ref, onMounted, computed, watch, nextTick, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProblemDetail, getLanguages, runCode as runCodeAPI, submitCode as submitCodeAPI, getSubmissionList, getSubmissionDetail } from '../api/problem'
import { getContestRank, getContestDetail } from '../api/contest'
import { message, Tabs, Modal, Table, Tooltip } from 'ant-design-vue'
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
  // 优先从路由参数获取
  if (route.params.contestId) {
    return Number(route.params.contestId);
  }
  
  // 其次尝试从URL查询参数获取 (可能来自旧链接或特定场景)
  const contestIdFromQuery = route.query.contestId
  if (contestIdFromQuery) {
    return Number(contestIdFromQuery)
  }
  
  // 最后尝试从localStorage获取 (用于独立访问题目详情页等情况)
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
  const problemId = route.params.problemId; // 使用 problemId
  const contestId = getCurrentContestId(); // contestId 可以保持使用此函数
  if (!problemId) {
    message.error('无效的题目ID');
    loading.value = false;
    return;
  }
  
  try {
    // 确保传递的是 Number 类型
    const res = await getProblemDetail(Number(problemId), contestId)
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
  const problemId = route.params.problemId; // 使用 problemId
  if (!problemId) return 'code_unknown_problem'; // 提供默认键以防万一
  return `code_${problemId}_${langName || language.value}`;
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
  
  const problemId = route.params.problemId; // 使用 problemId
  if (!problemId) {
    message.error('无法获取题目ID');
    return;
  }
  
  isRunning.value = true
  runResult.value = null
  
  try {
    const res = await runCodeAPI({
      problem_id: Number(problemId),
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
  
  const problemId = route.params.problemId; // 使用 problemId
  if (!problemId) {
    message.error('无法获取题目ID');
    return;
  }
  
  isSubmitting.value = true
  showJudgeAnimation.value = true
  judgeResult.value = null
  
  try {
    const submitData = {
      problem_id: Number(problemId),
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
  const problemId = route.params.problemId; // 使用 problemId
  if (!problemId) {
    message.error('无法获取题目ID以加载提交记录');
    submissionLoading.value = false;
    return;
  }

  try {
    const params = {
      problem_id: Number(problemId),
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
    console.log('提交记录请求结果:', res)
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
    console.log('提交详情结果:', res)
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

// 查看提交详情
const viewSubmissionDetail = (submissionId) => {
  if (!submissionId) {
    message.warning('无效的提交ID')
    return
  }
  fetchSubmissionDetail(submissionId)
}

// 获取排行榜
const fetchRankList = async () => {
  const contestId = getCurrentContestId()
  if (!contestId) {
    console.warn('未找到竞赛ID，无法获取排行榜')
    return
  }
  
  rankLoading.value = true
  try {
    // 先获取竞赛详情，确保contestInfo中有最新的数据
    const detailRes = await getContestDetail(contestId)
    if (detailRes.code === 200) {
      contestInfo.value = detailRes.data
    }
    
    console.log('开始获取排行榜数据，竞赛ID:', contestId)
    const res = await getContestRank(contestId)
    console.log('排行榜请求结果:', res)
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
    message.error('获取排行榜失败: ' + (error.message || '未知错误'))
  } finally {
    rankLoading.value = false
  }
}

// 获取字母序号
const getLetterIndex = (index) => {
  return String.fromCharCode(65 + index) // A, B, C, D...
}

// 格式化日期时间
const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
}

// 获取状态样式类名
const getStatusClass = (status) => {
  console.log('获取状态样式类名:', status)
  
  
  const statusLower = status.toLowerCase()
  console.log('状态样式类名:', statusLower)
  if (statusLower.includes('accepted')) return 'status-accepted'
  if (statusLower.includes('wrong answer')) return 'status-wrong'
  if (statusLower.includes('time limit')) return 'status-tle'
  if (statusLower.includes('memory limit')) return 'status-mle'
  if (statusLower.includes('runtime')) return 'status-runtime'
  if (statusLower.includes('compilation') || statusLower.includes('compile')) return 'status-compile'
  if (statusLower.includes('pending') || statusLower.includes('judging')) return 'status-pending'
  
  // 默认返回
      return 'status-other'
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
  if (!lang) return 'plaintext'
  
  // 规范化语言名称
  const langLower = lang.toLowerCase()
  
  const languageMap = {
    'cpp': 'cpp',
    'c++': 'cpp',
    'c': 'c',
    'java': 'java',
    'python': 'python',
    'javascript': 'javascript',
    'js': 'javascript',
    'html': 'html',
    'go': 'go',
    'go1.13': 'go',
    'go1.18': 'go'
  }
  
  // 查找完全匹配
  if (languageMap[langLower]) {
    return languageMap[langLower]
  }
  
  // 查找部分匹配
  for (const [key, value] of Object.entries(languageMap)) {
    if (langLower.includes(key)) {
      return value
    }
  }
  
  // 默认返回普通文本
  return 'plaintext'
}

// 切换题目
const navigateToProblem = (problemIdToNav) => {
  if (!problemIdToNav) {
    console.warn('navigateToProblem called with invalid problemId');
    return;
  }
  
  // 使用 route.params.contestId 获取当前竞赛 ID
  const contestId = route.params.contestId; 
  if (!contestId) {
    console.warn('navigateToProblem called but no contestId found in route params');
    // 可以选择尝试 getCurrentContestId() 作为后备，但这可能不准确
    // const fallbackContestId = getCurrentContestId();
    // if (!fallbackContestId) return;
    // contestId = fallbackContestId;
    message.error('无法确定当前竞赛ID');
    return;
  }
  
  // 判断是否是同一题目，避免不必要的导航
  if (Number(route.params.problemId) === problemIdToNav) { // 使用 problemId 比较
    console.log('Already on the requested problem page.');
    return;
  }
  
  // 保存当前代码编辑器的状态
  saveCodeToLocalStorage()
  
  // 构建目标路径 - 确保格式为 /contest/:contestId/problem/:problemId
  const targetPath = `/contest/${contestId}/problem/${problemIdToNav}`; // 使用 problemIdToNav
  console.log(`Navigating to problem: ${targetPath}`);
  
  // 使用 router.push 进行导航
  router.push(targetPath).catch(err => {
    // 忽略重复导航错误，这是预期的，如果用户快速点击同一链接
    if (err.name !== 'NavigationDuplicated') {
      console.error('Router navigation error:', err);
      message.error('切换题目失败，请检查控制台日志。');
    }
  });
  
  // 注意：Vue Router通常会自动处理组件的重新加载。
  // 如果组件没有按预期更新，请检查路由配置和组件的 key 属性。
  // 通常不需要手动 setTimeout 和 fetchProblemDetail。
  // 保留之前的 setTimeout 逻辑以防万一，但注释掉其核心部分
  /*
  setTimeout(() => {
    if (Number(route.params.problemId) !== problemIdToNav) {
      console.log('Manual reload triggered (may indicate issue with router reactivity)');
      // fetchProblemDetail(); // 一般不需要
    }
  }, 500);
  */
}

// 生命周期钩子
onMounted(async () => {
  // 先获取竞赛信息，再获取题目详情和语言
  await fetchContestInfo() 
  fetchProblemDetail()
  fetchLanguages()
  
  // 默认切换到题目标签页（这将触发相关数据加载）
  activeTab.value = 'problem'
  
  // 延迟加载提交记录和排行榜，避免页面初始加载太慢
  nextTick(() => {
    // 如果当前有竞赛ID
  if (getCurrentContestId()) {
      // 预加载提交记录
      fetchSubmissionList();
      
      // 预加载排行榜数据
      fetchRankList();
    }
  });
})

// 监听路由参数变化
watch(() => route.params.problemId, (newProblemId) => { // 监听 problemId
  if (newProblemId) {
    console.log(`Problem ID changed to: ${newProblemId}, fetching details...`);
    fetchProblemDetail();
    // 可能还需要重置/重新加载其他与题目相关的状态，例如提交记录
    submissionList.value = []; // 清空旧记录
    submissionTotal.value = 0;
    currentPage.value = 1;
    // 如果当前tab是提交记录，则重新获取
    if (activeTab.value === 'submissions') {
        fetchSubmissionList();
    }
  } else {
    console.warn('Problem ID in route is missing or invalid.');
    // 可以考虑导航到错误页或竞赛详情页
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

// Get Language Display Name Helper
const getLanguageDisplayName = (langKey) => {
  if (!langKey) return '-'
  const lang = languageOptions.value.find(l => l.value === langKey || l.label === langKey || l.id === langKey)
  return lang ? lang.label : langKey
}

// Get Status Icon Helper (Example)
const getStatusIcon = (status) => {
  if (!status) return 'fa-question-circle'
  
  const statusLower = status.toLowerCase()
  
  if (statusLower.includes('accepted')) return 'fa-check-circle'
  if (statusLower.includes('wrong answer')) return 'fa-times-circle'
  if (statusLower.includes('time limit')) return 'fa-clock'
  if (statusLower.includes('memory limit')) return 'fa-memory'
  if (statusLower.includes('runtime')) return 'fa-bomb'
  if (statusLower.includes('compilation') || statusLower.includes('compile')) return 'fa-code'
  
  return 'fa-question-circle'
}

// Editor Options
const editorOptions = ref({
  automaticLayout: true,
  scrollBeyondLastLine: false,
  minimap: { enabled: false },
  fontSize: 14,
  theme: 'vs' // Use default light theme or 'vs-dark' for dark
});

// Submission Columns Definition
const submissionColumns = computed(() => [
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 150,
    customRender: ({ text }) => {
      return h('span', { 
        class: ['status-tag', getStatusClass(text)],
        style: 'cursor: pointer;'
      }, [
        h('i', { class: ['fas', getStatusIcon(text)], style: 'margin-right: 5px;' }),
        text
      ]);
    }
  },
  {
    title: '执行时间',
    dataIndex: 'time',
    key: 'time',
    width: 100,
    customRender: ({ text }) => text !== null ? `${text}ms` : '-'
  },
  {
    title: '消耗内存',
    dataIndex: 'memory',
    key: 'memory',
    width: 100,
    customRender: ({ text }) => text !== null ? formatMemory(text) : '-'
  },
  {
    title: '语言',
    dataIndex: 'language',
    key: 'language',
    width: 100,
    customRender: ({ text }) => getLanguageDisplayName(text)
  },
  {
    title: '提交时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    customRender: ({ text }) => formatDateTime(text)
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    customRender: ({ record }) => {
      return h('a', {
        class: 'view-detail-link',
        onClick: () => viewSubmissionDetail(record.ID)
      }, [
        h('i', { class: 'fas fa-eye', style: 'margin-right: 5px;' }),
        '查看'
      ]);
    }
  },
]);

// Rank Columns Definition (Similar to ContestDetailsManage)
const rankColumns = computed(() => {
  const baseColumns = [
    { title: '排名', dataIndex: 'rank', key: 'rank', width: 45, fixed: 'left', customRender: ({ index }) => h('span', index + 1) },
    { title: '参赛者', dataIndex: 'apply_name', key: 'user', width: 100, fixed: 'left', ellipsis: true },
    {
      title: '通过',
      dataIndex: ['info', 'freeze', 'accepted_count'],
      key: 'solved',
      width: 60,
      sorter: (a, b) => (a.info?.freeze?.accepted_count || 0) - (b.info?.freeze?.accepted_count || 0),
      customRender: ({ text }) => text || 0
    },
    {
      title: '罚时',
      dataIndex: ['info', 'freeze', 'penalty_count'],
      key: 'penalty',
      width: 70,
      sorter: (a, b) => (a.info?.freeze?.penalty_count || 0) - (b.info?.freeze?.penalty_count || 0),
      customRender: ({ text }) => text ? Math.floor(text) : '-'
    }
  ];

  const problemCols = (contestProblems.value || []).map((problem, index) => ({
    title: () => h('div', {
      class: 'problem-column-header',
      style: 'display: flex; flex-direction: column; align-items: center;'
    }, [
      h('div', { class: 'problem-letter' }, getLetterIndex(index)),
      h(Tooltip, {
        title: `${problem.id}: ${problem.name}`,
        placement: 'top'
      }, {
        default: () => h('div', { class: 'problem-id', style: 'font-size: 10px; color: #999;' }, problem.id)
      })
    ]),
    dataIndex: ['info', 'freeze', 'details', String(problem.id)],
    key: `problem_${problem.id}`,
    width: 90,
    align: 'center',
    customRender: ({ record }) => {
      const detail = record?.info?.freeze?.details?.[problem.id];
      if (!detail) return h('span', '-');
      
      // Status 3: Accepted (Green)
      if (detail.status === 3) { 
        const attempts = Math.max(0, detail.count - 1); // Attempts before acceptance
        const time = detail.accept_time ? `${Math.floor(detail.accept_time / 60)}` : ''; // Acceptance time in minutes
        return h('div', { class: 'rank-cell accepted' }, [
          h('div', { class: 'time' }, time),
          h('div', { class: 'attempts' }, attempts > 0 ? `(-${attempts})` : '')
        ]);
      } 
      // Status 16: Frozen (Grey)
      else if (detail.status === 16) {
        // Display attempts before freeze if any
        const attempts = detail.count || 0;
        return h('div', { class: 'rank-cell frozen' }, [
          // Optionally display a lock icon or '封'
          h('i', { class: 'fas fa-lock', style: 'margin-bottom: 2px;' }), 
          h('div', { class: 'frozen-attempts' }, attempts > 0 ? `(-${attempts})` : '-')
        ]);
      } 
      // Other statuses with attempts: Failed (Red)
      else if (detail.count > 0) { 
        return h('div', { class: 'rank-cell failed' }, `(-${detail.count})`);
      }
      
      // No attempts or unknown status
      return h('span', '-');
    }
  }));

  return [...baseColumns, ...problemCols];
});

// 获取编辑器语言
const getEditorLanguage = (langString) => {
  if (!langString) return 'plaintext'
  
  try {
    // 尝试映射语言
    const langLower = langString.toLowerCase()
    
    // 语言映射
    if (langLower.includes('c++') || langLower.includes('gcc')) return 'cpp'
    if (langLower.includes('java')) return 'java'
    if (langLower.includes('python')) return 'python'
    if (langLower.includes('javascript')) return 'javascript'
    if (langLower.includes('go')) return 'go'
    if (langLower.includes('c') && !langLower.includes('c++')) return 'c'
    
    // 默认返回普通文本
    return 'plaintext'
  } catch (error) {
    console.error('语言解析错误:', error)
    return 'plaintext'
  }
}
</script>

<template>
  <div class="problem-detail-container">
    <div class="loading-overlay" v-if="loading">
      <div class="spinner"></div>
      <p>加载题目中...</p>
      </div>

    <div class="content-wrapper" v-else-if="problem">
      <!-- 左侧题目详情和代码编辑器 -->
      <div class="main-content">
        <!-- 竞赛题目列表 (修改) -->
        <div class="contest-problem-list-section" v-if="isContestProblem && contestProblems.length > 0">
          <h2 class="section-title">竞赛题目</h2>
          <div class="problem-list-items">
            <div 
              v-for="(prob, index) in contestProblems" 
              :key="prob.id" 
              :class="['problem-list-item', { 'active': Number(route.params.problemId) === prob.id }]"
              @click="navigateToProblem(prob.id)"
            >
              <span class="problem-index">{{ getLetterIndex(index) }}</span>
              <span class="problem-name">{{ prob.name }}</span>
            </div>
          </div>
        </div>
        
        <!-- 题目信息头部 -->
          <div class="problem-header">
          <h1 class="problem-title">
            <span v-if="problem.problemIndex">{{ problem.problemIndex }}.</span> {{ problem.name }}
          </h1>
          </div>

        <!-- Tab切换区域 -->
        <a-tabs v-model:activeKey="activeTab" class="problem-tabs">
          <a-tab-pane key="problem" tab="题目描述">
            <div class="problem-section description">
              <h2 class="section-title">题目描述</h2>
              <div class="markdown-content" v-html="parsedDescription"></div>
            </div>

            <div class="problem-section input-format">
              <h2 class="section-title">输入格式</h2>
              <div class="markdown-content" v-html="parsedInputFormat"></div>
            </div>

            <div class="problem-section output-format">
              <h2 class="section-title">输出格式</h2>
              <div class="markdown-content" v-html="parsedOutputFormat"></div>
            </div>

            <div class="problem-section samples">
              <h2 class="section-title">样例</h2>
              <div v-for="(sample, index) in problem.samples" :key="index" class="sample-case">
                  <div class="sample-header">
                  <h3>样例 {{ index + 1 }}</h3>
                  <button @click="copyToClipboard(sample.input)" class="copy-btn">复制输入</button>
                  </div>
                  <div class="sample-content">
                    <div class="sample-input">
                    <pre><code>{{ sample.input }}</code></pre>
                    </div>
                    <div class="sample-output">
                    <pre><code>{{ sample.output }}</code></pre>
                    </div>
                  </div>
                </div>
              <div v-if="!problem.samples || problem.samples.length === 0" class="no-samples">
                暂无样例
              </div>
            </div>

            <div class="problem-section remark" v-if="problem.remark">
              <h2 class="section-title">提示</h2>
              <div class="markdown-content" v-html="parsedRemark"></div>
            </div>
          </a-tab-pane>
          
          <a-tab-pane key="submissions" tab="我的提交">
            <div class="submissions-section">
              <h2 class="section-title">提交记录</h2>
              <button @click="fetchSubmissionList" class="refresh-btn">
                <i class="fas fa-sync-alt"></i> 刷新
              </button>
              <a-table 
                :columns="submissionColumns" 
                :data-source="submissionList" 
                :loading="submissionLoading"
                :pagination="{ current: currentPage, pageSize: pageSize, total: submissionTotal, onChange: handlePageChange }"
                rowKey="ID"
                size="small"
                class="submission-table"
              >
                <template #emptyText>
                  <div class="empty-submissions">
                    <i class="fas fa-clipboard-list" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>暂无提交记录</div>
          </div>
                </template>
              </a-table>
        </div>
          </a-tab-pane>
          
          <!-- 竞赛排行榜 (如果需要) -->
          <a-tab-pane key="ranking" tab="排行榜" v-if="isContestProblem">
             <div class="ranking-section">
                <h2 class="section-title">排行榜</h2>
                <button @click="fetchRankList" class="refresh-btn">
                  <i class="fas fa-sync-alt"></i> 刷新
                </button>
                 <a-table 
                    :columns="rankColumns" 
                    :data-source="rankList" 
                    :loading="rankLoading"
                    :pagination="false"
                    rowKey="user_id"
                    size="small"
                    class="rank-table"
                 >
                    <template #emptyText>
                      <div class="empty-ranking">
                        <i class="fas fa-trophy" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>暂无排名数据</div>
                      </div>
                    </template>
                 </a-table>
        </div>
          </a-tab-pane>

        </a-tabs>
      </div>
        
      <!-- 右侧代码编辑、提交和自测 -->
      <div class="side-panel">
        <div class="editor-container" v-if="showEditor">
          <div class="editor-header">
              <div class="language-selector">
              <label for="language">语言:</label>
                <select id="language" v-model="language" @change="handleLanguageChange">
                  <option v-for="lang in languageOptions" :key="lang.id" :value="lang.value">
                    {{ lang.label }}
                  </option>
                </select>
              </div>
            <div class="editor-actions">
               <button @click="resetCode" class="action-btn reset-btn" title="重置代码"><i class="fas fa-undo"></i></button>
               <button @click="toggleFullScreen" class="action-btn fullscreen-btn" title="全屏/退出全屏"><i class="fas fa-expand"></i></button>
            </div>
          </div>
          
            <MonacoEditor
              v-model:value="code"
            :language="language"
            :options="editorOptions"
            class="code-editor"
          />

          <div class="editor-footer">
             <button @click="toggleTestPanel" class="footer-btn test-btn">
                <i :class="['fas', showTestPanel ? 'fa-chevron-down' : 'fa-chevron-up']"></i> 自测
             </button>
             <button @click="runCode" class="footer-btn run-btn" :disabled="isRunning">
                <i class="fas fa-play"></i> {{ isRunning ? '运行中...' : '运行' }}
             </button>
             <button @click="submitCode" class="footer-btn submit-btn" :disabled="isSubmitting">
                <i class="fas fa-paper-plane"></i> {{ isSubmitting ? '提交中...' : '提交' }}
             </button>
          </div>
          </div>
          
        <!-- 自测面板 -->
        <div class="test-panel" v-show="showTestPanel">
           <h3 class="panel-title">自定义测试</h3>
              <textarea 
                v-model="testInput" 
              placeholder="在此输入测试数据..." 
              class="test-input-area"
              ></textarea>
           <div class="run-result-container" v-if="runResult">
              <h4>运行结果:</h4>
              <pre :class="['result-output', runResult.status !== 'Accepted' ? 'error' : '']">{{ runResult.output || runResult.error || '无输出' }}</pre>
            </div>
              </div>
        
        <!-- 判题结果动画 -->
        <div class="judge-result-container" v-if="showJudgeAnimation">
          <div ref="lottieContainer" class="lottie-animation"></div>
          <div class="judge-status-text">{{ judgeResult ? judgeResult.status : '判题中...' }}</div>
          </div>
          
        </div>
      </div>
      
    <div class="problem-not-found" v-else>
      题目加载失败或不存在。
          </div>
          
    <!-- 提交详情 Modal (修改) -->
    <a-modal 
       v-model:visible="showSubmissionDetail" 
       title="提交详情" 
       width="80%" 
       :footer="null" 
       @cancel="showSubmissionDetail = false"
       wrapClassName="submission-detail-modal"
    >
       <div v-if="submissionDetailLoading" class="modal-loading">
          <div class="spinner"></div> 加载中...
            </div>
       <div v-else-if="submissionDetail">
         <div class="detail-grid">
            <div class="detail-item"><strong>提交 ID:</strong> {{ submissionDetail.ID }}</div>
            <div class="detail-item"><strong>题目:</strong> {{ submissionDetail.problem_name || problem?.name }}</div>
            <div class="detail-item"><strong>提交者:</strong> {{ submissionDetail.user_name }}</div>
            <div class="detail-item">
              <strong>状态:</strong> 
              <span :class="['status-tag', getStatusClass(submissionDetail.status)]">
                <i :class="['fas', getStatusIcon(submissionDetail.status)]" style="margin-right: 5px;"></i> 
                {{ submissionDetail.status }}
              </span>
          </div>
            <div class="detail-item"><strong>语言:</strong> {{ submissionDetail.language }}</div>
            <div class="detail-item"><strong>执行时间:</strong> {{ submissionDetail.time !== null ? `${submissionDetail.time}ms` : '-' }}</div>
            <div class="detail-item"><strong>消耗内存:</strong> {{ submissionDetail.memory !== null ? formatMemory(submissionDetail.memory) : '-' }}</div>
            <div class="detail-item"><strong>提交时间:</strong> {{ formatDateTime(submissionDetail.CreatedAt || submissionDetail.created_at) }}</div>
        </div>
        
         <div class="detail-section compile-info" v-if="submissionDetail.compile_info">
           <h4>编译信息:</h4>
           <pre class="code-block compile-error">{{ submissionDetail.compile_info }}</pre>
      </div>
      
         <div class="detail-section code-view">
           <h4>提交代码:</h4>
           <MonacoEditor
              :value="submissionDetail.source_code || submissionDetail.code || '// 无法获取代码'"
              :language="getEditorLanguage(submissionDetail.language)"
              :options="{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false }"
              class="submitted-code-editor"
              height="400px"
           />
            </div>
            
         <div class="detail-section test-cases" v-if="submissionDetail.status !== 'Compilation Error' && submissionDetail.Testcases">
            <h4>测试点信息:</h4>
             <div v-for="(testcase, index) in submissionDetail.Testcases" :key="index" class="testcase-item">
                 <span :class="['testcase-status', getStatusClass(testcase.status)]">
                    <i :class="['fas', getStatusIcon(testcase.status)]" style="margin-right: 5px;"></i>
                    #{{ index + 1 }} {{ testcase.status }}
                 </span>
                 <span class="testcase-time">时间: {{ testcase.time != null ? `${testcase.time}ms` : '-' }}</span>
                 <span class="testcase-memory">内存: {{ testcase.memory != null ? formatMemory(testcase.memory) : '-' }}</span>
                 <!-- 可以添加显示输入输出的按钮 -->
      </div>
    </div>
    
        </div>
       <div v-else class="modal-empty">
           <i class="fas fa-exclamation-circle" style="font-size: 24px; margin-bottom: 10px;"></i>
           <div>无法加载提交详情</div>
          </div>
    </a-modal>
  </div>
</template>


<style scoped>
/* 基础容器和布局 */
.problem-detail-container {
  width: 100%;
  padding: 15px;
  background-color: #f7f8fa;
  min-height: calc(100vh - 60px); /* 假设顶部导航栏高度为60px */
  box-sizing: border-box;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.content-wrapper {
  display: flex;
  gap: 15px;
  max-width: 1600px; /* 限制最大宽度 */
  margin: 0 auto;
}

.main-content {
  flex: 3; /* 占据更大比例 */
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-left: -10%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden; /* 防止内部元素溢出 */
}

.side-panel {
  flex: 2; /* 占据较小比例 */
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-right: -10%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
}

/* 题目头部信息 */
.problem-header {
  margin-top: 20px; /* 与题目列表分隔开 */
  margin-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15px;
}

.problem-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
}

/* Tab样式 */
.problem-tabs {
  margin-top: -10px; /* 微调与头部的间距 */
}

:deep(.ant-tabs-nav) {
  margin-bottom: 15px !important;
}

:deep(.ant-tabs-tab) {
  font-size: 15px;
  padding: 10px 16px;
}

/* 题目描述区域 */
.problem-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  padding-bottom: 5px;
  border-bottom: 2px solid #eee;
}

.markdown-content {
  font-size: 14px;
  line-height: 1.7;
  color: #444;
}

/* Markdown 内容样式增强 */
:deep(.markdown-content > *:first-child) { margin-top: 0; }
:deep(.markdown-content > *:last-child) { margin-bottom: 0; }
:deep(.markdown-content p) { margin-bottom: 1em; }
:deep(.markdown-content pre) {
  background-color: #f6f8fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.5;
  border: 1px solid #eee;
}
:deep(.markdown-content code) {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  background-color: rgba(27,31,35,.05);
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  border-radius: 3px;
}
:deep(.markdown-content pre code) {
  padding: 0;
  margin: 0;
  font-size: inherit;
  background-color: transparent;
  border-radius: 0;
}
:deep(.markdown-content blockquote) {
  border-left: 4px solid #dfe2e5;
  padding-left: 15px;
  color: #6a737d;
  margin: 1em 0;
}
:deep(.markdown-content ul), :deep(.markdown-content ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}
:deep(.markdown-content li) {
  margin-bottom: 0.5em;
}
:deep(.markdown-content strong) { font-weight: 600; }
:deep(.markdown-content img) { max-width: 100%; height: auto; }

/* 样例样式 */
.sample-case {
  margin-bottom: 20px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f9f9f9;
  padding: 8px 12px;
  border-bottom: 1px solid #e8e8e8;
}

.sample-header h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #555;
}

.copy-btn {
  background-color: #eee;
  border: 1px solid #ddd;
  padding: 3px 8px;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.copy-btn:hover { background-color: #e0e0e0; }

.sample-content {
  display: grid;
  grid-template-columns: 1fr 1fr; /* 输入输出各占一半 */
  gap: 0px;
}

.sample-input, .sample-output {
  padding: 10px 12px;
}

.sample-input { border-right: 1px solid #e8e8e8; } /* 分隔线 */

.sample-input pre, .sample-output pre {
  margin: 0;
  padding: 0;
  background-color: transparent !important;
  border: none !important;
  font-size: 13px;
  white-space: pre-wrap; /* 允许换行 */
  word-wrap: break-word;
}

.sample-input pre code, .sample-output pre code {
  background-color: transparent !important;
  padding: 0 !important;
}

.no-samples {
  color: #999;
  padding: 15px;
  text-align: center;
  border: 1px dashed #e8e8e8;
  border-radius: 4px;
  margin-top: 10px;
}

/* 编辑器区域 */
.editor-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* 占满 side-panel */
  overflow: hidden; /* 防止内部溢出 */
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
}

.language-selector label {
  margin-right: 5px;
  font-size: 13px;
  color: #555;
}

.language-selector select {
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.editor-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #888;
  cursor: pointer;
  padding: 5px;
  transition: color 0.2s;
}
.action-btn:hover { color: #333; }

.code-editor {
  flex-grow: 1; /* 占据剩余空间 */
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  min-height: 300px; /* 保证最小高度 */
}

/* 编辑器主题设置 (在 editorOptions 中) */
:deep(.monaco-editor) { /* 确保圆角 */
  border-radius: 4px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 10px;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.footer-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.2s, opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.footer-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-btn {
  background-color: #f0f0f0;
  color: #555;
}
.test-btn:hover:not(:disabled) { background-color: #e0e0e0; }

.run-btn {
  background-color: #e6f7ff;
  color: #1890ff;
}
.run-btn:hover:not(:disabled) { background-color: #bae7ff; }

.submit-btn {
  background-color: #52c41a;
  color: #fff;
}
.submit-btn:hover:not(:disabled) { background-color: #73d13d; }

/* 自测面板 */
.test-panel {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px dashed #ccc;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #444;
}

.test-input-area {
  width: 100%;
  min-height: 80px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px;
  font-size: 13px;
  resize: vertical;
  margin-bottom: 10px;
}

.run-result-container {
  margin-top: 10px;
}
.run-result-container h4 {
  font-size: 13px;
  margin-bottom: 5px;
  color: #555;
}
.result-output {
  background-color: #f6f8fa;
  border: 1px solid #eee;
  padding: 8px;
  border-radius: 4px;
  max-height: 150px;
  overflow-y: auto;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
}
.result-output.error {
  color: #f5222d;
  border-color: #ffccc7;
  background-color: #fff1f0;
}

/* 判题结果动画 */
.judge-result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  margin-top: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
}
.lottie-animation {
  width: 100px;
  height: 100px;
  margin-bottom: 10px;
}
.judge-status-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

/* 提交记录表格 */
.submissions-section {
  margin-top: 10px;
}

.submission-table {
  border: 1px solid #f0f0f0;
  border-radius: 4px;
}

/* 表格状态标签 */
:deep(.status-tag) {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  transition: opacity 0.2s;
  cursor: pointer; /* Added cursor pointer for clarity */
}

:deep(.status-tag:hover) { opacity: 0.8; }

:deep(.status-tag.status-accepted) { 
  background-color: #f6ffed; 
  color: #52c41a; 
  border: 1px solid #b7eb8f; 
}

:deep(.status-tag.status-wrong) { 
  background-color: #fff1f0; 
  color: #f5222d; 
  border: 1px solid #ffccc7; 
}

:deep(.status-tag.status-tle),
:deep(.status-tag.status-mle) { 
  background-color: #fffbe6; 
  color: #faad14; 
  border: 1px solid #ffe58f; 
}

:deep(.status-tag.status-runtime) { 
  background-color: #fff0f6; 
  color: #eb2f96; 
  border: 1px solid #ffadd2; 
}

:deep(.status-tag.status-compile) { 
  background-color: #e6f7ff; 
  color: #1890ff; 
  border: 1px solid #91d5ff; 
}

:deep(.status-tag.status-pending),
:deep(.status-tag.status-judging) { 
  background-color: #fafafa; 
  color: #8c8c8c; 
  border: 1px solid #d9d9d9; 
}

:deep(.status-tag.status-other) { 
  background-color: #fafafa; 
  color: #8c8c8c; 
  border: 1px solid #d9d9d9; 
}

.empty-submissions, .empty-ranking {
  padding: 30px;
  text-align: center;
  color: #999;
}

/* 提交详情 Modal */
.modal-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  gap: 10px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px 15px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 13px;
}
.detail-item strong {
  color: #555;
  margin-right: 5px;
}

.detail-section {
  margin-bottom: 20px;
}
.detail-section h4 {
  font-size: 15px;
  margin-bottom: 10px;
  color: #333;
}

.code-block {
  background-color: #f6f8fa;
  border: 1px solid #eee;
  padding: 10px;
  border-radius: 4px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 200px;
  overflow-y: auto;
}
.compile-error {
  color: #f5222d;
}

.submitted-code-editor {
  height: 400px; /* 固定高度 */
  border: 1px solid #eee;
  border-radius: 4px;
}

.test-cases {
  border-top: 1px solid #f0f0f0;
  padding-top: 15px;
}
.testcase-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 8px 0;
  border-bottom: 1px solid #f9f9f9;
  font-size: 13px;
}
.testcase-item:last-child { border-bottom: none; }

.testcase-status {
  flex-basis: 150px; /* 固定宽度 */
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}
.testcase-status .fas { font-size: 14px; }

:deep(.testcase-status.status-accepted) { color: #52c41a; }
:deep(.testcase-status.status-wrong) { color: #f5222d; }
:deep(.testcase-status.status-tle),
:deep(.testcase-status.status-mle) { color: #faad14; }
:deep(.testcase-status.status-runtime) { color: #eb2f96; }
:deep(.testcase-status.status-compile) { color: #1890ff; }
:deep(.testcase-status.status-pending),
:deep(.testcase-status.status-judging) { color: #8c8c8c; }
:deep(.testcase-status.status-other) { color: #8c8c8c; }

.testcase-time, .testcase-memory {
  color: #888;
}

.modal-empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .content-wrapper {
  flex-direction: column;
  }
  .side-panel {
    max-height: none; /* 解除高度限制 */
  }
  .code-editor {
     min-height: 400px; /* 移动端给多点高度 */
  }
}

@media (max-width: 768px) {
  .problem-detail-container { padding: 10px; }
  .main-content, .side-panel { padding: 15px; }
  .problem-title { font-size: 20px; }
  .section-title { font-size: 16px; }
  .markdown-content { font-size: 13px; }
  .sample-content { grid-template-columns: 1fr; } /* 堆叠 */
  .sample-input { border-right: none; border-bottom: 1px solid #e8e8e8; }
  .editor-footer { flex-wrap: wrap; justify-content: space-between; }
  .footer-btn { flex-grow: 1; text-align: center; margin-bottom: 5px; }
  .test-btn { flex-basis: 100%; } /* 自测按钮占一行 */
}

/* 竞赛题目列表样式 (修改) */
.contest-problem-list-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
  border: 1px solid #eee;
}

.contest-problem-list-section .section-title {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px; /* 减小标题字号 */
  border-bottom: none; /* 移除标题下划线 */
  padding-bottom: 0;
}

.problem-list-items {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.problem-list-item {
  display: inline-flex; /* 改为 inline-flex */
  align-items: center;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 15px; /* 更圆的胶囊形状 */
  text-decoration: none;
  color: #555;
  transition: all 0.3s ease;
  background-color: #fff;
  font-size: 13px;
}

.problem-list-item:hover {
  border-color: #1890ff;
  color: #1890ff;
  background-color: #e6f7ff;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.problem-list-item.active {
  border-color: #1890ff;
  background-color: #1890ff;
  color: #fff;
  font-weight: 500;
  }
  
.problem-index {
  font-weight: bold;
  margin-right: 6px;
  min-width: 15px; /* 保证宽度 */
  text-align: center;
  }
  
.problem-list-item.active .problem-index {
  color: #fff; 
  }
  
.problem-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px; /* 限制名字最大宽度 */
}

/* 调整原有内容的上边距 */
.problem-header {
  margin-top: 20px; /* 与题目列表分隔开 */
}

/* 刷新按钮 */
.refresh-btn {
  margin-left: 10px;
  margin-bottom: 10px;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 13px;
}

.refresh-btn:hover {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.refresh-btn i {
  font-size: 12px;
}

/* 提交记录和排行榜突出显示样式 */
.submission-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #e6f7ff;
}

.view-detail-link {
  color: #1890ff;
  transition: all 0.3s;
}

.view-detail-link:hover {
  color: #40a9ff;
  text-decoration: underline;
}

/* 排行榜样式增强 */
.rank-table :deep(.ant-table-tbody > tr:hover > td) {
  background-color: #e6f7ff;
}

:deep(.rank-cell) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center; /* Center content vertically */
  padding: 4px 0;
  border-radius: 3px;
  min-height: 36px; /* Ensure consistent height */
  font-size: 12px; /* Slightly smaller font */
}

:deep(.rank-cell.accepted) {
  background-color: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.3);
}

:deep(.rank-cell.failed) {
  background-color: rgba(245, 34, 45, 0.05);
  border: 1px solid rgba(245, 34, 45, 0.2);
  color: #f5222d;
  font-weight: 500;
}

:deep(.rank-cell.frozen) {
  background-color: #f0f0f0; /* Grey background */
  border: 1px solid #d9d9d9; /* Grey border */
  color: #888; /* Grey text */
}

:deep(.rank-cell .time) {
  font-weight: bold;
  color: #52c41a;
  font-size: 13px; /* Make time slightly larger */
}

:deep(.rank-cell .attempts),
:deep(.rank-cell .frozen-attempts) {
  font-size: 11px;
  color: #888; /* Make attempt count grey */
}

:deep(.rank-cell.failed .attempts) { /* Keep failed attempts red */
  color: #ff4d4f;
}

:deep(.rank-cell.frozen .fas) {
   font-size: 13px; 
   color: #888;
}

/* 突出显示当前项目 */
.problem-list-item {
  cursor: pointer;
}
</style> 