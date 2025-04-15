<template>
  <footer class="footer">
    <div class="footer-content">
      <div class="copyright">
        SOJ©2025 All rights reserved 
        <a href="mailto:admin@admin.com">admin@admin.com</a>
      </div>
      <div class="beian-info">
        <a href="https://beian.miit.gov.cn" target="_blank" rel="noopener noreferrer">京ICP备xxxxx号-1</a>
        <span class="divider">|</span>
        <span class="beian">京公网安备 xxxxx号</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: #f5f5f5;
  padding: 20px 0;
  margin-top: 40px;
  border-top: 1px solid #e8e8e8;
}

.footer-content {
  max-width: 1280px;
  margin: 0 auto;
  text-align: center;
  padding: 0 24px;
}

.copyright {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.beian-info {
  color: #999;
  font-size: 13px;
}

.divider {
  margin: 0 8px;
  color: #ccc;
}

a {
  color: #666;
  text-decoration: none;
  transition: color 0.3s;
}

a:hover {
  color: #4CAF50;
}

@media (max-width: 768px) {
  .footer {
    padding: 15px 0;
  }
  
  .footer-content {
    padding: 0 15px;
  }
  
  .copyright, .beian-info {
    font-size: 12px;
  }
}
</style> 