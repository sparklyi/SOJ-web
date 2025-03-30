import request from '../utils/request'

// 获取题目列表
export function getProblems(params) {
  // 过滤掉空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
  )
  // 添加默认分页参数
  return request({
    url: '/api/v1/problem',
    method: 'post',
    data: {
      ...filteredParams,
      page: params.page || 1
    }
  })
}

// 获取题目详情
export function getProblemDetail(id) {
  return request({
    url: `/api/v1/problem/${Number(id)}`,
    method: 'get'
  })
} 