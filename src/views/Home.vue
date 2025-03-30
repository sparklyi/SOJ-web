<script setup>
import { ref } from 'vue'

const stats = ref([
  { label: '题目总数', value: 100 },
  { label: '竞赛总数', value: 10 },
  { label: '用户总数', value: 1000 }
])

const recentProblems = ref([
  {
    id: 1,
    title: '两数之和',
    difficulty: '简单',
    category: '数组'
  },
  {
    id: 2,
    title: '最长回文子串',
    difficulty: '中等',
    category: '字符串'
  }
])

const recentContests = ref([
  {
    id: 1,
    title: '2024春季算法竞赛',
    startTime: '2024-03-01 10:00',
    status: '即将开始'
  },
  {
    id: 2,
    title: '2024寒假集训营',
    startTime: '2024-02-15 09:00',
    status: '进行中'
  }
])
</script>

<template>
  <div class="home-container">
    <!-- 欢迎区域 -->
    <section class="welcome-section">
      <h1>欢迎来到 SOJ</h1>
      <p>在线判题系统，提升你的编程能力</p>
    </section>

    <!-- 统计信息 -->
    <section class="stats-section">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- 最近题目 -->
    <section class="recent-section">
      <h2>最近题目</h2>
      <div class="problems-list">
        <div v-for="problem in recentProblems" :key="problem.id" class="problem-card">
          <h3>{{ problem.title }}</h3>
          <div class="problem-meta">
            <span :class="['difficulty', problem.difficulty.toLowerCase()]">
              {{ problem.difficulty }}
            </span>
            <span class="category">{{ problem.category }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 最近竞赛 -->
    <section class="recent-section">
      <h2>最近竞赛</h2>
      <div class="contests-list">
        <div v-for="contest in recentContests" :key="contest.id" class="contest-card">
          <h3>{{ contest.title }}</h3>
          <div class="contest-meta">
            <span class="time">开始时间：{{ contest.startTime }}</span>
            <span :class="['status', contest.status === '进行中' ? 'ongoing' : 'upcoming']">
              {{ contest.status }}
            </span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.welcome-section {
  text-align: center;
  padding: 40px 0;
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 30px;
}

.welcome-section h1 {
  font-size: 2.5em;
  margin-bottom: 10px;
}

.welcome-section p {
  font-size: 1.2em;
  opacity: 0.9;
}

.stats-section {
  margin-bottom: 30px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2em;
  font-weight: bold;
  color: #4CAF50;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.recent-section {
  margin-bottom: 30px;
}

.recent-section h2 {
  margin-bottom: 20px;
  color: #333;
}

.problems-list,
.contests-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.problem-card,
.contest-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.problem-card h3,
.contest-card h3 {
  margin-bottom: 12px;
  color: #333;
}

.problem-meta,
.contest-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.difficulty {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty.简单 {
  background: #e8f5e9;
  color: #4caf50;
}

.difficulty.中等 {
  background: #fff3e0;
  color: #ff9800;
}

.difficulty.困难 {
  background: #ffebee;
  color: #f44336;
}

.category {
  color: #666;
  font-size: 14px;
}

.time {
  color: #666;
  font-size: 14px;
}

.status {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
}

.status.ongoing {
  background: #e8f5e9;
  color: #4caf50;
}

.status.upcoming {
  background: #e3f2fd;
  color: #2196f3;
}

@media (max-width: 768px) {
  .home-container {
    padding: 15px;
  }
  
  .welcome-section {
    padding: 30px 0;
  }
  
  .welcome-section h1 {
    font-size: 2em;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .problems-list,
  .contests-list {
    grid-template-columns: 1fr;
  }
}
</style> 