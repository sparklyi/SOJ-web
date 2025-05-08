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
import { isAuthenticated, getUserId, getAccessToken, getUserAuth, isSuperAdmin } from '../utils/auth'
import { message } from 'ant-design-vue'
import ContestEdit from '../views/ContestEdit.vue'
import ContestDetailsManage from '../views/ContestDetailsManage.vue'

// 权限检查 - 只允许Auth=3的超级管理员访问管理面板
async function checkSuperAdminPermission() {
  try {
    const userAuth = getUserAuth();
    return userAuth === 3; 
  } catch (error) {
    console.error('检查超级管理员权限失败:', error);
    return false;
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
    component: ProblemDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/contests',
    name: 'Contests',
    component: Contests,
    
  },
  {
    path: '/contest/:id',
    name: 'ContestDetail',
    component: ContestDetail,
    meta: { requiresAuth: true },
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/contest/:contestId/problem/:problemId',
    name: 'ContestProblemDetail',
    component: ContestProblemDetail,
    props: true,
    meta: { requiresAuth: true }
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
    meta: { requiresAuth: true, requiresSuperAdmin: true }
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
    component: ContestEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/contest-management/:id',
    name: 'ContestDetailsManage',
    component: ContestDetailsManage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },

  // 匹配所有未定义的路径
  {
    path: '/:pathMatch(.*)*',
    redirect: '/not-found'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})


const updateDynamicTitle = async (to) => {
  try {
    
    if ((to.name === 'ProblemDetail' || to.name === 'ContestProblemDetail') && to.params.id) {
   
      document.title = `SOJ - 题目 #${to.params.id}`
      
   
      const { getProblemDetail } = await import('../api/problem')
      const contestId = to.query.contestId || localStorage.getItem('current_contest_id') || null
      const result = await getProblemDetail(to.params.id, contestId)
      
      if (result && result.code === 200 && result.data && result.data.name) {
        
        document.title = `SOJ - ${result.data.name}`
      }
    }
    // 竞赛详情页，尝试获取竞赛名称
    else if (to.name === 'ContestDetail' && to.params.id) {
      
      document.title = `SOJ - 竞赛 #${to.params.id}`
      
      
      const { getContestDetail } = await import('../api/contest')
      const result = await getContestDetail(to.params.id)
      
      if (result && result.code === 200 && result.data && result.data.name) {
      
        document.title = `SOJ - ${result.data.name}`
      }
    }
  } catch (error) {
    console.error('获取动态标题出错:', error)
  }
}

router.beforeEach(async (to, from, next) => {
  
  console.log('当前访问路由:', to.fullPath)
  console.log('是否需要登录:', to.matched.some(record => record.meta.requiresAuth))
  console.log('当前是否已登录:', isAuthenticated())
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }

    // 检查超级管理员权限
    if (to.matched.some(record => record.meta.requiresSuperAdmin)) {
      const isSuperAdminUser = await checkSuperAdminPermission()
      if (!isSuperAdminUser) {
        message.error('您没有足够的权限访问此页面')
        next('/') 
        return
      }
    }
  }

  if (to.path === '/login' && isAuthenticated()) {
    if (to.query.redirect) {
      next({ path: to.query.redirect })
    } else {
      next('/')
    }
    return
  }


  let title = 'SOJ - 在线评测系统'
  if (to.meta.title) {
    title = to.meta.title
  } else if (to.name === 'ProblemDetail' && to.params.id) {
    title = `SOJ - 题目 #${to.params.id}`
  } else if (to.name === 'ContestProblemDetail' && to.params.id) {
    title = `SOJ - 竞赛题目 #${to.params.id}`
  } else if (to.name === 'ContestDetail' && to.params.id) {
    title = `SOJ - 竞赛 #${to.params.id}`
  } else if (to.name === 'Contests') {
    title = `SOJ - 竞赛列表`
  } else if (to.name === 'Problems') {
    title = `SOJ - 题库`
  } else if (to.name === 'Login') {
    title = `SOJ - 登录`
  } else if (to.name === 'Register') {
    title = `SOJ - 注册`
  } else if (to.name === 'Profile') {
    title = `SOJ - 个人资料`
  }

  document.title = title
  next()
})



router.afterEach((to) => {

  if (['ProblemDetail', 'ContestProblemDetail', 'ContestDetail'].includes(to.name)) {
    updateDynamicTitle(to)
  }
  
  // 路由切换后，滚动到页面顶部
  window.scrollTo(0, 0)
})

export default router 