<script setup>
import { ref, reactive, onMounted, computed, watch, h } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  getContestDetail, 
  getContestRank,
  updateContest
} from '../api/contest' 
import { getProblemDetail, getProblemsByToken } from '../api/problem' 
import { message, Modal, Input, Button, Table, Tabs, TabPane, Popconfirm, Spin, Select, Card, Empty, Tooltip } from 'ant-design-vue'
import { useUserStore } from '../store/user'
import { getUserId } from '../utils/auth' 
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const userStore = useUserStore()
const contestId = computed(() => route.params.id)
const currentUserId = getUserId() 

const loading = ref(false)
const contestDetail = ref(null)
const activeTab = ref('problems') // 默认激活题目管理页

// --- 题目管理 ---
const problemList = ref([])
const addProblemId = ref('')
const addingProblem = ref(false)
const updatingProblemSet = ref(false)
const searchResults = ref([])
const searchLoading = ref(false)
const selectedProblem = ref(null)

// --- 排行榜 ---
const rankLoading = ref(false)
const rankList = ref([])
const rankTotal = ref(0)
const rankColumns = ref([]) // 排行榜列定义

// --- 滚榜 ---
// 滚榜功能暂未实现

// 权限检查 (假设管理员才有权限)
const hasPermission = computed(() => userStore.isAdmin)

// 定义题目表格列配置
const problemTableColumns = computed(() => [
  { title: '序号', key: 'index', align: 'center', customRender: ({ index }) => getLetterIndex(index), width: 80 },
  { title: '题目ID', dataIndex: 'id', key: 'id', align: 'center', width: 100 },
  { 
    title: '题目名称', 
    dataIndex: 'name', 
    key: 'name',
    customRender: ({ text, record }) => h('a', { 
      href: `/problem/${record.id}`, 
      target: '_blank',
      style: 'color: #1890ff; text-decoration: none;'
    }, text)
  },
  { 
    title: '操作', 
    key: 'action', 
    align: 'center', 
    width: 100,
    customRender: ({ record }) => h(Popconfirm, {
       title: `确定要从竞赛中移除题目 \"${record.name}\" 吗？`, 
       okText: '确认删除',
       cancelText: '取消',
       onConfirm: () => handleDeleteProblem(record.id) 
     }, {
       default: () => h(Button, { type: 'link', danger: true, size: 'small', disabled: updatingProblemSet.value }, '删除') // Access .value for ref
     })
  }
]);

// --- 方法 ---

