import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Problems from '../views/Problems.vue'
import ProblemDetail from '../views/ProblemDetail.vue'
import ContestProblemDetail from '../views/ContestProblemDetail.vue'
import Contests from '../views/Contests.vue'
import ContestDetail from '../views/ContestDetail.vue'
import ContestWaiting from '../views/ContestWaiting.vue'
import Admin from '../views/Admin.vue'
import Profile from '../views/Profile.vue'
import Settings from '../views/Settings.vue'
import Avatar from '../views/Avatar.vue'
import Submissions from '../views/Submissions.vue'
import ContestsRecord from '../views/ContestsRecord.vue'
import ContestApplies from '../views/ContestApplies.vue'
import ContestManage from '../views/ContestManage.vue'
import ProblemManage from '../views/ProblemManage.vue'
import ProblemCreate from '../views/ProblemCreate.vue'
import ProblemEdit from '../views/ProblemEdit.vue'
import NotFound from '../views/NotFound.vue'
import ProblemTestCase from '../views/ProblemTestCase.vue'
import { isAuthenticated, getUserId, getAccessToken } from '../utils/auth'
import { message } from 'ant-design-vue'

// 简单的管理员权限检查函数
async function checkAdminPermission() {
  try {
    // 简单检查是否有权限，使用原生 fetch，避免循环依赖
    const userId = getUserId()
    const token = getAccessToken()
    
    if (!userId || !token) {
      return false
    }
    
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/user/${Number(userId)}`, {
      headers: {
        'SOJ-Access-Token': token
      }
    })
    
    const data = await response.json()
    if (data.code === 200 && data.data && data.data.role >= 2) {
      return true
    }
    
    return false
  } catch (error) {
    console.error('检查管理员权限失败:', error)
    return false
  }
}

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/problems',
    name: 'Problems',
    component: Problems
  },
  {
    path: '/problem/:id',
    name: 'ProblemDetail',
    component: ProblemDetail
  },
  {
    path: '/contests',
    name: 'Contests',
    component: Contests
  },
  {
    path: '/contest/:id',
    name: 'ContestDetail',
    component: ContestDetail,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/contest-problem/:id',
    name: 'ContestProblemDetail',
    component: ContestProblemDetail
  },
  {
    path: '/contest/:id/waiting',
    name: 'ContestWaiting',
    component: ContestWaiting,
    meta: { requiresAuth: true },
    props: true
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { requiresAuth: true }
  },
  {
    path: '/avatar',
    name: 'Avatar',
    component: Avatar,
    meta: { requiresAuth: true }
  },
  {
    path: '/submissions',
    name: 'Submissions',
    component: Submissions,
    meta: { requiresAuth: true }
  },
  {
    path: '/contests-record',
    name: 'ContestsRecord',
    component: ContestsRecord,
    meta: { requiresAuth: true }
  },
  {
    path: '/contest-applies',
    name: 'ContestApplies',
    component: ContestApplies,
    meta: { requiresAuth: true }
  },
  {
    path: '/contest-manage',
    name: 'ContestManage',
    component: ContestManage,
    meta: { requiresAuth: true }
  },
  {
    path: '/problem-manage',
    name: 'ProblemManage',
    component: ProblemManage,
    meta: { requiresAuth: true }
  },
  {
    path: '/problem-create',
    name: 'ProblemCreate',
    component: ProblemCreate,
    meta: { requiresAuth: true }
  },
  {
    path: '/problem-edit/:id',
    name: 'ProblemEdit',
    component: ProblemEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/problem-testcase/:id',
    name: 'ProblemTestCase',
    component: ProblemTestCase,
    meta: { requiresAuth: true }
  },
  {
    path: '/not-found',
    name: 'NotFound',
    component: NotFound
  },
  {
    path: '/contest-create',
    name: 'ContestCreate',
    component: () => import('../views/ContestCreate.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/contest-edit/:id',
    name: 'ContestEdit',
    component: () => import('../views/ContestEdit.vue'),
    meta: { requiresAuth: true }
  },
  // 通配符路由，匹配所有未定义的路径，必须放在最后
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加一个辅助函数，用于在导航到题目页面后更新标题
// 这个需要放在router创建之后，beforeEach之前
const updateDynamicTitle = async (to) => {
  try {
    // 题目详情页、竞赛题目详情页，尝试获取题目名称
    if ((to.name === 'ProblemDetail' || to.name === 'ContestProblemDetail') && to.params.id) {
      // 先设置一个临时标题
      document.title = `SOJ - 题目 #${to.params.id}`
      
      // 异步获取题目信息
      const { getProblemDetail } = await import('../api/problem')
      const contestId = to.query.contestId || localStorage.getItem('current_contest_id') || null
      const result = await getProblemDetail(to.params.id, contestId)
      
      if (result && result.code === 200 && result.data && result.data.name) {
        // 获取到题目名称后，更新标题
        document.title = `SOJ - ${result.data.name}`
      }
    }
    // 竞赛详情页，尝试获取竞赛名称
    else if (to.name === 'ContestDetail' && to.params.id) {
      // 先设置一个临时标题
      document.title = `SOJ - 竞赛 #${to.params.id}`
      
      // 异步获取竞赛信息
      const { getContestDetail } = await import('../api/contest')
      const result = await getContestDetail(to.params.id)
      
      if (result && result.code === 200 && result.data && result.data.name) {
        // 获取到竞赛名称后，更新标题
        document.title = `SOJ - ${result.data.name}`
      }
    }
  } catch (error) {
    console.error('获取动态标题出错:', error)
  }
}

