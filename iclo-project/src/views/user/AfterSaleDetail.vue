<template>
  <div class="page-wrap">
    <el-page-header :content="`售后申请 ${afterSaleId}`" @back="$router.push('/user-center')" />

    <el-card class="mt16" shadow="hover">
      <div class="row between">
        <div class="col">
          <div class="muted">申请单号</div>
          <div class="strong">{{ afterSaleId }}</div>
        </div>
        <div class="col">
          <div class="muted">关联订单</div>
          <div class="strong">{{ orderNo }}</div>
        </div>
        <div class="col">
          <div class="muted">当前状态</div>
          <el-tag :type="statusTag" effect="light">{{ statusText }}</el-tag>
        </div>
      </div>
    </el-card>

    <el-card class="mt16" shadow="never">
      <div class="sec-title">进度</div>
      <el-timeline>
        <el-timeline-item v-for="(item, idx) in timeline" :key="idx" :timestamp="item.time" :type="item.type">
          {{ item.text }}
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
  </template>

<script setup>
import { computed, reactive } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const afterSaleId = route.params.id
const orderNo = route.query.orderNo || afterSaleId

const detail = reactive({
  status: 'processing', // submitted | processing | completed | rejected
})

const timeline = reactive([
  { time: '2025-11-10 12:45', text: '申请已提交，等待客服审核', type: 'primary' },
  { time: '2025-11-10 13:10', text: '客服已受理，将在 24 小时内处理', type: 'default' },
])

const statusText = computed(() => {
  switch (detail.status) {
    case 'submitted':
      return '已提交'
    case 'processing':
      return '处理中'
    case 'completed':
      return '已完成'
    case 'rejected':
      return '已驳回'
    default:
      return '未知'
  }
})
const statusTag = computed(() => {
  switch (detail.status) {
    case 'submitted':
      return 'info'
    case 'processing':
      return 'warning'
    case 'completed':
      return 'success'
    case 'rejected':
      return 'danger'
    default:
      return 'info'
  }
})
</script>

<style scoped>
.page-wrap {
  padding: 100px 24px 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.mt16 {
  margin-top: 16px;
}
.row {
  display: flex;
  gap: 16px;
}
.between {
  justify-content: space-between;
}
.col .muted {
  color: #666;
  font-size: 12px;
}
.col .strong {
  margin-top: 6px;
  font-weight: 600;
}
.sec-title {
  font-weight: 600;
  margin-bottom: 8px;
}
</style>


