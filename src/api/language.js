import request from '../utils/request'

/**
 * 获取测评语言列表
 * @param {Object} params - 请求参数
 * @param {Boolean} params.status - 语言状态筛选
 * @returns {Promise} 请求结果
 */
export function getLanguages(params = {}) {
  return request({
    url: '/api/v1/language',
    method: 'post',
    data: params
  })
}

/**
 * 同步测评语言
 * @returns {Promise} 请求结果
 */
export function syncLanguages() {
  return request({
    url: '/api/v1/language/sync',
    method: 'post'
  })
}

/**
 * 更新测评语言状态
 * @param {Object} params - 请求参数
 * @param {Number} params.id - 语言ID
 * @param {Boolean} params.status - 语言状态
 * @returns {Promise} 请求结果
 */
export function updateLanguageStatus(params) {
  return request({
    url: '/api/v1/language/update',
    method: 'put',
    data: params
  })
} 