// 搜索题目
const searchProblem = async (query) => {
  if (!query) {
    searchResults.value = []
    return
  }
  
  searchLoading.value = true
  try {
    // 使用getProblems API搜索题目
    const res = await getProblemsByToken({ 
      ID: Number(query), 
      page: 1, 
      page_size: 10 
    })
    
    if (res.code === 200 && res.data) {
      // 根据API返回数据结构调整取值方式
      searchResults.value = res.data.detail || []
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('搜索题目失败:', error)
    searchResults.value = []
  } finally {
    searchLoading.value = false
  }
}

// 当输入框内容变化时
const handleInputChange = (value) => {
  addProblemId.value = value
  searchProblem(value)
}

// 选择题目
const handleProblemSelect = (problem) => {
  selectedProblem.value = problem
  // 根据实际API返回的ID字段名称调整
  addProblemId.value = problem.ID ? problem.ID.toString() : ''
}

// 获取竞赛详情（包含题目）
const fetchContestDetail = async () => {
  if (!contestId.value) return
  loading.value = true
  try {
    // 注意：API URL可能需要根据实际情况调整
    const res = await getContestDetail(contestId.value) 
    if (res.code === 200 && res.data) {
      contestDetail.value = res.data
      // 解析题目集
      if (contestDetail.value.problem_set) {
        try {
          problemList.value = JSON.parse(contestDetail.value.problem_set || '[]')
        } catch (e) {
          problemList.value = []
          console.error('解析题目集失败:', e)
          message.error('解析题目列表失败')
        }
      } else {
        problemList.value = []
      }
      // 获取详情后生成排行榜列
      generateRankColumns() 
    } else {
      message.error(res.message || '获取竞赛详情失败')
      router.push('/contest-manage') // 获取失败返回管理列表
    }
  } catch (error) {
    console.error('获取竞赛详情失败:', error)
    message.error('获取竞赛详情失败，请检查网络连接')
    router.push('/contest-manage')
  } finally {
    loading.value = false
  }
}

// 添加题目到竞赛
const handleAddProblem = async () => {
  if (!addProblemId.value) {
    message.warning('请输入要添加的题目ID或名称')
    return
  }
  
  // 优先使用已选择的题目
  if (selectedProblem.value) {
    const problemToAdd = selectedProblem.value
    
    // 获取正确的ID字段
    const problemId = problemToAdd.ID
    
    // 检查题目是否已存在
    if (problemList.value.some(p => p.id === problemId)) {
      message.warning('该题目已在竞赛中')
      return
    }
    
    // 直接添加已选择的题目（确保使用正确的字段名）
    const newProblemList = [...problemList.value, { 
      id: problemId, 
      name: problemToAdd.name 
    }]
    
    await updateProblemSet(newProblemList)
    addProblemId.value = ''
    selectedProblem.value = null
    searchResults.value = []
    return
  }
  
  // 如果没有选择题目，判断输入的是数字还是名称
  const input = addProblemId.value.trim();
  const isNumeric = /^\d+$/.test(input);
  
  addingProblem.value = true;
  try {
    // 根据输入类型搜索题目
    const searchParam = isNumeric ? { ID: Number(input) } : { name: input };
    const res = await getProblemsByToken({ 
      ...searchParam, 
      page: 1, 
      page_size: 10 
    });
    
    if (res.code === 200 && res.data && res.data.detail && res.data.detail.length > 0) {
      // 找到匹配的题目，使用第一个结果
      const problemData = res.data.detail[0];
      const problemId = problemData.ID;
      
      // 检查题目是否已存在
      if (problemList.value.some(p => p.id === problemId)) {
        message.warning('该题目已在竞赛中');
        return;
      }
      
      // 更新本地列表
      const newProblemList = [...problemList.value, { 
        id: problemId, 
        name: problemData.name 
      }];
      // 调用更新API
      await updateProblemSet(newProblemList);
      addProblemId.value = ''; // 清空输入框
      selectedProblem.value = null;
      searchResults.value = [];
    } else {
      if (isNumeric) {
        message.error(`未找到ID为 ${input} 的题目`);
      } else {
        message.warning(`未找到名称含 "${input}" 的题目`);
      }
    }
  } catch (error) {
    console.error('添加题目失败:', error);
    message.error('添加题目时发生错误');
  } finally {
    addingProblem.value = false;
  }
}

// 从竞赛中删除题目
const handleDeleteProblem = async (problemIdToDelete) => {
  const newProblemList = problemList.value.filter(p => p.id !== problemIdToDelete)
  await updateProblemSet(newProblemList)
}

// 调用API更新题集
const updateProblemSet = async (newProblemList) => {
  if (!contestDetail.value) return
  updatingProblemSet.value = true

  try {
    // 准备提交数据
    const formData = {
      id: Number(contestId.value),
      name: contestDetail.value.name, 
      tag: contestDetail.value.tag,
      sponsor: contestDetail.value.sponsor,
      description: contestDetail.value.description,
      type: contestDetail.value.type,
      start_time: contestDetail.value.start_time,
      end_time: contestDetail.value.end_time,
      freeze_time: contestDetail.value.freeze_time,
      publish: contestDetail.value.publish,
      public: contestDetail.value.public,
      code: contestDetail.value.code
    }
    
    // 确保problem_set是非空数组时直接添加到formData中(不使用JSON.stringify)
    if (Array.isArray(newProblemList) && newProblemList.length > 0) {
      formData.problem_set = newProblemList;
    }
    
    const res = await updateContest(formData) 
    if (res.code === 200) {
      message.success('题目列表更新成功')
      problemList.value = newProblemList // 更新本地状态
      generateRankColumns() // 更新列定义
    } else {
      message.error(res.message || '更新题目列表失败')
    }
  } catch (error) {
    console.error('更新题目列表失败:', error)
    message.error('更新题目列表时发生错误')
  } finally {
    updatingProblemSet.value = false
  }
}

// 获取排行榜数据
const fetchRankList = async () => {
  if (!contestId.value) return
  rankLoading.value = true
  try {
    const res = await getContestRank(contestId.value)
    if (res.code === 200 && res.data) {
      rankList.value = res.data.detail || []
      rankTotal.value = res.data.count || 0
    } else {
      message.error(res.message || '获取排行榜失败')
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
    message.error('获取排行榜失败，请检查网络连接')
  } finally {
    rankLoading.value = false
  }
}

// 动态生成排行榜列定义
const generateRankColumns = () => {
    const baseColumns = [
        { title: '排名', dataIndex: 'rank', key: 'rank', width: 45, fixed: 'left', customRender: ({ index }) => h('span', index + 1) },
        { title: '参赛者', dataIndex: 'apply_name', key: 'user', width: 100, fixed: 'left', ellipsis: true },
        { 
            title: '通过', 
            dataIndex: ['info', 'freeze', 'accepted_count'], 
            key: 'solved', 
            width: 60, 
            sorter: (a, b) => (a.info?.freeze?.accepted_count || 0) - (b.info?.freeze?.accepted_count || 0), 
            customRender: ({ text }) => text || 0 
        },
        { 
            title: '罚时', 
            dataIndex: ['info', 'freeze', 'penalty_count'], 
            key: 'penalty', 
            width: 70, 
            sorter: (a, b) => (a.info?.freeze?.penalty_count || 0) - (b.info?.freeze?.penalty_count || 0), 
            customRender: ({ text }) => text ? Math.floor(text) : '-' 
        }
    ];

    const problemColumns = (problemList.value || []).map((problem, index) => ({
        title: () => h('div', { 
            class: 'problem-column-header',
            style: 'display: flex; flex-direction: column; align-items: center;'
        }, [
            h('div', { class: 'problem-letter' }, String.fromCharCode(65 + index)),
            h(Tooltip, { 
                title: `${problem.id}: ${problem.name}`,
                placement: 'top'
            }, {
                default: () => h('div', { class: 'problem-id', style: 'font-size: 10px; color: #999;' }, problem.id)
            })
        ]),
        dataIndex: ['info', 'freeze', 'details', String(problem.id)],
        key: `problem_${problem.id}`,
        width: 90,
        align: 'center',
        customRender: ({ record }) => {
            const detail = record?.info?.freeze?.details?.[problem.id];
            if (!detail) return h('span', '-');
            if (detail.status === 3) { // Accepted
                 const attempts = Math.max(0, detail.count - 1);
                 const time = detail.accept_time ? `${Math.floor(detail.accept_time / 60)}` : ''
                 return h('div', { class: 'rank-cell accepted' }, [
                     h('div', { class: 'time' }, time),
                     h('div', { class: 'attempts' }, attempts > 0 ? `(-${attempts})` : '')
                 ]);
            } else if (detail.count > 0) { // Failed attempts
                return h('div', { class: 'rank-cell failed attempts' }, `(-${detail.count})`);
            }
            return h('span', '-');
        }
    }));

    rankColumns.value = [...baseColumns, ...problemColumns];
};


// 切换标签页时按需加载数据
watch(activeTab, (newTab) => {
  if (newTab === 'ranking' && rankList.value.length === 0) {
    fetchRankList()
  }
  // 可在此处添加滚榜页面的加载逻辑
})

// --- 生命周期 ---
onMounted(() => {
  if (!hasPermission.value) {
    message.error('您没有权限访问此页面')
    router.push('/')
    return
  }
  fetchContestDetail() // 初始加载竞赛详情和题目列表
})

// 字母序号
const getLetterIndex = (index) => String.fromCharCode(65 + index)

</script>

<template>
  <div class="contest-manage-detail-container">
    <Spin :spinning="loading">
      <div v-if="contestDetail">
        <div class="page-header">
          <h1>管理: {{ contestDetail.name }}</h1>
           <router-link to="/contest-manage">
             <Button>返回列表</Button>
           </router-link>
        </div>

        <a-tabs v-model:activeKey="activeTab" type="card" class="custom-tabs">
          <!-- 题目管理 -->
          <a-tab-pane key="problems" tab="竞赛题目">
            <Card class="tab-content problems-manage">
              <template #title>
                <h2 class="content-title">题目列表管理</h2>
              </template>
              <div class="add-problem-section">
                <div class="problem-search-container">
                  <Input
                    v-model:value="addProblemId"
                    placeholder="输入题目ID或关键词"
                    class="problem-search-input"
                    :disabled="addingProblem || updatingProblemSet"
                    @change="e => handleInputChange(e.target.value)"
                  />
                  <div v-if="searchResults.length > 0" class="search-results-dropdown">
                    <Spin :spinning="searchLoading">
                      <div 
                        v-for="problem in searchResults" 
                        :key="problem.ID || problem.id"
                        class="search-result-item"
                        @click="handleProblemSelect(problem)"
                      >
                        <b>{{ problem.ID || problem.id }}</b> - {{ problem.name }}
                      </div>
                    </Spin>
                  </div>
                </div>
                <Button 
                  type="primary" 
                  @click="handleAddProblem" 
                  :loading="addingProblem"
                  :disabled="updatingProblemSet"
                  class="add-btn"
                >
                  添加题目
                </Button>
                <Spin :spinning="updatingProblemSet" size="small" style="margin-left: 10px;" />
              </div>

              <div v-if="selectedProblem" class="selected-problem">
                <b>已选择题目:</b> #{{ selectedProblem.ID || selectedProblem.id }} - {{ selectedProblem.name }}
              </div>

              <a-table 
                :dataSource="problemList" 
                :columns="problemTableColumns" 
                rowKey="id"
                :pagination="false"
                size="middle"
                bordered
                class="problem-table"
              >
                 <template #emptyText>
                   <Empty description="暂未添加任何题目" />
                 </template>
              </a-table>
            </Card>
          </a-tab-pane>

          <!-- 排行榜 -->
          <a-tab-pane key="ranking" tab="排行榜">
            <Card class="tab-content ranking-view">
              <template #title>
                <div class="rank-header">
                  <h2 class="content-title">实时排行榜</h2>
                  <Button type="primary" @click="fetchRankList" :loading="rankLoading">刷新排名</Button>
                </div>
              </template>
              <Spin :spinning="rankLoading">
                 <a-table
                    :dataSource="rankList"
                    :columns="rankColumns"
                    rowKey="user_id" 
                    :pagination="false"
                    size="middle"
                    bordered
                    :scroll="{ x: 1300 }" 
                    class="rank-table"
                 >
                    <template #emptyText>
                       <Empty description="暂无排名数据" />
                    </template>
                 </a-table>
              </Spin>
            </Card>
          </a-tab-pane>

          <!-- 滚榜 -->
          <a-tab-pane key="replay" tab="滚榜">
            <Card class="tab-content replay-view">
              <template #title>
                <h2 class="content-title">滚榜回放</h2>
              </template>
              <div class="coming-soon">
                <div class="coming-soon-icon">
                  <Spin size="large" />
                </div>
                <p>此功能正在开发中，敬请期待...</p>
              </div>
            </Card>
          </a-tab-pane>
        </a-tabs>
      </div>
      <div v-else class="loading-placeholder">
        <Spin size="large" />
        <p>加载竞赛信息中...</p>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
.contest-manage-detail-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
  background-color: #f9fafc;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.page-header h1 {
  font-size: 24px;
  color: #333;
  margin: 0;
  background: linear-gradient(to right, #1890ff, #52c41a);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: bold;
}

.content-title {
  font-size: 18px;
  margin: 0;
  color: #333;
  position: relative;
  padding-left: 12px;
}

.content-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 16px;
  background-color: #1890ff;
  border-radius: 2px;
}

.custom-tabs {
  margin-bottom: 20px;
}

.tab-content {
  margin-top: 12px;
}

.add-problem-section {
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
}

.problem-search-container {
  position: relative;
  width: 300px;
  margin-right: 12px;
}

.problem-search-input {
  width: 100%;
}

.search-results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
}

