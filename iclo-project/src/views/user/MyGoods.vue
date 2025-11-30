<template>
  <div class="page-wrap">
    <el-card v-for="order in filteredOrders" :key="order.id" class="order-card" shadow="hover">
      <div class="order-header">
        <div class="order-no">订单号：{{ order.orderNo }}</div>
        <div class="status-wrap">
          <el-tag :type="getStatusTagType(order.status)" effect="light">{{ order.statusText }}</el-tag>
          <el-tag
            v-if="order.status === 'refund'"
            class="ml8"
            :type="getRefundTagType(order.refundResult)"
            effect="light"
          >
            {{ getRefundText(order.refundResult) }}
          </el-tag>
        </div>
      </div>
      <div class="order-body">
        <el-image
          class="goods-cover"
          :src="order.cover"
          :preview-src-list="[order.cover]"
          fit="cover"
          :lazy="true"
          loading="lazy"
          @error="handleImageError"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
              <span>加载失败</span>
            </div>
          </template>
        </el-image>
        <div class="goods-info">
          <div class="goods-title">{{ order.title }}</div>
          <div class="goods-attrs">
            <el-tag size="small" effect="plain">{{ order.spec.color }}</el-tag>
            <el-tag size="small" effect="plain">{{ order.spec.size }}</el-tag>
          </div>
          <div class="goods-meta">
            <span class="price">¥ {{ order.price.toFixed(2) }}</span>
            <span class="qty">x{{ order.quantity }}</span>
          </div>
        </div>
        <div class="order-actions">
          <el-button plain @click="addToFavorites(order)">加入收藏</el-button>
          <el-button type="primary" plain @click="buyAgain(order)">再买一单</el-button>
          <el-button
            v-if="order.status === 'pending'"
            type="success"
            @click="openPay(order)"
          >
            去支付
          </el-button>
          <el-button v-if="order.status === 'shipping'" type="primary" @click="openLogistics(order)">
            查看物流
          </el-button>
          <el-button
            v-if="order.status === 'shipping'"
            type="success"
            plain
            @click="confirmReceive(order)"
          >
            确认收货
          </el-button>
          <el-button
            v-if="['paid','shipping','completed'].includes(order.status)"
            type="warning"
            plain
            @click="applyAfterSale(order)"
          >
            申请退款/售后
          </el-button>
        </div>
      </div>
      <div class="order-footer">
        <div class="summary">
          共 {{ order.quantity }} 件商品，合计
          <b>¥ {{ (order.price * order.quantity).toFixed(2) }}</b>
        </div>
        <div class="time">下单时间：{{ order.createdAt }}</div>
      </div>
    </el-card>

    <el-empty v-if="filteredOrders.length === 0" description="暂无订单" />

    <el-dialog v-model="logisticsVisible" title="物流进度" width="560px">
      <el-timeline>
        <el-timeline-item
          v-for="(item, idx) in currentOrder?.logistics || []"
          :key="idx"
          :timestamp="item.time"
          :type="idx === 0 ? 'primary' : 'default'"
        >
          {{ item.desc }}
        </el-timeline-item>
      </el-timeline>
      <template #footer>
        <el-button @click="logisticsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="afterSaleVisible" title="申请退款/售后" width="520px">
      <el-form :model="afterSaleForm" label-width="88px">
        <el-form-item label="问题类型">
          <el-select v-model="afterSaleForm.type" placeholder="请选择">
            <el-option label="退货" value="return" />
            <el-option label="换货" value="exchange" />
            <el-option label="仅退款" value="refund" />
          </el-select>
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input
            v-model="afterSaleForm.reason"
            type="textarea"
            :rows="3"
            maxlength="200"
            show-word-limit
            placeholder="请简要描述问题"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="afterSaleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAfterSale">提交申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="payVisible" title="支付订单" width="420px">
      <div v-if="payOrder" class="pay-summary">
        <div>订单号：{{ payOrder.orderNo }}</div>
        <div class="mt8">
          支付金额：
          <b>¥ {{ (payOrder.price * payOrder.quantity).toFixed(2) }}</b>
        </div>
      </div>
      <template #footer>
        <el-button :disabled="payLoading" @click="payVisible = false">取消</el-button>
        <el-button type="primary" :loading="payLoading" @click="confirmPay">确认支付</el-button>
      </template>
    </el-dialog>
  </div>
  </template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Picture } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { getAllOrders } from '../../utils/orderStorage'

