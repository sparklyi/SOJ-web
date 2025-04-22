<script setup>
import { ref, onMounted, watch, h, computed, createVNode } from 'vue'
import { useRouter } from 'vue-router'
import { 
  getAdminProblems, 
  deleteAdminProblem, 
  getAdminContests,
  deleteAdminContest,
  getAdminUsers,
  resetUserPassword,
  updateUserInfo,
  deleteUser
} from '../api/admin'
import { useUserStore } from '../store/user'
import { Modal, message, Button, Table, Input, Tag, Space, Popconfirm } from 'ant-design-vue'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('problems')

// 搜索ID
const searchId = ref('')
const searchContestId = ref('')
const searchUserId = ref('')

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
const users = ref([])
const userLoading = ref(false)

// 定义表格列
const problemColumns = [
  { title: 'ID', dataIndex: 'ID', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'name', key: 'name' },
  { 
    title: '难度', 
    dataIndex: 'level', 
    key: 'level',
    customRender: ({ text }) => {
      const color = text === 'easy' ? 'success' : text === 'mid' ? 'warning' : 'error';
      const label = getDifficultyText(text);
      return h(Tag, { color }, () => label);
    } 
  },
  { 
    title: '创建时间', 
    dataIndex: 'CreatedAt', 
    key: 'created_at',
    customRender: ({ text }) => formatDate(text) 
  },
  { 
    title: '更新时间', 
    dataIndex: 'UpdatedAt', 
    key: 'updated_at',
    customRender: ({ text }) => formatDate(text) 
  },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status',
    customRender: ({ text }) => {
      return h(Tag, { color: text ? 'success' : 'default' }, () => text ? '已发布' : '私有');
    } 
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 250,
    customRender: ({ record }) => {
      return h(Space, {}, () => [
        h(Button, { 
          type: 'primary', 
          size: 'small',
          onClick: () => editProblem(record.ID)
        }, () => '编辑'),
        h(Button, { 
          type: 'default', 
          size: 'small',
          onClick: () => editTestCase(record.ID)
        }, () => '测试点'),
        h(Popconfirm, {
          title: '确定要删除此题目吗？',
          description: '此操作不可逆，请谨慎操作',
          onConfirm: () => deleteProblem(record.ID),
          okText: '确认',
          cancelText: '取消'
        }, () => h(Button, { danger: true, size: 'small' }, () => '删除'))
      ]);
    }
  }
];

const contestColumns = [
  { title: 'ID', dataIndex: 'ID', key: 'id', width: 80 },
  { title: '标题', dataIndex: 'name', key: 'name' },
  { 
    title: '开始时间', 
    dataIndex: 'start_time', 
    key: 'start_time',
    customRender: ({ text }) => formatDate(text) 
  },
  { 
    title: '结束时间', 
    dataIndex: 'end_time', 
    key: 'end_time',
    customRender: ({ text }) => formatDate(text) 
  },
  { 
    title: '状态', 
    key: 'status',
    customRender: ({ record }) => {
      const status = getContestStatusText(record.start_time, record.end_time);
      const color = status === '进行中' ? 'success' : status === '未开始' ? 'processing' : 'default';
      return h(Tag, { color }, () => status);
    }
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 160,
    customRender: ({ record }) => {
      return h(Space, {}, () => [
        h(Button, { 
          type: 'primary', 
          size: 'small',
          onClick: () => editContest(record.ID)
        }, () => '编辑'),
        h(Popconfirm, {
          title: '确定要删除此竞赛吗？',
          description: '此操作不可逆，请谨慎操作',
          onConfirm: () => deleteContestItem(record.ID),
          okText: '确认',
          cancelText: '取消'
        }, () => h(Button, { danger: true, size: 'small' }, () => '删除'))
      ]);
    }
  }
];

