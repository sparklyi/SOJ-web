import request from '../utils/request'

// 获取竞赛列表
export function getContests(params) {
  // 过滤掉空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
  )
  
  return request({
    url: '/api/v1/contest',
    method: 'post',
    data: filteredParams
  })
}

// 获取竞赛列表(无需登录)
export function getContestList(params) {
  // 过滤掉空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
  )
  
  return request({
    url: '/api/v1/contest/list',
    method: 'post',
    data: filteredParams
  })
}

// 获取竞赛详情
export function getContestDetail(id) {
  return request({
    url: `/api/v1/contest/${Number(id)}`,
    method: 'get'
  })
}

// 获取竞赛排行榜
export function getContestRanking(id, params) {
  return request({
    url: `/api/v1/contest/${Number(id)}/ranking`,
    method: 'get',
    params
  })
}

// 加入私有竞赛
export function joinPrivateContest(contestId, code) {
  return request({
    url: `/api/v1/contest/${Number(contestId)}/join`,
    method: 'post',
    data: { code }
  })
}

// 报名竞赛
export function applyContest(data) {
  return request({
    url: '/api/v1/apply/add',
    method: 'post',
    data
  })
}

// 取消报名竞赛
export function cancelApply(applyId) {
  return request({
    url: `/api/v1/apply/${Number(applyId)}`,
    method: 'delete'
  })
}

// 获取用户报名信息
export function getUserApply(userId, contestId) {
  return request({
    url: '/api/v1/apply/check',
    method: 'post',
    data: {
      user_id: Number(userId),
      contest_id: Number(contestId)
    }
  })
}

// 获取竞赛排行榜
export const getContestRank = (contestId) => {
  return request({
    url: '/api/v1/contest/rank',
    method: 'post',
    data: {
      contest_id: Number(contestId)
    }
  })
}

// 获取个人报名的比赛列表
export function getUserAppliedContests(params) {
  return request({
    url: '/api/v1/apply/self',
    method: 'get',
    params
  })
}

// 获取管理权限的竞赛列表
export function getManageableContests(userId, params) {
  return request({
    url: '/api/v1/contest',
    method: 'post',
    data: {
      user_id: userId,
      page: params.page,
      page_size: params.page_size
    }
  })
}

// 创建或更新竞赛
export function updateContest(data) {
  return request({
    url: '/api/v1/contest/update',
    method: 'put',
    data
  })
}

// 创建新竞赛
export function createContest(data) {
  return request({
    url: '/api/v1/contest/create',
    method: 'post',
    data
  })
}

// 删除竞赛
export function deleteContest(id) {
  return request({
    url: `/api/v1/contest/${Number(id)}`,
    method: 'delete'
  })
} 