const router = useRouter()
const route = useRoute()
const logisticsVisible = ref(false)
const afterSaleVisible = ref(false)
const activeFilter = ref('all')
const currentOrder = ref(null)
const payVisible = ref(false)
const payOrder = ref(null)
const payLoading = ref(false)

// 从 URL 查询参数中读取状态
const updateFilterFromRoute = () => {
  const status = route.query.status
  if (status && ['pending', 'paid', 'shipping', 'completed', 'refund'].includes(status)) {
    activeFilter.value = status
  } else {
    activeFilter.value = 'all'
  }
}

onMounted(() => {
  updateFilterFromRoute()
})

// 监听路由变化
watch(() => route.query.status, () => {
  updateFilterFromRoute()
})

// 从存储中加载订单，合并默认示例订单
const defaultOrders = [
  {
    id: 1,
    orderNo: '202511100001',
    title: '简约羊毛呢大衣',
    price: 699,
    quantity: 1,
    cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=400&h=400&fit=crop&q=80',
    spec: { color: '灰色', size: 'M' },
    createdAt: '2025-11-10 10:20:15',
    status: 'shipping',
    statusText: '运输中',
    logistics: [
      { time: '2025-11-10 12:36', desc: '快件已到达【杭州转运中心】' },
      { time: '2025-11-10 09:20', desc: '快件已发出，正发往【杭州转运中心】' },
      { time: '2025-11-10 07:58', desc: '包裹已打包出库，等待揽收' },
      { time: '2025-11-10 07:10', desc: '商家已发货，等待快递揽收' },
    ],
  },
  {
    id: 2,
    orderNo: '202511090002',
    title: '秋冬针织毛衣',
    price: 299,
    quantity: 2,
    cover: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&h=400&fit=crop&q=80',
    spec: { color: '米色', size: 'L' },
    createdAt: '2025-11-09 14:30:20',
    status: 'pending',
    statusText: '待付款',
    logistics: [],
  },
  {
    id: 3,
    orderNo: '202511080003',
    title: '破洞牛仔裤',
    price: 459,
    quantity: 1,
    cover: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop&q=80&v=3',
    spec: { color: '蓝色', size: 'S' },
    createdAt: '2025-11-08 16:45:10',
    status: 'completed',
    statusText: '待评价',
    logistics: [],
  },
  {
    id: 5,
    orderNo: '202511110005',
    title: '极简通勤外套',
    price: 599,
    quantity: 1,
    cover: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=400&h=400&dpr=1&v=2',
    spec: { color: '黑色', size: 'L' },
    createdAt: '2025-11-11 09:15:30',
    status: 'paid',
    statusText: '待发货',
    logistics: [],
  },
  {
    id: 4,
    orderNo: '202511070004',
    title: '街头宽松T恤',
    price: 199,
    quantity: 1,
    cover: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=400&h=400&fit=crop&q=80',
    spec: { color: '黑色', size: 'M' },
    createdAt: '2025-11-07 11:20:05',
    status: 'refund',
    statusText: '退款/售后',
    refundResult: 'success',
    logistics: [],
  },
]

const storedOrders = getAllOrders()
const orders = reactive([...storedOrders, ...defaultOrders])

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') {
    return orders
  }
  return orders.filter(order => order.status === activeFilter.value)
})


const getStatusTagType = (status) => {
  switch (status) {
    case 'pending':
      return 'info'
    case 'paid':
      return 'warning'
    case 'shipping':
      return 'primary'
    case 'completed':
      return 'success'
    case 'refund':
      return 'danger'
    default:
      return 'info'
  }
}

const getRefundText = (result) => {
  switch (result) {
    case 'success':
      return '退款成功'
    case 'failed':
      return '退款失败'
    case 'processing':
      return '退款处理中'
    default:
      return '退款处理中'
  }
}
const getRefundTagType = (result) => {
  switch (result) {
    case 'success':
      return 'success'
    case 'failed':
      return 'danger'
    case 'processing':
      return 'warning'
    default:
      return 'info'
  }
}

