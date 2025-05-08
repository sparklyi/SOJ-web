<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import { getContestRank } from '../api/contest'

const props = defineProps({
  contestId: {
    type: [Number, String],
    required: true
  },
  problemList: {
    type: Array,
    required: true
  }
})

// 滚榜状态
const resolverState = ref({
  isStarted: false,        // 是否开始滚榜
  isPaused: false,         // 是否暂停
  isFinished: false,       // 是否完成
  currentRow: 0,           // 当前处理的行索引
  speed: 1,                // 滚榜速度倍率
  processingSubmission: false, // 是否正在处理提交
  progress: 0              // 总体进度百分比
})

// 排名数据
const rankList = ref([])
const resolvedRankings = ref([]) // 滚榜中已展示的排名
const frozenSubmissions = ref([]) // 封榜后的提交

// 加载状态
const loading = ref(false)
const initialDataLoaded = ref(false)

// 滚榜控制
const highlightedTeam = ref(null)
const animationTimeouts = ref([])

// 加载排名数据
const fetchRankings = async () => {
  loading.value = true
  try {
    const res = await getContestRank(props.contestId, { contest_id: props.contestId })
    if (res.code === 200 && res.data) {
      rankList.value = res.data.detail || []
      
      // 初始化已解决的排名 (只显示封榜前的成绩)
      resolvedRankings.value = rankList.value.map(item => {
        // 深拷贝用户数据，但只保留封榜前的成绩
        return {
          ...item,
          info: {
            ...item.info,
            current: { ...(item.info?.freeze || {}) }
          }
        }
      })
      
      // 提取封榜后的提交
      extractFrozenSubmissions()
      sortResolvedRankings()
      initialDataLoaded.value = true
    } else {
      message.error(res.message || '获取排行榜数据失败')
    }
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
    message.error('获取排行榜数据失败')
  } finally {
    loading.value = false
  }
}

// 提取封榜后的提交
const extractFrozenSubmissions = () => {
  frozenSubmissions.value = []
  
  rankList.value.forEach(user => {
    if (!user.info || !user.info.freeze || !user.info.actual) return
    
    // 比较封榜数据和实际数据，找出变化
    const freezeDetails = user.info.freeze.details || {}
    const actualDetails = user.info.actual.details || {}
    
    for (const problemId in actualDetails) {
      // 如果实际状态与封榜状态不同，或封榜时没有此题的状态但实际有解出
      if (!freezeDetails[problemId] || 
          freezeDetails[problemId].status !== actualDetails[problemId].status) {
        
        // 只关注成功的提交
        if (actualDetails[problemId].status === 3) {
          frozenSubmissions.value.push({
            userId: user.user_id,
            userName: user.apply_name,
            problemId: problemId,
            status: actualDetails[problemId].status,
            timestamp: actualDetails[problemId].penalty,
            count: actualDetails[problemId].count
          })
        }
      }
    }
  })
  
  // 按照时间戳排序
  frozenSubmissions.value.sort((a, b) => a.timestamp - b.timestamp)
}

// 对已解决的排名进行排序
const sortResolvedRankings = () => {
  resolvedRankings.value.sort((a, b) => {
    // 先按通过题目数降序
    const aAccepted = a.info?.current?.accepted_count || 0
    const bAccepted = b.info?.current?.accepted_count || 0
    
    if (bAccepted !== aAccepted) {
      return bAccepted - aAccepted
    }
    
    // 如果通过题目数相同，按罚时升序
    const aPenalty = a.info?.current?.penalty_count || 0
    const bPenalty = b.info?.current?.penalty_count || 0
    return aPenalty - bPenalty
  })
}

// 开始滚榜
const startResolving = async () => {
  if (!initialDataLoaded.value) {
    await fetchRankings()
  }
  
  if (frozenSubmissions.value.length === 0) {
    message.info('没有封榜后的提交数据，无法进行滚榜')
    return
  }
  
  resolverState.value.isStarted = true
  resolverState.value.isPaused = false
  resolverState.value.currentRow = 0
  
  processNextSubmission()
}

// 处理下一个提交
const processNextSubmission = async () => {
  if (resolverState.value.isPaused || !resolverState.value.isStarted) {
    return
  }
  
  if (resolverState.value.currentRow >= frozenSubmissions.value.length) {
    resolverState.value.isFinished = true
    resolverState.value.progress = 100
    return
  }
  
  resolverState.value.processingSubmission = true
  const submission = frozenSubmissions.value[resolverState.value.currentRow]
  
  // 更新进度
  resolverState.value.progress = Math.floor((resolverState.value.currentRow / frozenSubmissions.value.length) * 100)
  
  // 高亮当前处理的队伍
  highlightedTeam.value = submission.userId
  
  // 延迟以便动画效果展示
  await new Promise(resolve => {
    const timeout = setTimeout(() => {
      // 更新该用户的得分信息
      updateUserScore(submission)
      // 重新排序
      sortResolvedRankings()
      
      resolverState.value.currentRow++
      resolverState.value.processingSubmission = false
      resolve()
    }, 2000 / resolverState.value.speed)
    
    animationTimeouts.value.push(timeout)
  })
  
  // 继续处理下一个
  processNextSubmission()
}

