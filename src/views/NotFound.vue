<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 16V12" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8H12.01" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7 17L17 7" stroke="#999" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h1 class="title">404</h1>
      <p class="message">当前页面未找到</p>
    </div>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* 使内容垂直居中 */
  background-color: #f7f8fa;
  color: #333;
  text-align: center;
  padding: 20px;
}

.not-found-content {
  max-width: 400px;
}

.icon {
  margin-bottom: 20px;
}

.title {
  font-size: 4rem; /* 稍微减小字号 */
  font-weight: 700;
  color: #ccc; /* 使用灰色 */
  margin-bottom: 10px;
}

.message {
  font-size: 1.2rem;
  color: #666;
  margin-top: 0;
}
</style> 