.search-result-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-result-item:hover {
  background-color: #f5f5f5;
}

.selected-problem {
  margin-bottom: 12px;
  padding: 8px 12px;
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
}

.add-btn {
  background: linear-gradient(to right, #1890ff, #52c41a);
  border: none;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.loading-placeholder {
  text-align: center;
  padding: 60px;
  color: #999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.rank-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.problem-table, .rank-table {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
}

.coming-soon {
  text-align: center;
  padding: 40px;
  color: #666;
}

.coming-soon-icon {
  margin-bottom: 20px;
  font-size: 48px;
  color: #1890ff;
}

.coming-soon p {
  font-size: 16px;
}

/* 排行榜单元格样式 */
:deep(.rank-cell) {
  font-weight: bold;
  font-size: 13px;
  text-align: center;
  padding: 4px !important; /* 减小内边距 */
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

:deep(.rank-cell .time) {
  display: block;
}

:deep(.rank-cell .attempts) {
  font-size: 11px;
  color: #888;
  display: block; 
  margin-top: 2px;
}

:deep(.rank-cell.accepted) {
  background-color: rgba(82, 196, 26, 0.15);
  color: #389e0d;
}
:deep(.rank-cell.accepted .attempts) {
  color: #52c41a;
}

:deep(.rank-cell.failed) {
  background-color: rgba(245, 34, 45, 0.1);
  color: #cf1322;
}
:deep(.rank-cell.failed .attempts) {
  color: #f5222d;
}
</style> 