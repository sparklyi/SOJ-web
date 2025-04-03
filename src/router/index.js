import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
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
import { isAuthenticated, getUserId, getAccessToken } from '../utils/auth'

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
    component: Contests,
    meta: { requiresAuth: true }
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
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

  // 如果已登录但尝试访问登录页，重定向到首页或目标页面
  if (to.path === '/login' && isAuthenticated()) {
    if (to.query.redirect) {
      next({ path: to.query.redirect })
    } else {
      next('/')
    }
    return
  }

  next()
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 路由切换后的操作，比如关闭加载动画等
  window.scrollTo(0, 0)
})

export default router 