// 更新用户分数
const updateUserScore = (submission) => {
  const userIndex = resolvedRankings.value.findIndex(user => user.user_id === submission.userId)
  if (userIndex === -1) return
  
  const user = resolvedRankings.value[userIndex]
  
  // 确保nested对象存在
  if (!user.info) user.info = {}
  if (!user.info.current) user.info.current = {}
  if (!user.info.current.details) user.info.current.details = {}
  
  // 更新该题的状态
  user.info.current.details[submission.problemId] = {
    status: submission.status,
    count: submission.count,
    penalty: submission.timestamp,
    score: 0
  }
  
  // 更新总分和罚时
  let acceptedCount = 0
  let penaltyCount = 0
  
  for (const problemId in user.info.current.details) {
    const detail = user.info.current.details[problemId]
    if (detail.status === 3) { // 已通过
      acceptedCount++
      penaltyCount += detail.penalty
    }
  }
  
  user.info.current.accepted_count = acceptedCount
  user.info.current.penalty_count = penaltyCount
}

// 暂停滚榜
const pauseResolving = () => {
  resolverState.value.isPaused = true
}

// 继续滚榜
const resumeResolving = () => {
  resolverState.value.isPaused = false
  processNextSubmission()
}

// 加速滚榜
const speedUpResolving = () => {
  if (resolverState.value.speed < 8) {
    resolverState.value.speed *= 2
  }
}

// 减速滚榜
const slowDownResolving = () => {
  if (resolverState.value.speed > 0.5) {
    resolverState.value.speed /= 2
  }
}

// 重置滚榜
const resetResolving = () => {
  // 清除所有定时器
  animationTimeouts.value.forEach(timeout => clearTimeout(timeout))
  animationTimeouts.value = []
  
  resolverState.value = {
    isStarted: false,
    isPaused: false,
    isFinished: false,
    currentRow: 0,
    speed: 1,
    processingSubmission: false,
    progress: 0
  }
  
  highlightedTeam.value = null
  
  // 重置排名数据
  if (initialDataLoaded.value) {
    resolvedRankings.value = rankList.value.map(item => {
      return {
        ...item,
        info: {
          ...item.info,
          current: { ...(item.info?.freeze || {}) }
        }
      }
    })
    sortResolvedRankings()
  }
}

// 获取题目名称
const getProblemLabel = (index) => {
  return String.fromCharCode(65 + index) // A, B, C, ...
}

