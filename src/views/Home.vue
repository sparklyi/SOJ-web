<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getContests, getContestList } from '../api/contest'
import { getProblems } from '../api/problem'
import { formatDateTime } from '../utils/dateUtil'

const router = useRouter()

// 公告数据
const announcements = ref([
  {
    id: 1,
    title: '系统升级通知',
    content: '系统将于2024年5月10日进行版本升级，升级期间可能出现短暂服务中断，请提前做好准备。',
    date: '2024-05-01',
    important: true
  },
  {
    id: 2,
    title: '春季算法竞赛报名开始',
    content: '2024年春季算法竞赛报名通道已开启，竞赛时间为5月20日，欢迎各位同学踊跃参加！',
    date: '2024-05-03',
    important: false
  },
  {
    id: 3,
    title: '新增题目类别',
    content: '系统新增了图论算法和动态规划专题，包含多道经典题目，欢迎挑战！',
    date: '2024-04-25',
    important: false
  }
])

// 热门题目 - 改为空数组，通过 API 获取
const popularProblems = ref([])

// 热门竞赛 - 改为空数组，通过 API 获取
const upcomingContests = ref([])

// 获取热门题目（前三条）
const fetchPopularProblems = async () => {
  try {
    const response = await getProblems({
      page: 1,
      page_size: 3,
      status: true // 获取公开的题目
    })

    if (response.code === 200) {
      popularProblems.value = (response.data.detail || []).map(problem => ({
        id: problem.ID,
        title: problem.name,
        difficulty: problem.level
      }))
    } else {
      console.error('获取热门题目失败:', response.message)
    }
  } catch (error) {
    console.error('获取热门题目失败:', error)
  }
}

// 获取近期竞赛
const fetchUpcomingContests = async () => {
  try {
    // 获取当前时间，格式化为 yyyy-MM-dd HH:mm:ss
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const currentTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`

    // 获取竞赛数据，限制为3个，时间大于当前时间
    const response = await getContestList({
      page: 1,
      page_size: 3,
      start_after: currentTime
    })

    if (response.code === 200) {
      // 格式化竞赛数据
      upcomingContests.value = (response.data.detail || []).map(contest => ({
        id: contest.ID,
        title: contest.name,
        startTime: formatDateTime(contest.start_time),
        duration: getDuration(contest.start_time, contest.end_time),
        type: contest.type,
        tag: contest.tag
      }))
    } else {
      console.error('获取近期竞赛失败:', response.message)
    }
  } catch (error) {
    console.error('获取近期竞赛失败:', error)
  }
}

// 计算竞赛时长
const getDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return '未知'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  // 计算小时差
  const diffHours = Math.floor((end - start) / (1000 * 60 * 60))
  
  if (diffHours >= 24) {
    const days = Math.floor(diffHours / 24)
    const hours = diffHours % 24
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`
  } else {
    return `${diffHours}小时`
  }
}

// 热门讨论
const hotDiscussions = ref([
  {
    id: 1,
    title: '如何优化动态规划算法的空间复杂度',
    author: '算法大师',
    viewCount: 328,
    date: '2024-05-06'
  },
  {
    id: 2,
    title: '分享一道有趣的回溯算法题及解题思路',
    author: 'CodeWizard',
    viewCount: 256,
    date: '2024-05-03'
  },
  {
    id: 3,
    title: '图解红黑树原理及其应用',
    author: '数据结构爱好者',
    viewCount: 187,
    date: '2024-04-28'
  }
])

// 跳转到题目详情
const goToProblem = (id) => {
  router.push(`/problem/${id}`)
}

// 跳转到竞赛详情
const goToContest = (id) => {
  router.push(`/contest/${id}`)
}

// 跳转到题库
const goToProblems = () => {
  router.push('/problems')
}

// 跳转到竞赛列表
const goToContests = () => {
  router.push('/contests')
}

// 跳转到讨论详情
const goToDiscussion = (id) => {
  router.push(`/discussion/${id}`)
}

// 生命周期钩子
onMounted(() => {
  // 获取近期竞赛和热门题目
  fetchUpcomingContests()
  fetchPopularProblems()
})
</script>

