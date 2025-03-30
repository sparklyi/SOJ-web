<script setup>
import { ref } from 'vue'

const activeTab = ref('problems')

const tabs = [
  { key: 'problems', label: '题目管理' },
  { key: 'contests', label: '竞赛管理' },
  { key: 'users', label: '用户管理' }
]

const problems = ref([
  {
    id: 1,
    title: '两数之和',
    difficulty: '简单',
    category: '数组',
    status: '已发布'
  },
  {
    id: 2,
    title: '最长回文子串',
    difficulty: '中等',
    category: '字符串',
    status: '草稿'
  }
])

const contests = ref([
  {
    id: 1,
    title: '2024春季算法竞赛',
    startTime: '2024-03-01 10:00',
    endTime: '2024-03-01 14:00',
    status: '未开始'
  }
])

const users = ref([
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: '管理员',
    status: '正常'
  },
  {
    id: 2,
    username: 'user1',
    email: 'user1@example.com',
    role: '普通用户',
    status: '正常'
  }
])
</script>

<template>
  <div class="admin-container">
    <h1>管理面板</h1>
    
    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="content">
      <!-- 题目管理 -->
      <div v-if="activeTab === 'problems'" class="tab-content">
        <div class="header">
          <h2>题目列表</h2>
          <button class="add-btn">添加题目</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>难度</th>
                <th>分类</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="problem in problems" :key="problem.id">
                <td>{{ problem.id }}</td>
                <td>{{ problem.title }}</td>
                <td>{{ problem.difficulty }}</td>
                <td>{{ problem.category }}</td>
                <td>{{ problem.status }}</td>
                <td>
                  <button class="action-btn edit">编辑</button>
                  <button class="action-btn delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 竞赛管理 -->
      <div v-if="activeTab === 'contests'" class="tab-content">
        <div class="header">
          <h2>竞赛列表</h2>
          <button class="add-btn">创建竞赛</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>开始时间</th>
                <th>结束时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contest in contests" :key="contest.id">
                <td>{{ contest.id }}</td>
                <td>{{ contest.title }}</td>
                <td>{{ contest.startTime }}</td>
                <td>{{ contest.endTime }}</td>
                <td>{{ contest.status }}</td>
                <td>
                  <button class="action-btn edit">编辑</button>
                  <button class="action-btn delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="header">
          <h2>用户列表</h2>
          <button class="add-btn">添加用户</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>邮箱</th>
                <th>角色</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.role }}</td>
                <td>{{ user.status }}</td>
                <td>
                  <button class="action-btn edit">编辑</button>
                  <button class="action-btn delete">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
}

.tabs {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.tab-item {
  padding: 8px 16px;
  cursor: pointer;
  color: #666;
  border-radius: 4px;
  transition: all 0.3s;
}

.tab-item:hover {
  color: #4caf50;
}

.tab-item.active {
  color: #4caf50;
  background: #e8f5e9;
}

.content {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  color: #333;
}

.add-btn {
  padding: 8px 24px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.add-btn:hover {
  background: #45a049;
}

.table-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background: #f5f5f5;
  color: #666;
  font-weight: 500;
}

.action-btn {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.action-btn.edit {
  background: #e3f2fd;
  color: #2196f3;
}

.action-btn.edit:hover {
  background: #bbdefb;
}

.action-btn.delete {
  background: #ffebee;
  color: #f44336;
}

.action-btn.delete:hover {
  background: #ffcdd2;
}

@media (max-width: 768px) {
  .admin-container {
    padding: 15px;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .content {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .add-btn {
    width: 100%;
  }
}
</style> 