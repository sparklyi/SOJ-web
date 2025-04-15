import request from '../utils/request'

// 管理面板 - 获取题目列表
export function getAdminProblems(params) {
  return request({
    url: '/api/v1/problem/user',
    method: 'post',
    data: {
      ...params,
      page: params.page || 1,
      page_size: params.page_size || 10
    }
  })
}

// 管理面板 - 删除题目
export function deleteAdminProblem(problemId) {
  return request({
    url: `/api/v1/problem/${problemId}`,
    method: 'delete'
  })
}

// 管理面板 - 获取竞赛列表
export function getAdminContests(userId, params) {
  return request({
    url: '/api/v1/contest',
    method: 'post',
    data: {
      user_id: userId,
      page: params.page || 1,
      page_size: params.page_size || 10,
      ...params
    }
  })
}

// 管理面板 - 删除竞赛
export function deleteAdminContest(contestId) {
  return request({
    url: `/api/v1/contest/${Number(contestId)}`,
    method: 'delete'
  })
}

// 管理面板 - 获取用户列表
export function getAdminUsers(params) {
  return request({
    url: '/api/v1/user/list',
    method: 'post',
    data: {
      page: params.page || 1,
      page_size: params.page_size || 10,
      ...params
    }
  })
}

// 管理面板 - 更新用户状态
export function updateAdminUserStatus(userId, status) {
  return request({
    url: `/api/v1/user/${userId}/status`,
    method: 'put',
    data: { status }
  })
}

// 管理面板 - 更新用户角色
export function updateAdminUserRole(userId, role) {
  return request({
    url: `/api/v1/user/${userId}/role`,
    method: 'put',
    data: { role }
  })
} 