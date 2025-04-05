<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const countdown = ref(5)

// 倒计时后返回首页
onMounted(() => {
  const timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      router.push('/')
    }
  }, 1000)
})
</script>

<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="glitch-wrapper">
        <div class="glitch">页面不存在</div>
      </div>
      <p class="error-desc">抱歉，您访问的页面不存在或已被删除</p>
      <div class="back-home">
        <p>{{ countdown }}秒后自动返回首页</p>
        <button class="home-button" @click="router.push('/')">立即返回首页</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
}

.not-found-content {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 90%;
}

.error-code {
  font-size: 8rem;
  font-weight: 900;
  background: linear-gradient(45deg, #1890ff, #52c41a);
  -webkit-text-fill-color: transparent;
  margin-bottom: 1rem;
  animation: pulse 2s infinite;
}

.error-desc {
  font-size: 1.2rem;
  margin: 1.5rem 0;
  color: #666;
}

.back-home {
  margin-top: 2rem;
}

.back-home p {
  margin-bottom: 1rem;
  color: #666;
}

.home-button {
  background: #1890ff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.home-button:hover {
  background: #40a9ff;
}

/* 故障文本效果 - 简化版 */
.glitch-wrapper {
  margin: 1rem 0;
}

.glitch {
  position: relative;
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  animation: glitch 3s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

@keyframes glitch {
  0% {
    transform: translate(0);
  }
  2% {
    transform: translate(-3px, 2px);
    color: #ff0099;
  }
  4% {
    transform: translate(0);
  }
  6% {
    transform: translate(3px, -2px);
    color: #00b3ff;
  }
  8% {
    transform: translate(0);
  }
  92% {
    transform: translate(0);
  }
  94% {
    transform: translate(2px, 1px);
    color: #ff0099;
  }
  96% {
    transform: translate(0);
  }
  98% {
    transform: translate(-2px, -1px);
    color: #00b3ff;
  }
  100% {
    transform: translate(0);
  }
}

@media (max-width: 768px) {
  .error-code {
    font-size: 6rem;
  }
  
  .glitch {
    font-size: 2rem;
  }
  
  .error-desc {
    font-size: 1rem;
  }
}
</style> 