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

// 获取支持的编程语言列表
export function getLanguages() {
  return request({
    url: '/api/v1/language',
    method: 'post',
    data: {
      status: true
    }
  })
}

// 自测运行代码
export function runCode(data) {
  return request({
    url: '/api/v1/submission/run',
    method: 'post',
    data
  })
}

// 提交代码
export function submitCode(data) {
  return request({
    url: '/api/v1/submission/judge',
    method: 'post',
    data
  })
}

// 获取提交记录列表
export function getSubmissionList(data) {
  return request({
    url: '/api/v1/submission/list',
    method: 'post',
    data
  })
}

// 获取提交详情
export function getSubmissionDetail(id) {
  return request({
    url: `/api/v1/submission/${id}`,
    method: 'get'
  })
} 