const openLogistics = (order) => {
  currentOrder.value = order
  logisticsVisible.value = true
}

const confirmReceive = (order) => {
  order.status = 'completed'
  order.statusText = '待评价'
  ElMessage.success('已确认收货，感谢您的购买！')
}

const afterSaleForm = reactive({
  type: '',
  reason: '',
})

const applyAfterSale = (order) => {
  currentOrder.value = order
  afterSaleVisible.value = true
}

const submitAfterSale = () => {
  if (!afterSaleForm.type || !afterSaleForm.reason.trim()) {
    ElMessage.warning('请完善退款/售后信息')
    return
  }
  if (currentOrder.value) {
    currentOrder.value.status = 'refund'
    currentOrder.value.statusText = '退款/售后'
    currentOrder.value.refundResult = 'processing'
  }
  afterSaleVisible.value = false
  ElMessage.success('退款/售后申请已提交，我们会尽快处理')
  afterSaleForm.type = ''
  afterSaleForm.reason = ''
}

const openPay = (order) => {
  payOrder.value = order
  payVisible.value = true
}

const confirmPay = async () => {
  if (!payOrder.value) return
  try {
    payLoading.value = true
    // 模拟支付耗时
    await new Promise((resolve) => setTimeout(resolve, 800))
    payOrder.value.status = 'paid'
    payOrder.value.statusText = '待发货'
    ElMessage.success('支付成功，订单已进入待发货状态')
    payVisible.value = false
  } finally {
    payLoading.value = false
  }
}

const addToFavorites = (order) => {
  try {
    const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
    const favorites = Array.isArray(stored) ? stored : []
    const exists = favorites.some((f) => f.title === order.title && f.typeKey === 'clothing')
    if (exists) {
      ElMessage.info('已在收藏夹中')
      return
    }
    const favItem = {
      id: Date.now(),
      title: order.title,
      type: '成衣',
      typeKey: 'clothing',
      desc: `${order.spec?.color || ''} / ${order.spec?.size || ''}`.trim().replace(/^ \/ | \/ $/g, ''),
      cover: order.cover,
    }
    favorites.unshift(favItem)
    localStorage.setItem('favorites', JSON.stringify(favorites))
    ElMessage.success('已加入收藏')
  } catch (e) {
    ElMessage.error('收藏失败，请稍后重试')
  }
}

const buyAgain = (order) => {
  const now = new Date()
  const newOrder = {
    ...order,
    id: Math.max(...orders.map(o => o.id)) + 1,
    orderNo:
      String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(now.getMilliseconds()).padStart(3, '0'),
    status: 'pending',
    statusText: '待付款',
    createdAt: now.toISOString().slice(0, 19).replace('T', ' ')
  }
  orders.unshift(newOrder)
  ElMessage.success('已为您创建一笔新的待付款订单')
  // 跳转到“待付款”筛选视图，便于用户继续支付
  router.push({ path: '/user-center/goods', query: { status: 'pending' } })
}

const handleImageError = (e) => {
  // 如果图片加载失败，尝试使用备用图片
  const img = e.target
  if (img && !img.dataset.fallbackUsed) {
    img.dataset.fallbackUsed = 'true'
    img.src = 'https://via.placeholder.com/400x400?text=商品图片'
  }
}
</script>

<style scoped>
.page-wrap {
  padding: 0;
}
.order-card {
  margin-top: 16px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}
.order-body {
  display: grid;
  grid-template-columns: 120px 1fr auto;
  grid-gap: 16px;
  align-items: center;
}
.goods-cover {
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
}
.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}
.goods-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.goods-title {
  font-size: 16px;
  font-weight: 600;
}
.goods-attrs {
  display: flex;
  gap: 8px;
}
.goods-meta {
  display: flex;
  gap: 12px;
  align-items: baseline;
  color: #666;
}
.price {
  color: #ff4d4f;
  font-size: 18px;
  font-weight: 600;
}
.order-actions {
  display: flex;
  gap: 8px;
}
.order-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  font-size: 13px;
  color: #666;
}
@media (max-width: 640px) {
  .order-body {
    grid-template-columns: 96px 1fr;
  }
  .order-actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}
</style>


