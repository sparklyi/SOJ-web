<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

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

// 热门题目
const popularProblems = ref([
  {
    id: 1,
    title: '两数之和',
    difficulty: '简单',
    tags: ['数组', '哈希表']
  },
  {
    id: 2,
    title: '最长回文子串',
    difficulty: '中等',
    tags: ['字符串', '动态规划']
  },
  {
    id: 3,
    title: '合并K个排序链表',
    difficulty: '困难',
    tags: ['链表', '分治', '堆']
  },
  {
    id: 4,
    title: '二叉树的层序遍历',
    difficulty: '中等',
    tags: ['树', '广度优先搜索']
  }
])

// 热门竞赛
const upcomingContests = ref([
  {
    id: 1,
    title: '2024春季算法竞赛',
    startTime: '2024-05-20 10:00',
    duration: '3小时',
    type: '个人赛'
  },
  {
    id: 2,
    title: '2024程序设计能力挑战赛',
    startTime: '2024-06-15 14:00',
    duration: '4小时',
    type: '团队赛'
  }
])

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

// 活动通知
const activityNotices = ref([
  {
    id: 1,
    title: '算法竞赛冲刺训练营',
    date: '2024-05-15',
    type: '线上活动'
  },
  {
    id: 2,
    title: 'ACM编程技巧分享会',
    date: '2024-05-22',
    type: '线上讲座'
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
                  <div class="tags">
                    <span v-for="tag in problem.tags" :key="tag" class="tag">{{ tag }}</span>
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
      
      <!-- 中间内容：竞赛和活动 -->
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

        <!-- 活动通知 -->
        <section class="card activity-notices">
          <div class="card-header">
            <h2>活动通知</h2>
          </div>
          <div class="activity-list">
            <div v-for="activity in activityNotices" :key="activity.id" class="activity-item">
              <div class="activity-info">
                <h3 class="activity-title">{{ activity.title }}</h3>
                <div class="activity-meta">
                  <span class="activity-date">日期: {{ activity.date }}</span>
                  <span class="activity-type">{{ activity.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      <!-- 右侧内容：公告栏和热门讨论 -->
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

        <!-- 热门讨论 -->
        <section class="card hot-discussions">
          <div class="card-header">
            <h2>热门讨论</h2>
          </div>
          <div class="discussion-list">
            <div 
              v-for="discussion in hotDiscussions" 
              :key="discussion.id" 
              class="discussion-item"
              @click="goToDiscussion(discussion.id)"
            >
              <h3 class="discussion-title">{{ discussion.title }}</h3>
              <div class="discussion-meta">
                <span class="discussion-author">{{ discussion.author }}</span>
                <span class="discussion-views">
                  <i class="view-icon"></i>
                  {{ discussion.viewCount }}
                </span>
                <span class="discussion-date">{{ discussion.date }}</span>
              </div>
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

/* 主内容区域 */
.main-content {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
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

.difficulty-badge.简单 {
  background: #e6f7ff;
  color: #4a90e2;
}

.difficulty-badge.中等 {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty-badge.困难 {
  background: #ffebee;
  color: #f44336;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
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

/* 活动通知 */
.activity-list {
  padding: 0;
}

.activity-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.activity-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-2px);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-title {
  font-size: 1rem;
  margin: 0 0 8px;
  color: #333;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
}

.activity-type {
  padding: 2px 8px;
  background: #e6f7ff;
  color: #4a90e2;
  border-radius: 12px;
  font-size: 12px;
}

/* 热门讨论 */
.hot-discussions {
  margin-top: 20px;
}

.discussion-list {
  padding: 0;
}

.discussion-item {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s;
}

.discussion-item:hover {
  background-color: #f8f9fa;
  transform: translateX(5px);
}

.discussion-item:last-child {
  border-bottom: none;
}

.discussion-title {
  font-size: 1rem;
  margin: 0 0 8px;
  color: #333;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.discussion-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #999;
}

.discussion-author {
  color: #666;
  font-weight: 500;
}

.discussion-views {
  display: flex;
  align-items: center;
  gap: 4px;
}

.view-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12,4.5C7,4.5,2.73,7.61,1,12c1.73,4.39,6,7.5,11,7.5s9.27-3.11,11-7.5C21.27,7.61,17,4.5,12,4.5z M12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5s5,2.24,5,5S14.76,17,12,17z M12,9c-1.66,0-3,1.34-3,3s1.34,3,3,3s3-1.34,3-3S13.66,9,12,9z'/%3E%3C/svg%3E");
  background-size: contain;
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