// 修改现有的路由守卫
router.beforeEach(async (to, from, next) => {
  // 检查是否需要身份验证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 使用 auth.js 的 isAuthenticated 方法检查令牌
    if (!isAuthenticated()) {
      // 如果没有令牌，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 如果需要管理员权限
    if (to.matched.some(record => record.meta.requiresAdmin)) {
      const isAdmin = await checkAdminPermission()
      if (!isAdmin) {
        next('/')
        return
      }
    }
  }
  
  // 对于需要登录提示的页面，检查登录状态并显示提示，但允许访问
  if ((to.path.startsWith('/contests') || to.path.startsWith('/problem/')) && !isAuthenticated()) {
    // 使用setTimeout确保在页面加载后显示提示
    setTimeout(() => {
      message.info('登录后可参与竞赛及提交代码')
    }, 500)
  }

  // 如果已登录但尝试访问登录页，重定向到首页或目标页面
  if (to.path === '/login' && isAuthenticated()) {
    if (to.query.redirect) {
      next({ path: to.query.redirect })
    } else {
      next('/')
    }
    return
  }

  // 基础标题
  let title = 'SOJ - 在线评测系统'

  // 根据路由动态设置标题
  if (to.meta.title) {
    // 如果路由自己定义了标题，直接使用
    title = to.meta.title
  } else if (to.name === 'ProblemDetail' && to.params.id) {
    // 题目详情页 - 先设置基础标题，后续异步更新
    title = `SOJ - 题目 #${to.params.id}`
  } else if (to.name === 'ContestProblemDetail' && to.params.id) {
    // 竞赛题目详情页 - 先设置基础标题，后续异步更新
    title = `SOJ - 竞赛题目 #${to.params.id}`
  } else if (to.name === 'ContestDetail' && to.params.id) {
    // 竞赛详情页
    title = `SOJ - 竞赛 #${to.params.id}`
  } else if (to.name === 'Contests') {
    // 竞赛列表页
    title = `SOJ - 竞赛列表`
  } else if (to.name === 'Problems') {
    // 题目列表页
    title = `SOJ - 题库`
  } else if (to.name === 'Login') {
    // 登录页
    title = `SOJ - 登录`
  } else if (to.name === 'Register') {
    // 注册页
    title = `SOJ - 注册`
  } else if (to.name === 'Profile') {
    // 个人资料页
    title = `SOJ - 个人资料`
  }

  // 设置页面标题
  document.title = title
  next()
})

// 路由后置钩子，用于异步更新标题
router.afterEach((to) => {
  // 对于需要动态获取标题的页面，在导航完成后异步更新标题
  if (['ProblemDetail', 'ContestProblemDetail', 'ContestDetail'].includes(to.name)) {
    updateDynamicTitle(to)
  }
  
  // 路由切换后，滚动到页面顶部
  window.scrollTo(0, 0)
})

export default router 