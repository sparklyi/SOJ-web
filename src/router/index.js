import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../utils/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: {
      title: '首页',
      requiresAuth: false
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue'),
    meta: {
      title: '关于',
      requiresAuth: false
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: {
      title: '控制台',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 我的应用` : '我的应用'

  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    })
  } else if (to.name === 'Login' && isAuthenticated()) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 路由切换后的操作，比如关闭加载动画等
  window.scrollTo(0, 0)
})

export default router 