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
export function getProblemDetail(id, contestId) {
  const url = `/api/v1/problem/${Number(id)}`
  const params = {}
  
  // 如果提供了竞赛ID，则添加到参数中
  if (contestId) {
    params.contest_id = Number(contestId)
  }
  
  return request({
    url,
    method: 'get',
    params
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
    data: {
      user_id: data.user_id,
      problem_id: data.problem_id,
      language_id: data.language_id,
      contest_id: data.contest_id,
      page: data.page || 1,
      size: data.size || 10
    }
  })
}

// 获取提交详情
export function getSubmissionDetail(id) {
  return request({
    url: `/api/v1/submission/${id}`,
    method: 'get'
  })
}

// 获取用户创建的题目列表
export function getUserProblems(params) {
  // 过滤掉空值参数
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
  )
  
  return request({
    url: '/api/v1/problem/user',
    method: 'post',
    data: {
      ...filteredParams,
      page: params.page || 1,
      page_size: params.page_size || 10
    }
  })
}

// 删除题目
export function deleteProblemAPI(problemId) {
  return request({
    url: `/api/v1/problem/${problemId}`,
    method: 'delete'
  })
}

// 更新题目
export const updateProblemAPI = (problemData) => {
  return request({
    url: `/api/v1/problem/update`,
    method: 'put',
    data: problemData
  })
}

// 创建新题目
export function createProblemAPI(data) {
  return request({
    url: '/api/v1/problem/create',
    method: 'post',
    data
  })
}

// 获取题目测试点
export function getProblemTestCaseAPI(id) {
  return request({
    url: `/api/v1/problem/${id}/case`,
    method: 'get'
  })
}

// 创建题目测试点
export function createProblemTestCaseAPI(id, data) {
  return request({
    url: `/api/v1/problem/${id}/create`,
    method: 'post',
    data: {
      content: data
    }
  })
}

// 更新题目测试点
export function updateProblemTestCaseAPI(id, data) {
  return request({
    url: `/api/v1/problem/${id}/update`,
    method: 'put',
    data: {
      content: data
    }
  })
}

// 获取题目判题统计数据
export function getProblemJudgeCount(problemId) {
  return request({
    url: `/api/v1/problem/${problemId}/judge_count`,
    method: 'get'
  })
}

// 获取题目排行榜
export function getProblemRanking(problemId) {
  return request({
    url: `/api/v1/submission/rank/${problemId}`,
    method: 'get'
  })
} 