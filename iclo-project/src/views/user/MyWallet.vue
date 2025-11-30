<template>
  <div class="page-wrap">
    <!-- 收支流水 -->
    <div v-if="activeFilter !== 'coupon'" class="wallet-grid">
      <el-card class="balance-card" shadow="hover">
        <div class="balance-title">可用余额（元）</div>
        <div class="balance-amount">¥ {{ balance.toFixed(2) }}</div>
        <div class="balance-ops">
          <el-button type="primary" @click="recharge">充值</el-button>
          <el-button plain @click="withdraw">提现</el-button>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat">
          <div class="name">累计收益</div>
          <div class="value">¥ {{ totalIncome.toFixed(2) }}</div>
        </div>
        <div class="stat">
          <div class="name">本月收益</div>
          <div class="value">¥ {{ monthIncome.toFixed(2) }}</div>
        </div>
        <div class="stat">
          <div class="name">待结算</div>
          <div class="value warn">¥ {{ pendingSettle.toFixed(2) }}</div>
        </div>
      </el-card>
    </div>

    <el-card v-if="activeFilter !== 'coupon'" class="flow-card" shadow="never">
      <div class="flow-header">收支流水</div>
      <el-table :data="filteredFlows" size="small">
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="typeText" label="类型" width="100" />
        <el-table-column prop="desc" label="描述" />
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :class="row.amount > 0 ? 'in' : 'out'">
              {{ row.amount > 0 ? '+' : '' }}¥ {{ Math.abs(row.amount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }">
            ¥ {{ row.balance.toFixed(2) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 优惠券 -->
    <el-card v-if="activeFilter === 'coupon' || activeFilter === 'all'" class="coupon-card" shadow="never" :style="{ marginTop: activeFilter === 'coupon' ? '16px' : '16px' }">
      <div class="coupon-header">
        <span>我的优惠券</span>
        <el-button text type="primary" size="small">查看全部</el-button>
      </div>
      <div class="coupon-list">
        <div v-for="coupon in coupons" :key="coupon.id" class="coupon-item" :class="{ 'used': coupon.used, 'expired': coupon.expired }">
          <div class="coupon-left">
            <div class="coupon-amount">¥{{ coupon.amount }}</div>
            <div class="coupon-desc">{{ coupon.desc }}</div>
          </div>
          <div class="coupon-right">
            <div class="coupon-status">
              <el-tag v-if="coupon.used" type="info" size="small">已使用</el-tag>
              <el-tag v-else-if="coupon.expired" type="danger" size="small">已过期</el-tag>
              <el-tag v-else type="success" size="small">可使用</el-tag>
            </div>
            <div class="coupon-time">有效期至 {{ coupon.expireTime }}</div>
          </div>
        </div>
        <el-empty v-if="coupons.length === 0" description="暂无优惠券" :image-size="80" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeFilter = ref('all')

// 从 URL 查询参数中读取状态
const updateFilterFromRoute = () => {
  const type = route.query.type
  if (type && ['all', 'income', 'expense', 'coupon'].includes(type)) {
    activeFilter.value = type
  } else {
    activeFilter.value = 'all'
  }
}

onMounted(() => {
  updateFilterFromRoute()
})

// 监听路由变化
watch(() => route.query.type, () => {
  updateFilterFromRoute()
})

// 收支流水数据（按时间倒序）
const flows = ref([
  { id: 1, time: '2025-11-10 12:36', type: 'income', typeText: '收入', desc: '作品销量分成', amount: 128.0 },
  { id: 2, time: '2025-11-09 18:21', type: 'expense', typeText: '支出', desc: '下单-简约羊毛呢大衣', amount: -699.0 },
  { id: 3, time: '2025-11-08 09:05', type: 'income', typeText: '收入', desc: '推文推广奖励', amount: 30.0 },
  { id: 4, time: '2025-11-07 15:30', type: 'income', typeText: '收入', desc: '订单返现', amount: 50.0 },
  { id: 5, time: '2025-11-06 10:15', type: 'expense', typeText: '支出', desc: '购买商品', amount: -299.0 },
  { id: 6, time: '2025-11-05 14:20', type: 'income', typeText: '收入', desc: '活动奖励', amount: 98.0 },
])

// 初始余额
const initialBalance = 1000.0

// 计算余额：从初始余额开始，按时间顺序累加
const flowsWithBalance = computed(() => {
  let currentBalance = initialBalance
  // 按时间正序排列，计算每笔交易后的余额
  const sortedFlows = [...flows.value].sort((a, b) => new Date(a.time) - new Date(b.time))
  return sortedFlows.map(flow => {
    currentBalance += flow.amount
    return { ...flow, balance: currentBalance }
  }).reverse() // 反转回倒序显示
})

// 当前余额 = 初始余额 + 所有收入 - 所有支出
const balance = computed(() => {
  const total = flows.value.reduce((sum, flow) => sum + flow.amount, initialBalance)
  return Math.max(0, total) // 确保余额不为负数
})

// 累计收益 = 所有收入
const totalIncome = computed(() => {
  return flows.value
    .filter(flow => flow.type === 'income')
    .reduce((sum, flow) => sum + flow.amount, 0)
})

// 本月收益 = 本月收入
const monthIncome = computed(() => {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  return flows.value
    .filter(flow => {
      const flowDate = new Date(flow.time)
      return flow.type === 'income' && 
             flowDate.getMonth() === currentMonth && 
             flowDate.getFullYear() === currentYear
    })
    .reduce((sum, flow) => sum + flow.amount, 0)
})

const pendingSettle = ref(120.0)

// 过滤后的流水
const filteredFlows = computed(() => {
  if (activeFilter.value === 'all' || activeFilter.value === 'coupon') {
    return flowsWithBalance.value
  }
  return flowsWithBalance.value.filter(flow => flow.type === activeFilter.value)
})

// 优惠券数据
const coupons = ref([
  {
    id: 1,
    amount: 50,
    desc: '满299减50',
    expireTime: '2025-12-31',
    used: false,
    expired: false
  },
  {
    id: 2,
    amount: 100,
    desc: '满599减100',
    expireTime: '2025-11-30',
    used: false,
    expired: false
  },
  {
    id: 3,
    amount: 30,
    desc: '满199减30',
    expireTime: '2025-10-31',
    used: true,
    expired: false
  },
  {
    id: 4,
    amount: 20,
    desc: '满99减20',
    expireTime: '2025-09-30',
    used: false,
    expired: true
  }
])

const recharge = () => {
  ElMessage.info('充值通道暂未开通（示例）')
}
const withdraw = () => {
  ElMessage.info('提现功能暂未开通（示例）')
}
</script>

<style scoped>
.page-wrap {
  padding: 0;
}
.wallet-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 16px;
  margin-top: 16px;
}
.balance-card .balance-title {
  color: #666;
  font-size: 13px;
}
.balance-card .balance-amount {
  margin-top: 6px;
  font-size: 28px;
  font-weight: 700;
}
.balance-ops {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}
.stat-card {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 12px;
  align-items: center;
}
.stat .name {
  color: #666;
  font-size: 13px;
}
.stat .value {
  margin-top: 6px;
  font-weight: 700;
}
.stat .value.warn {
  color: #e6a23c;
}
.flow-card {
  margin-top: 16px;
}
.flow-header {
  font-weight: 600;
  margin-bottom: 12px;
}
.in {
  color: #67c23a;
  font-weight: 600;
}
.out {
  color: #f56c6c;
  font-weight: 600;
}
.coupon-card {
  margin-top: 16px;
}
.coupon-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  margin-bottom: 16px;
}
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.coupon-item {
  display: flex;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: linear-gradient(to right, #fff 0%, #fff 70%, #f5f5f5 70%);
}
.coupon-item.used,
.coupon-item.expired {
  opacity: 0.6;
  background: linear-gradient(to right, #f5f5f5 0%, #f5f5f5 70%, #e0e0e0 70%);
}
.coupon-left {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}
.coupon-amount {
  font-size: 24px;
  font-weight: 700;
  color: #ff4d4f;
}
.coupon-desc {
  font-size: 13px;
  color: #666;
}
.coupon-right {
  width: 30%;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-end;
  gap: 8px;
  background: #f5f5f5;
}
.coupon-status {
  margin-bottom: 4px;
}
.coupon-time {
  font-size: 12px;
  color: #999;
}
@media (max-width: 840px) {
  .wallet-grid {
    grid-template-columns: 1fr;
  }
  .stat-card {
    grid-template-columns: 1fr;
  }
  .coupon-item {
    flex-direction: column;
  }
  .coupon-right {
    width: 100%;
    align-items: flex-start;
  }
}
</style>