<template>
  <div class="home-container">
    <!-- 主横幅 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>SOJ 在线评测系统</h1>
        <p class="hero-subtitle">提升编程能力，挑战高难度算法</p>
        <div class="hero-actions">
          <button class="primary-btn" @click="goToProblems">浏览题库</button>
          <button class="secondary-btn" @click="goToContests">参加竞赛</button>
        </div>
      </div>
    </section>
    
    <div class="main-content">
      <!-- 左侧内容：热门题目 -->
      <div class="left-content">
        <!-- 热门题目 -->
        <section class="card popular-problems">
          <div class="card-header">
            <h2>热门题目</h2>
            <button class="view-all-btn" @click="goToProblems">查看全部</button>
          </div>
          <div class="problem-list">
            <div 
              v-for="problem in popularProblems" 
              :key="problem.id" 
              class="problem-item"
              @click="goToProblem(problem.id)"
            >
              <div class="problem-info">
                <h3 class="problem-title">{{ problem.title }}</h3>
                <div class="problem-meta">
                  <span :class="['difficulty-badge', problem.difficulty.toLowerCase()]">
                    {{ problem.difficulty }}
                  </span>
                </div>
              </div>
              <div class="arrow-icon">
                <i class="arrow-right"></i>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- 中间内容：竞赛 -->
      <div class="middle-content">
        <!-- 近期竞赛 -->
        <section class="card upcoming-contests">
          <div class="card-header">
            <h2>近期竞赛</h2>
            <button class="view-all-btn" @click="goToContests">查看全部</button>
          </div>
          <div class="contest-list">
            <div 
              v-for="contest in upcomingContests" 
              :key="contest.id" 
              class="contest-item"
              @click="goToContest(contest.id)"
            >
              <div class="contest-info">
                <h3 class="contest-title">{{ contest.title }}</h3>
                <div class="contest-meta">
                  <div class="contest-time">
                    <i class="time-icon"></i>
                    <span>{{ contest.startTime }}</span>
                  </div>
                  <div class="contest-details">
                    <span class="contest-duration">时长: {{ contest.duration }}</span>
                    <span class="contest-tag">{{ contest.tag }}</span>
                    <span class="contest-type">{{ contest.type }}</span>
                  </div>
                </div>
              </div>
              <div class="arrow-icon">
                <i class="arrow-right"></i>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- 右侧内容：公告栏 -->
      <div class="right-content">
        <section class="card announcement-board">
          <div class="card-header">
            <h2>公告栏</h2>
          </div>
          <div class="announcement-list">
            <div 
              v-for="announcement in announcements" 
              :key="announcement.id" 
              class="announcement-item"
              :class="{ 'important': announcement.important }"
            >
              <div class="announcement-header">
                <h3 class="announcement-title">
                  <i v-if="announcement.important" class="important-icon"></i>
                  {{ announcement.title }}
                </h3>
                <span class="announcement-date">{{ announcement.date }}</span>
              </div>
              <p class="announcement-content">{{ announcement.content }}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 主横幅 */
.hero-section {
  background: linear-gradient(135deg, #4a90e2, #6773e5, #7e5de5);
  border-radius: 16px;
  padding: 70px 40px;
  margin: 30px 0 40px;
  color: white;
  text-align: center;
  box-shadow: 0 15px 30px rgba(74, 144, 226, 0.2);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(30deg);
}

.hero-content {
  max-width: 700px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.hero-section h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 16px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 30px;
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.primary-btn, .secondary-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  border: none;
}

.primary-btn {
  background-color: white;
  color: #4a90e2;
}

.primary-btn:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.secondary-btn {
  background-color: rgba(255, 255, 255, 0.15);
  color: white;
  backdrop-filter: blur(10px);
}

.secondary-btn:hover {
  background-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
}

/* 主内容区域 - 调整为三列相等宽度 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 20px;
  margin-bottom: 30px;
}

/* 卡片通用样式 */
.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.03), 0 6px 6px rgba(0, 0, 0, 0.02);
  overflow: hidden;
  margin-bottom: 30px;
  transition: transform 0.3s, box-shadow 0.3s;
  border: 1px solid rgba(0, 0, 0, 0.03);
}