const userColumns = [
  { title: 'ID', dataIndex: 'ID', key: 'id', width: 80 },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '邮箱', dataIndex: 'email', key: 'email' },
  { 
    title: '角色', 
    dataIndex: 'role', 
    key: 'role',
    customRender: ({ text }) => {
      const { label, color } = getUserRoleTagInfo(text);
      return h(Tag, { color }, () => label);
    }
  },
  { 
    title: '创建时间', 
    dataIndex: 'CreatedAt', 
    key: 'created_at',
    customRender: ({ text }) => formatDate(text) 
  },
  {
    title: '操作',
    key: 'action',
    fixed: 'right',
    width: 280,
    customRender: ({ record }) => {
      return h(Space, {}, () => [
        h(Button, { 
          type: 'primary', 
          size: 'small',
          onClick: () => editUserInfo(record)
        }, () => '编辑'),
        h(Button, { 
          type: 'default', 
          size: 'small',
          onClick: () => updateUserRole(record)
        }, () => '权限设置'),
        h(Button, { 
          size: 'small',
          onClick: () => resetPassword(record.email)
        }, () => '重置密码'),
        h(Popconfirm, {
          title: '确定要删除此用户吗？',
          description: '此操作不可逆，请谨慎操作',
          onConfirm: () => deleteUserItem(record.ID),
          okText: '确认',
          cancelText: '取消'
        }, () => h(Button, { danger: true, size: 'small' }, () => '删除'))
      ]);
    }
  }
];

// 权限检查
const hasPermission = computed(() => {
  return userStore.userInfo?.role === 3
})

// 数据加载状态
const isInitialized = ref(false)

// 加载题目列表
const fetchProblems = async () => {
  if (!hasPermission.value) {
    message.error('您没有管理员权限')
    router.push('/')
    return
  }

  problemLoading.value = true
  try {
    const res = await getAdminProblems({
      user_id: userStore.isAdmin ? undefined : userStore.userInfo.ID,
      page: 1,
      page_size: 10,
      id: searchId.value ? parseInt(searchId.value) : undefined
    })
    if (res.code === 200) {
      problems.value = res.data.detail || []
    } else {
      message.error(res.message || '获取题目列表失败')
    }
  } catch (error) {
    console.error('获取题目列表失败:', error)
    message.error('获取题目列表失败，请检查网络连接')
  } finally {
    problemLoading.value = false
    isInitialized.value = true
  }
}

// 加载竞赛列表
const fetchContests = async () => {
  if (!hasPermission.value) {
    message.error('您没有管理员权限')
    router.push('/')
    return
  }

  contestLoading.value = true
  try {
    const res = await getAdminContests(
      userStore.isAdmin ? undefined : userStore.userInfo.ID,
      {
        page: 1,
        page_size: 10,
        id: searchContestId.value ? parseInt(searchContestId.value) : undefined
      }
    )
    if (res.code === 200) {
      contests.value = res.data.detail || []
    } else {
      message.error(res.message || '获取竞赛列表失败')
    }
  } catch (error) {
    console.error('获取竞赛列表失败:', error)
    message.error('获取竞赛列表失败，请检查网络连接')
  } finally {
    contestLoading.value = false
    isInitialized.value = true
  }
}

