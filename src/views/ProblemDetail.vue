<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getProblemDetail } from '../api/problem'

const route = useRoute()
const problem = ref(null)
const loading = ref(false)

// 获取题目详情
const fetchProblemDetail = async () => {
  loading.value = true
  try {
    const res = await getProblemDetail(route.params.id)
    if (res.code === 200) {
      problem.value = res.data
      // 确保样例存在，适配新API格式
      if (problem.value.example && !problem.value.samples) {
        problem.value.samples = problem.value.example.map(item => ({
          input: item.stdin,
          output: item.expected_output
        }))
      }
    }
  } catch (error) {
    console.error('获取题目详情失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProblemDetail()
})
</script>

<template>
  <div class="problem-detail-container">
    <div v-if="loading" class="loading">
      加载中...
    </div>
    <div v-else-if="!problem" class="empty">
      题目不存在
    </div>
    <div v-else class="problem-detail">
      <div class="problem-header">
        <h1>{{ problem.name }}</h1>
        <div class="problem-meta">
          <span :class="['level-tag', problem.level]">
            {{ problem.level === 'easy' ? '简单' : problem.level === 'mid' ? '中等' : '困难' }}
          </span>
          <span class="create-time" v-if="problem.CreatedAt">
            创建时间：{{ new Date(problem.CreatedAt).toLocaleDateString() }}
          </span>
        </div>
      </div>

      <div class="problem-content">
        <div class="section">
          <h2>题目描述</h2>
          <div class="description">
            {{ problem.description }}
          </div>
        </div>

        <div class="section">
          <h2>输入格式</h2>
          <div class="input-format">
            {{ problem.input_description || problem.input_format }}
          </div>
        </div>

        <div class="section">
          <h2>输出格式</h2>
          <div class="output-format">
            {{ problem.output_description || problem.output_format }}
          </div>
        </div>

        <div class="section" v-if="problem.remark">
          <h2>备注</h2>
          <div class="remark">
            {{ problem.remark }}
          </div>
        </div>

        <div class="section">
          <h2>样例</h2>
          <div class="samples">
            <div v-for="(sample, index) in problem.samples" :key="index" class="sample">
              <div class="sample-title">样例 {{ index + 1 }}</div>
              <div class="sample-content">
                <div class="sample-input">
                  <div class="label">输入：</div>
                  <pre>{{ sample.input }}</pre>
                </div>
                <div class="sample-output">
                  <div class="label">输出：</div>
                  <pre>{{ sample.output }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="problem-footer">
        <button class="submit-btn">提交代码</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.problem-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.loading,
.empty {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
}

.problem-detail {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.problem-header {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.problem-header h1 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 24px;
}

.problem-meta {
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-tag {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.level-tag.easy {
  background: #e8f5e9;
  color: #4caf50;
}

.level-tag.mid {
  background: #fff3e0;
  color: #ff9800;
}

.level-tag.hard {
  background: #ffebee;
  color: #f44336;
}

.create-time {
  color: #666;
  font-size: 14px;
}

.section {
  margin-bottom: 30px;
}

.section h2 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.description,
.input-format,
.output-format {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.samples {
  display: grid;
  gap: 20px;
}

.sample {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 16px;
}

.sample-title {
  margin-bottom: 12px;
  color: #333;
  font-weight: 500;
}

.sample-content {
  display: grid;
  gap: 12px;
}

.sample-input,
.sample-output {
  display: flex;
  gap: 8px;
}

.label {
  color: #666;
  font-size: 14px;
  min-width: 60px;
}

pre {
  flex: 1;
  margin: 0;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.problem-footer {
  margin-top: 40px;
  text-align: center;
}

.submit-btn {
  padding: 12px 32px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.submit-btn:hover {
  background: #45a049;
}

@media (max-width: 768px) {
  .problem-detail-container {
    padding: 15px;
  }
  
  .problem-detail {
    padding: 20px;
  }
  
  .problem-header h1 {
    font-size: 20px;
  }
  
  .problem-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .sample-content {
    flex-direction: column;
  }
  
  .sample-input,
  .sample-output {
    flex-direction: column;
  }
  
  .label {
    margin-bottom: 4px;
  }
}

.remark {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
  background-color: #fff8e1;
  padding: 12px;
  border-radius: 4px;
  border-left: 4px solid #ffc107;
}
</style> 