.card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.05), 0 10px 10px rgba(0, 0, 0, 0.03);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  border-bottom: 1px solid #f0f0f0;
  background: linear-gradient(to right, #fcfcfc, #ffffff);
}

.card-header h2 {
  font-size: 1.4rem;
  color: #333;
  margin: 0;
}

.view-all-btn {
  background: none;
  border: none;
  color: #4a90e2;
  font-size: 14px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.view-all-btn:hover {
  background: rgba(74, 144, 226, 0.1);
}

/* 题目列表 */
.problem-list {
  padding: 0;
}

.problem-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 28px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.problem-item:last-child {
  border-bottom: none;
}

.problem-item:hover {
  background: #f8f9fa;
  transform: translateX(5px);
}

.problem-title {
  font-size: 1.1rem;
  margin: 0 0 8px;
  color: #333;
}

.problem-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.difficulty-badge {
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-badge.easy {
  background: #e6f7ff;
  color: #4a90e2;
}

.difficulty-badge.mid {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty-badge.hard {
  background: #ffebee;
  color: #f44336;
}

.arrow-icon {
  color: #ccc;
  transition: transform 0.2s;
}

.problem-item:hover .arrow-icon,
.contest-item:hover .arrow-icon {
  transform: translateX(5px);
}

/* 箭头图标 */
.arrow-right {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-top: 2px solid #4a90e2;
  border-right: 2px solid #4a90e2;
  transform: rotate(45deg);
}

/* 竞赛列表 */
.contest-list {
  padding: 0;
}

.contest-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.contest-item:last-child {
  border-bottom: none;
}

.contest-item:hover {
  background: #f8f9fa;
}

.contest-title {
  font-size: 1.1rem;
  margin: 0 0 8px;
  color: #333;
}

.contest-meta {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.contest-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #666;
  font-size: 14px;
}

.time-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12,2C6.5,2,2,6.5,2,12s4.5,10,10,10s10-4.5,10-10S17.5,2,12,2z M12,20c-4.4,0-8-3.6-8-8s3.6-8,8-8s8,3.6,8,8S16.4,20,12,20z'/%3E%3Cpath d='M12.5,7H11v6l5.2,3.1l0.8-1.2l-4.5-2.7V7z'/%3E%3C/svg%3E");
  background-size: contain;
}

.contest-details {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #666;
}

.contest-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #4a90e2;
  border-radius: 12px;
  font-size: 12px;
}

.contest-tag {
  padding: 2px 8px;
  background: #e8f5e9;
  color: #4caf50;
  border-radius: 12px;
  font-size: 12px;
  margin-right: 5px;
}

/* 公告栏 */
.announcement-board {
  height: 100%;
  border-left: 4px solid #4a90e2;
}

.announcement-list {
  padding: 12px 0;
}

.announcement-item {
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  transition: transform 0.2s;
}

.announcement-item:hover {
  transform: translateX(5px);
  background-color: #f9f9f9;
}

.announcement-item:last-child {
  border-bottom: none;
}

.announcement-item.important {
  background-color: #fff8e1;
  border-left: 3px solid #ffab00;
  margin-left: -3px;
}

.announcement-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.announcement-title {
  font-size: 1.1rem;
  margin: 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.important-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f44336'%3E%3Cpath d='M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M13,17h-2v-2h2V17z M13,13h-2V7h2V13z'/%3E%3C/svg%3E");
  background-size: contain;
}

.announcement-date {
  font-size: 14px;
  color: #999;
}

.announcement-content {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr 1fr;
  }
  
  .right-content {
    grid-column: span 2;
  }
}

@media (max-width: 900px) {
  .main-content {
    grid-template-columns: 1fr;
  }
  
  .middle-content, .right-content {
    grid-column: span 1;
  }
  
  .hero-section {
    padding: 40px 20px;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
}

@media (max-width: 600px) {
  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }
  
  .primary-btn, .secondary-btn {
    width: 100%;
  }
  
  .card-header {
    padding: 16px;
  }
  
  .problem-item, .contest-item, .announcement-item {
    padding: 16px;
  }
}
</style> 