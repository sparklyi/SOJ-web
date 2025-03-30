<script setup>
import { ref } from 'vue'

const contests = ref([
  {
    id: 1,
    title: '2024春季算法竞赛',
    startTime: '2024-03-01 10:00',
    endTime: '2024-03-01 14:00',
    status: '即将开始',
    participants: 128
  },
  {
    id: 2,
    title: '2024寒假集训营',
    startTime: '2024-02-15 09:00',
    endTime: '2024-02-20 17:00',
    status: '进行中',
    participants: 256
  }
])
</script>

<template>
  <div class="contests-container">
    <h1>竞赛</h1>
    <div class="contests-list">
      <div v-for="contest in contests" :key="contest.id" class="contest-item">
        <div class="contest-info">
          <h3>{{ contest.title }}</h3>
          <div class="contest-time">
            <span>开始时间：{{ contest.startTime }}</span>
            <span>结束时间：{{ contest.endTime }}</span>
          </div>
          <div class="contest-meta">
            <span class="participants">
              参与人数：{{ contest.participants }}
            </span>
            <span :class="['status', contest.status === '进行中' ? 'ongoing' : 'upcoming']">
              {{ contest.status }}
            </span>
          </div>
        </div>
        <button class="enter-btn">进入竞赛</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.contests-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.contests-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.contest-item {
  background: white;
  border-radius: 8px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.contest-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.contest-info h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 18px;
}

.contest-time {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
}

.contest-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.participants {
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

.enter-btn {
  padding: 8px 24px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.enter-btn:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .contests-container {
    padding: 15px;
  }
  
  .contest-item {
    padding: 16px;
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .contest-info h3 {
    font-size: 16px;
  }
  
  .contest-time {
    flex-direction: column;
    align-items: center;
  }
  
  .contest-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .enter-btn {
    width: 100%;
  }
}
</style> 