// 获取问题状态样式
const getProblemStatusClass = (status) => {
  if (!status) return ''
  
  switch (status) {
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

// 检查用户是否被高亮
const isTeamHighlighted = (userId) => {
  return highlightedTeam.value === userId
}

// 获取问题状态
const getProblemStatus = (user, problemId) => {
  if (!user || !user.info || !user.info.current || !user.info.current.details) {
    return null
  }
  
  return user.info.current.details[problemId] || null
}

// 暴露方法给父组件
defineExpose({
  startResolving,
  pauseResolving,
  resumeResolving,
  resetResolving,
  speedUpResolving,
  slowDownResolving,
  fetchRankings
})

// 组件挂载时获取数据
onMounted(() => {
  fetchRankings()
})
</script>

<template>
  <div class="resolver-container">
    <!-- 滚榜控制面板 -->
    <div class="resolver-controls">
      <div class="resolver-progress">
        <div class="progress-bar">
          <div class="progress-inner" :style="{ width: `${resolverState.progress}%` }"></div>
        </div>
        <div class="progress-text">{{ resolverState.progress }}%</div>
      </div>
      
      <div class="control-buttons">
        <button 
          v-if="!resolverState.isStarted" 
          @click="startResolving" 
          :disabled="loading || !initialDataLoaded"
          class="control-btn start-btn"
        >
          开始滚榜
        </button>
        
        <button 
          v-if="resolverState.isStarted && !resolverState.isFinished && resolverState.isPaused" 
          @click="resumeResolving" 
          class="control-btn resume-btn"
        >
          继续
        </button>
        
        <button 
          v-if="resolverState.isStarted && !resolverState.isFinished && !resolverState.isPaused" 
          @click="pauseResolving" 
          class="control-btn pause-btn"
        >
          暂停
        </button>
        
        <button 
          @click="resetResolving" 
          class="control-btn reset-btn"
          :disabled="!resolverState.isStarted"
        >
          重置
        </button>
        
        <button 
          @click="slowDownResolving" 
          class="control-btn speed-btn"
          :disabled="!resolverState.isStarted || resolverState.speed <= 0.5"
        >
          减速 (x{{ resolverState.speed }})
        </button>
        
        <button 
          @click="speedUpResolving" 
          class="control-btn speed-btn"
          :disabled="!resolverState.isStarted || resolverState.speed >= 8"
        >
          加速 (x{{ resolverState.speed }})
        </button>
      </div>
    </div>
    
    <!-- 排名表格 -->
    <div v-if="loading" class="resolver-loading">
      加载排行榜数据中...
    </div>
    <div v-else-if="!initialDataLoaded" class="resolver-empty">
      暂无排行榜数据，请点击"开始滚榜"按钮加载数据
    </div>
    <div v-else class="resolver-table-wrapper">
      <table class="resolver-table">
        <thead>
          <tr>
            <th class="rank-col">排名</th>
            <th class="team-col">队伍</th>
            <th class="solved-col">解题数</th>
            <th class="penalty-col">总罚时</th>
            <!-- 题目列 -->
            <th 
              v-for="(problem, index) in problemList" 
              :key="problem.id"
              class="problem-col"
            >
              {{ getProblemLabel(index) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="(team, index) in resolvedRankings" 
            :key="team.user_id"
            :class="{ 'highlighted-team': isTeamHighlighted(team.user_id) }"
          >
            <td class="rank-col">{{ index + 1 }}</td>
            <td class="team-col">{{ team.apply_name }}</td>
            <td class="solved-col">
              {{ team.info?.current?.accepted_count || 0 }}
            </td>
            <td class="penalty-col">
              {{ Math.floor(team.info?.current?.penalty_count || 0) }}
            </td>
            <!-- 题目状态 -->
            <td 
              v-for="problem in problemList" 
              :key="problem.id"
              class="problem-col"
              :class="getProblemStatusClass(
                getProblemStatus(team, problem.id)?.status
              )"
            >
              <template v-if="getProblemStatus(team, problem.id)">
                <template v-if="getProblemStatus(team, problem.id).status === 3">
                  <!-- 已通过 -->
                  {{ Math.max(0, getProblemStatus(team, problem.id).count - 1) }}
                  <span class="time-marker">
                    {{ Math.floor(getProblemStatus(team, problem.id).penalty) }}
                  </span>
                </template>
                <template v-else-if="getProblemStatus(team, problem.id).status === 4">
                  <!-- 部分通过 -->
                  {{ getProblemStatus(team, problem.id).count }}
                </template>
                <template v-else>
                  <!-- 未通过 -->
                  <span class="failed-count">
                    {{ getProblemStatus(team, problem.id).count }}
                  </span>
                </template>
              </template>
              <template v-else>-</template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.resolver-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.resolver-controls {
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.resolver-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex-grow: 1;
  height: 12px;
  background: #f0f0f0;
  border-radius: 6px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #52c41a);
  transition: width 0.3s ease;
}

.progress-text {
  font-weight: bold;
  color: #333;
  min-width: 50px;
  text-align: right;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.control-btn {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start-btn {
  background: #1890ff;
  color: white;
}

.start-btn:hover:not(:disabled) {
  background: #40a9ff;
}

.pause-btn {
  background: #faad14;
  color: white;
}

.pause-btn:hover:not(:disabled) {
  background: #ffc53d;
}

.resume-btn {
  background: #52c41a;
  color: white;
}

.resume-btn:hover:not(:disabled) {
  background: #73d13d;
}

.reset-btn {
  background: #ff4d4f;
  color: white;
}

.reset-btn:hover:not(:disabled) {
  background: #ff7875;
}

.speed-btn {
  background: #722ed1;
  color: white;
}

.speed-btn:hover:not(:disabled) {
  background: #9254de;
}

.resolver-loading,
.resolver-empty {
  padding: 40px;
  text-align: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  color: #666;
}

.resolver-table-wrapper {
  overflow-x: auto;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

.resolver-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.resolver-table th,
.resolver-table td {
  padding: 12px 8px;
  text-align: center;
  border: 1px solid #f0f0f0;
}

.resolver-table th {
  background: #fafafa;
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}

.rank-col {
  width: 60px;
}

.team-col {
  min-width: 120px;
  text-align: left;
}

.solved-col, 
.penalty-col {
  width: 80px;
}

.problem-col {
  width: 60px;
  position: relative;
}

/* 问题状态 */
.accepted {
  background-color: rgba(82, 196, 26, 0.1);
}

.accepted::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(82, 196, 26, 0.2);
  animation: pulse 2s infinite;
}

.partial {
  background-color: rgba(250, 173, 20, 0.1);
}

.failed {
  background-color: rgba(255, 77, 79, 0.1);
}

.failed-count {
  color: #ff4d4f;
}

.time-marker {
  font-size: 12px;
  display: block;
  color: #389e0d;
}

/* 高亮行 */
.highlighted-team {
  background-color: rgba(24, 144, 255, 0.1);
  animation: highlight 2s;
}

@keyframes pulse {
  0% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0.2;
  }
}

@keyframes highlight {
  0% {
    background-color: rgba(24, 144, 255, 0.5);
  }
  100% {
    background-color: rgba(24, 144, 255, 0.1);
  }
}

@media (max-width: 768px) {
  .control-buttons {
    justify-content: center;
  }
  
  .resolver-table th,
  .resolver-table td {
    padding: 8px 4px;
    font-size: 12px;
  }
  
  .rank-col {
    width: 40px;
  }
  
  .solved-col, 
  .penalty-col {
    width: 60px;
  }
  
  .problem-col {
    width: 40px;
  }
}
</style> 