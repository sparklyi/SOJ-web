<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getAdminProblems, 
  deleteAdminProblem, 
  getAdminContests,
  deleteAdminContest
} from '../api/admin'
import { useUserStore } from '../store/user'
import { message } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('problems')

const tabs = [
  { key: 'problems', label: '题目管理' },
  { key: 'contests', label: '竞赛管理' },
  { key: 'users', label: '用户管理' }
]

// 题目管理
const problems = ref([])
const problemLoading = ref(false)

// 竞赛管理
const contests = ref([])
const contestLoading = ref(false)

// 用户管理
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

// 加载题目列表
const fetchProblems = async () => {
  problemLoading.value = true
  try {
    const res = await getAdminProblems({
      user_id: userStore.isAdmin ? undefined : userStore.userInfo.ID,
      page: 1,
      page_size: 10
    })
    if (res.code === 200) {
      problems.value = res.data.list || []
    } else {
      message.error(res.message || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败')
  } finally {
    problemLoading.value = false
  }
}

// 加载竞赛列表
const fetchContests = async () => {
  contestLoading.value = true
  try {
    const res = await getAdminContests(
      userStore.isAdmin ? undefined : userStore.userInfo.ID,
      {
        page: 1,
        page_size: 10
      }
    )
    if (res.code === 200) {
      contests.value = res.data.list || []
    } else {
      message.error(res.message || '获取竞赛列表失败')
    }
  } catch (error) {
    console.error('获取竞赛列表失败:', error)
    message.error('获取竞赛列表失败')
  } finally {
    contestLoading.value = false
  }
}

// 添加题目
const addProblem = () => {
  router.push('/problem-create')
}

// 编辑题目
const editProblem = (problemId) => {
  router.push(`/problem-edit/${problemId}`)
}

// 删除题目
const confirmDeleteProblem = (problemId, problemName) => {
  if (!problemId) return
  
  if (confirm(`确定要删除题目"${problemName}"吗？此操作不可恢复。`)) {
    deleteProblem(problemId)
  }
}

const deleteProblem = async (problemId) => {
  try {
    const res = await deleteAdminProblem(problemId)
    if (res.code === 200) {
      message.success('删除题目成功')
      fetchProblems() // 重新加载题目列表
    } else {
      message.error(res.message || '删除题目失败')
    }
  } catch (error) {
    console.error('删除题目失败:', error)
    message.error('删除题目失败')
  }
}

// 添加竞赛
const addContest = () => {
  router.push('/contest-create')
}

// 编辑竞赛
const editContest = (contestId) => {
  router.push(`/contest-edit/${contestId}`)
}

// 删除竞赛
const confirmDeleteContest = (contestId, contestName) => {
  if (!contestId) return
  
  if (confirm(`确定要删除竞赛"${contestName}"吗？此操作不可恢复。`)) {
    deleteContestItem(contestId)
  }
}

const deleteContestItem = async (contestId) => {
  try {
    const res = await deleteAdminContest(contestId)
    if (res.code === 200) {
      message.success('删除竞赛成功')
      fetchContests() // 重新加载竞赛列表
    } else {
      message.error(res.message || '删除竞赛失败')
    }
  } catch (error) {
    console.error('删除竞赛失败:', error)
    message.error('删除竞赛失败')
  }
}

// 监听标签切换
const handleTabChange = (tabKey) => {
  activeTab.value = tabKey
  
  if (tabKey === 'problems') {
    fetchProblems()
  } else if (tabKey === 'contests') {
    fetchContests()
  }
}

// 获取题目难度文本
const getDifficultyText = (level) => {
  if (level === 'easy') return '简单'
  if (level === 'mid') return '中等'
  if (level === 'hard') return '困难'
  return '未知'
}

// 获取竞赛状态文本
const getContestStatusText = (startTime, endTime) => {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  
  if (now < start) return '未开始'
  if (now > end) return '已结束'
  return '进行中'
}

// 格式化时间
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  if (activeTab.value === 'problems') {
    fetchProblems()
  } else if (activeTab.value === 'contests') {
    fetchContests()
  }
})
</script>

<template>
  <div class="admin-container">
    <h1>管理面板</h1>
    
    <div class="tabs">
      <div
        v-for="tab in tabs"
        :key="tab.key"
        :class="['tab-item', { active: activeTab === tab.key }]"
        @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </div>
    </div>

    <div class="content">
      <!-- 题目管理 -->
      <div v-if="activeTab === 'problems'" class="tab-content">
        <div class="header">
          <h2>题目列表</h2>
          <button class="add-btn" @click="addProblem">添加题目</button>
        </div>
        <div v-if="problemLoading" class="loading-state">
          加载中...
        </div>
        <div v-else class="table-container">
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
              <tr v-for="problem in problems" :key="problem.ID">
                <td>{{ problem.ID }}</td>
                <td>{{ problem.name }}</td>
                <td>{{ getDifficultyText(problem.level) }}</td>
                <td>{{ problem.tag || '-' }}</td>
                <td>{{ problem.status ? '已发布' : '草稿' }}</td>
                <td>
                  <button class="action-btn edit" @click="editProblem(problem.ID)">编辑</button>
                  <button class="action-btn delete" @click="confirmDeleteProblem(problem.ID, problem.name)">删除</button>
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
          <button class="add-btn" @click="addContest">创建竞赛</button>
        </div>
        <div v-if="contestLoading" class="loading-state">
          加载中...
        </div>
        <div v-else class="table-container">
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
              <tr v-for="contest in contests" :key="contest.ID">
                <td>{{ contest.ID }}</td>
                <td>{{ contest.name }}</td>
                <td>{{ formatDate(contest.start_time) }}</td>
                <td>{{ formatDate(contest.end_time) }}</td>
                <td>{{ getContestStatusText(contest.start_time, contest.end_time) }}</td>
                <td>
                  <button class="action-btn edit" @click="editContest(contest.ID)">编辑</button>
                  <button class="action-btn delete" @click="confirmDeleteContest(contest.ID, contest.name)">删除</button>
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
  font-size: 28px;
  color: #333;
  margin-bottom: 24px;
  font-weight: 600;
  border-left: 4px solid #4CAF50;
  padding-left: 15px;
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

.loading-state {
  text-align: center;
  padding: 40px;
  color: #999;
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