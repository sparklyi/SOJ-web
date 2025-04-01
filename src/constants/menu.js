export const MAIN_MENU_ITEMS = [
  { path: '/', label: '首页' },
  { path: '/problems', label: '题库' },
  { path: '/contests', label: '竞赛' }
]

export const USER_MENU_ITEMS = [
  { key: 'profile', label: '个人主页' },
  { key: 'avatar', label: '上传头像' },
  { key: 'submissions', label: '提交记录' },
  { key: 'contests-record', label: '比赛记录' },
  { key: 'logout', label: '退出登录' }
]

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
}

export const USER_ROLE_COLORS = {
  [USER_ROLES.ADMIN]: '#f5222d',
  [USER_ROLES.USER]: '#1890ff',
  [USER_ROLES.GUEST]: '#52c41a'
}

export const USER_ROLE_NAMES = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.USER]: '普通用户',
  [USER_ROLES.GUEST]: '访客'
} 