// 加载用户列表
const fetchUsers = async () => {
  if (!hasPermission.value) {
    message.error('您没有管理员权限')
    router.push('/')
    return
  }

  userLoading.value = true
  try {
    const res = await getAdminUsers({
      page: 1,
      page_size: 10,
      id: searchUserId.value ? parseInt(searchUserId.value) : undefined
    })
    if (res.code === 200) {
      users.value = res.data || []
    } else {
      message.error(res.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
    message.error('获取用户列表失败，请检查网络连接')
  } finally {
    userLoading.value = false
    isInitialized.value = true
  }
}

// 编辑题目
const editProblem = (problemId) => {
  router.push({
    path: `/problem-edit/${problemId}`,  // 跳转到编辑页面
    query: { from: router.currentRoute.value.fullPath }      // 将当前页面的路径作为 'from' 参数传递
  })
}
// 编辑测试点
const editTestCase = (problemId) => {
  router.push({
    path: `/problem-testcase/${problemId}`,  // 跳转到编辑页面
    query: { from: router.currentRoute.value.fullPath }      // 将当前页面的路径作为 'from' 参数传递
  })
  
}

// 删除题目
const deleteProblem = async (problemId) => {
  try {
    const res = await deleteAdminProblem(problemId)
    if (res.code === 200) {
      message.success('删除题目成功')
      fetchProblems()
    } else {
      message.error(res.message || '删除题目失败')
    }
  } catch (error) {
    console.error('删除题目失败:', error)
    message.error('删除题目失败')
  }
}

// 编辑竞赛
const editContest = (contestId) => {
  router.push({
    path: `/contest-edit/${contestId}`,
    query: { from: router.currentRoute.value.fullPath }  
})
}

// 删除竞赛
const deleteContestItem = async (contestId) => {
  try {
    const res = await deleteAdminContest(contestId)
    if (res.code === 200) {
      message.success('删除竞赛成功')
      fetchContests()
    } else {
      message.error(res.message || '删除竞赛失败')
    }
  } catch (error) {
    console.error('删除竞赛失败:', error)
    message.error('删除竞赛失败')
  }
}

// 编辑用户信息
const editUserInfo = (user) => {
  let formUsername = user.username
  let formEmail = user.email
  let formProfile = user.profile || ''

  Modal.confirm({
    title: '编辑用户信息',
    content: createVNode('div', {}, [
      createVNode('div', { style: 'margin-bottom: 16px' }, [
        createVNode('div', { style: 'margin-bottom: 8px' }, '用户名:'),
        createVNode(Input, { 
          value: formUsername,
          onChange: (e) => { formUsername = e.target.value }
        })
      ]),
      createVNode('div', { style: 'margin-bottom: 16px' }, [
        createVNode('div', { style: 'margin-bottom: 8px' }, '邮箱:'),
        createVNode(Input, { 
          value: formEmail,
          onChange: (e) => { formEmail = e.target.value }
        })
      ]),
      createVNode('div', {}, [
        createVNode('div', { style: 'margin-bottom: 8px' }, '个人简介:'),
        createVNode(Input.TextArea, { 
          value: formProfile, 
          rows: 3,
          onChange: (e) => { formProfile = e.target.value }
        })
      ])
    ]),
    onOk: () => {
      if (!formUsername) {
        message.error('用户名不能为空')
        return Promise.reject('用户名不能为空')
      }
      
      if (!formEmail) {
        message.error('邮箱不能为空')
        return Promise.reject('邮箱不能为空')
      }
      
      return updateUserInfoData({
        id: user.ID,
        username: formUsername,
        email: formEmail,
        profile: formProfile,
        role: user.role
      })
    },
    okText: '保存',
    cancelText: '取消'
  })
}

// 重置用户密码
const resetPassword = async (email) => {
  if (!email) return
  
  try {
    const res = await resetUserPassword(email)
    if (res.code === 200) {
      message.success('密码重置成功')
    } else {
      message.error(res.message || '密码重置失败')
    }
  } catch (error) {
    console.error('密码重置失败:', error)
    message.error('密码重置失败')
  }
}

// 更新用户角色
const updateUserRole = (user) => {
  let selectedRole = user.role

  Modal.confirm({
    title: '设置用户权限',
    content: createVNode('div', {}, [
      createVNode('p', {}, `当前用户: ${user.username}`),
      createVNode('p', {}, `当前权限: ${getUserRoleText(user.role)}`),
      createVNode('div', { style: 'margin-top: 16px' }, [
        createVNode('div', { style: 'margin-bottom: 8px' }, '选择新权限:'),
        createVNode('select', { 
          style: 'width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #d9d9d9;',
          value: selectedRole,
          onChange: (e) => { selectedRole = Number(e.target.value) }
        }, [
          createVNode('option', { value: -1, selected: user.role === -1 }, '封禁'),
          createVNode('option', { value: 1, selected: user.role === 1 }, '普通用户'),
          createVNode('option', { value: 2, selected: user.role === 2 }, '管理员'),
          createVNode('option', { value: 3, selected: user.role === 3 }, '超级管理员')
        ])
      ])
    ]),
    onOk: () => {
      return updateUserInfoData({
        id: user.ID,
        username: user.username,
        profile: user.profile || '',
        role: selectedRole
      })
    },
    okText: '保存',
    cancelText: '取消'
  })
}

// 更新用户信息
const updateUserInfoData = async (userData) => {
  try {
    const res = await updateUserInfo(userData)
    if (res.code === 200) {
      message.success('用户信息更新成功')
      await fetchUsers()
      return Promise.resolve()
    } else {
      message.error(res.message || '更新用户信息失败')
      return Promise.reject(res.message || '更新用户信息失败')
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    message.error('更新用户信息失败')
    return Promise.reject(error)
  }
}

// 删除用户
const deleteUserItem = async (userId) => {
  try {
    const res = await deleteUser(userId)
    if (res.code === 200) {
      message.success('删除用户成功')
      fetchUsers()
    } else {
      message.error(res.message || '删除用户失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    message.error('删除用户失败')
  }
}

// 获取用户角色文本
const getUserRoleText = (role) => {
  if (role === -1) return '封禁'
  if (role === 1) return '普通用户'
  if (role === 2) return '管理员' 
  if (role === 3) return '超级管理员'
  return '未知'
}

// 获取用户角色标签信息
const getUserRoleTagInfo = (role) => {
  if (role === -1) return { label: '封禁', color: 'error' }
  if (role === 1) return { label: '普通用户', color: 'default' }
  if (role === 2) return { label: '管理员', color: 'success' }
  if (role === 3) return { label: '超级管理员', color: 'purple' }
  return { label: '未知', color: 'default' }
}

// 监听标签切换 - 优化性能
const handleTabChange = (tabKey) => {
  if (activeTab.value === tabKey) return // 避免重复加载
  
  activeTab.value = tabKey
  
  if (tabKey === 'problems' && (!isInitialized.value || problems.value.length === 0)) {
    fetchProblems()
  } else if (tabKey === 'contests' && (!isInitialized.value || contests.value.length === 0)) {
    fetchContests()
  } else if (tabKey === 'users' && (!isInitialized.value || users.value.length === 0)) {
    fetchUsers()
  }
}

// 监听搜索ID变化
watch([searchId, searchContestId, searchUserId], ([newProblemId, newContestId, newUserId], [oldProblemId, oldContestId, oldUserId]) => {
  if (newProblemId !== oldProblemId && activeTab.value === 'problems') {
    fetchProblems()
  }
  if (newContestId !== oldContestId && activeTab.value === 'contests') {
    fetchContests()
  }
  if (newUserId !== oldUserId && activeTab.value === 'users') {
    fetchUsers()
  }
})

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
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 初始化: 权限检查和数据加载
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有管理员权限')
    router.push('/')
    return
  }
  
  if (activeTab.value === 'problems') {
    fetchProblems()
  } else if (activeTab.value === 'contests') {
    fetchContests()
  } else if (activeTab.value === 'users') {
    fetchUsers()
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
          <div class="header-left">
          <h2>题目列表</h2>
            <a-input-search
              v-model:value="searchId"
              placeholder="输入ID搜索"
              enter-button
              @search="fetchProblems"
              style="width: 250px"
            />
        </div>
        </div>
        <a-table
          :dataSource="problems"
          :columns="problemColumns"
          :rowKey="record => record.ID"
          :loading="problemLoading"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          bordered
        />
      </div>

      <!-- 竞赛管理 -->
      <div v-if="activeTab === 'contests'" class="tab-content">
        <div class="header">
          <div class="header-left">
          <h2>竞赛列表</h2>
            <a-input-search
              v-model:value="searchContestId"
              placeholder="输入ID搜索"
              enter-button
              @search="fetchContests"
              style="width: 250px"
            />
        </div>
        </div>
        <a-table
          :dataSource="contests"
          :columns="contestColumns"
          :rowKey="record => record.ID"
          :loading="contestLoading"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          bordered
        />
      </div>

      <!-- 用户管理 -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <div class="header">
          <div class="header-left">
          <h2>用户列表</h2>
            <a-input-search
              v-model:value="searchUserId"
              placeholder="输入ID搜索"
              enter-button
              @search="fetchUsers"
              style="width: 250px"
            />
        </div>
        </div>
        <a-table
          :dataSource="users"
          :columns="userColumns"
          :rowKey="record => record.ID"
          :loading="userLoading"
          :pagination="{ pageSize: 10, showSizeChanger: false }"
          bordered
        />
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
  border-left: 4px solid #1890ff;
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
  color: #1890ff;
}

.tab-item.active {
  color: #1890ff;
  background: #e6f7ff;
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

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header h2 {
  margin: 0;
  color: #333;
  white-space: nowrap;
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
    align-items: flex-start;
  }
  
  .header-left {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
}
</style> 