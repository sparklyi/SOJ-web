export const MAIN_MENU_ITEMS = [
  { path: '/', label: '首页' },
  { path: '/problems', label: '题库' },
  { path: '/contests', label: '竞赛' }
]

export const USER_MENU_ITEMS = [
  { key: 'profile', label: '个人主页' },
  { key: 'avatar', label: '上传头像' },
  { key: 'submissions', label: '提交记录' },
  { 
    key: 'personal-contests', 
    label: '个人比赛',
    children: [
      { key: 'contest-applies', label: '个人报名比赛' },
      { key: 'contest-manage', label: '比赛管理' }
    ]
  },
  { key: 'problem-manage', label: '题目管理' },
  { key: 'logout', label: '退出登录' }
]

export const USER_ROLES = {
  BAN: -1,   // 封禁用户
  USER: 1,   // 普通用户
  ADMIN: 2,  // 管理员
  ROOT: 3    // 超级管理员
}

export const USER_ROLE_COLORS = {
  [USER_ROLES.BAN]: '#999999',   // 封禁用户 - 灰色
  [USER_ROLES.USER]: '#1890ff',  // 普通用户 - 蓝色
  [USER_ROLES.ADMIN]: '#52c41a', // 管理员 - 绿色
  [USER_ROLES.ROOT]: '#fa541c'   // 超级管理员 - 红色
}

export const USER_ROLE_NAMES = {
  [USER_ROLES.BAN]: '封禁用户',
  [USER_ROLES.USER]: '普通用户', 
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.ROOT]: '超级管理员'
} 