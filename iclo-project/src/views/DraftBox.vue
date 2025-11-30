<!-- src/views/DraftBox.vue -->
<template>
    <div class="draft-page">
      <!-- 页面标题区 -->
      <div class="page-header">
        <h1>我的草稿箱</h1>
        <p>保存您未完成的搭配方案和收藏内容</p>
      </div>
  
      <!-- 草稿操作工具栏 -->
      <div class="draft-toolbar">
        <el-button 
          type="primary" 
          @click="openCreateDraft" 
        >
          <el-icon><Plus /></el-icon>
          新建草稿
        </el-button>
        <el-select 
          v-model="filterType" 
          placeholder="筛选草稿" 
          class="filter-select"
        >
          <el-option label="全部草稿" value="all"></el-option>
          <el-option label="搭配方案" value="match"></el-option>
          <el-option label="收藏商品" value="collect"></el-option>
          <el-option label="定制草稿" value="custom"></el-option>
        </el-select>
      </div>
  
      <!-- 草稿列表 -->
      <div class="draft-list">
        <!-- 草稿项（循环渲染） -->
        <div class="draft-card" v-for="draft in filteredDrafts" :key="draft.id">
          <!-- 草稿缩略图 -->
          <div class="draft-img">
            <img :src="draft.cover" alt="草稿预览">
            <span class="draft-tag">
              {{ draft.type === 'match' ? '搭配方案' : draft.type === 'custom' ? '定制草稿' : '收藏商品' }}
            </span>
          </div>
          
          <!-- 草稿信息 -->
          <div class="draft-info">
            <h3 class="draft-title">{{ draft.title }}</h3>
            <p class="draft-desc">{{ draft.desc }}</p>
            <div class="draft-meta">
              <span>更新于 {{ draft.updateTime }}</span>
              <span v-if="draft.type === 'custom'">纹饰 {{ draft.design?.patterns?.length || 0 }} 个</span>
              <span v-else>包含 {{ draft.itemCount }} 件商品</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="draft-actions">
            <el-button 
              type="text" 
              @click="editDraft(draft.id)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              v-if="draft.type === 'custom' && draft.design"
              type="text" 
              class="order-btn"
              @click="openOrderFromDraft(draft)"
            >
              下单
            </el-button>
            <el-button 
              type="text" 
              class="delete-btn"
              @click="deleteDraft(draft.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
  
        <!-- 空状态（无草稿时显示） -->
        <div class="empty-draft" v-if="filteredDrafts.length === 0">
          <el-empty 
            description="暂无保存的草稿"
            image-size="120"
          >
            <el-button 
              type="primary" 
              @click="$router.push('/')"
            >
              去浏览商品
            </el-button>
          </el-empty>
        </div>
      </div>

      <!-- 订单弹窗 -->
      <el-dialog
        v-model="orderDialogVisible"
        title="提交订单"
        width="520px"
        align-center
      >
        <el-form :model="orderForm" label-width="90px">
          <el-form-item label="商品信息">
            <div class="order-item-preview">
              <img :src="currentDraft?.cover" alt="商品预览" class="preview-img">
              <div class="preview-info">
                <div class="preview-title">{{ currentDraft?.title }}</div>
                <div class="preview-desc" v-if="currentDraft?.design">
                  定制颜色：{{ currentDraft.design.color }}
                </div>
                <div class="preview-desc" v-if="currentDraft?.design?.patterns?.length > 0">
                  纹饰数量：{{ currentDraft.design.patterns.length }} 个
                </div>
              </div>
            </div>
          </el-form-item>
          <el-form-item label="尺码" required>
            <el-select v-model="orderForm.size" placeholder="请选择尺码" style="width: 100%">
              <el-option label="S" value="S"></el-option>
              <el-option label="M" value="M"></el-option>
              <el-option label="L" value="L"></el-option>
              <el-option label="XL" value="XL"></el-option>
              <el-option label="XXL" value="XXL"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="数量" required>
            <el-input-number v-model="orderForm.quantity" :min="1" :max="10" style="width: 100%"></el-input-number>
          </el-form-item>
          <el-form-item label="收货地址" required>
            <el-input v-model="orderForm.address" placeholder="请输入详细收货地址"></el-input>
          </el-form-item>
          <el-form-item label="联系电话" required>
            <el-input v-model="orderForm.phone" placeholder="请输入联系电话"></el-input>
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="orderForm.remark"
              type="textarea"
              rows="2"
              placeholder="可填写特殊要求或备注信息"
            ></el-input>
          </el-form-item>
          <el-form-item label="订单金额">
            <div class="order-total">
              <span class="total-label">合计：</span>
              <span class="total-price">¥ {{ (orderForm.price * orderForm.quantity).toFixed(2) }}</span>
            </div>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="orderDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submittingOrder" @click="handleOrderSubmit">
            提交订单
          </el-button>
        </template>
      </el-dialog>
  
    </div>
  </template>
  
  <script setup>
import { ref, computed, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { loadDrafts, saveDrafts, deleteDraft as removeDraft } from '../utils/draftStorage'
import { addOrder } from '../utils/orderStorage'

const router = useRouter()

const drafts = ref(loadDrafts())
const filterType = ref('all')

const filteredDrafts = computed(() => {
  if (filterType.value === 'all') return drafts.value
  return drafts.value.filter(draft => draft.type === filterType.value)
})

watch(drafts, value => {
  saveDrafts(value)
}, { deep: true })

const openCreateDraft = () => {
  router.push({ path: '/custom-platform', query: { from: 'draft-box' } })
}

const editDraft = (id) => {
  router.push({ path: '/custom-platform', query: { draftId: id } })
}

const deleteDraft = (id) => {
  drafts.value = drafts.value.filter(draft => draft.id !== id)
  removeDraft(id)
}

const orderDialogVisible = ref(false)
const currentDraft = ref(null)
const orderForm = reactive({
  size: 'M',
  quantity: 1,
  address: '',
  phone: '',
  remark: '',
  price: 399
})
const submittingOrder = ref(false)

const openOrderFromDraft = (draft) => {
  if (!draft.design) {
    ElMessage.warning('该草稿缺少设计信息，无法下单')
    return
  }
  currentDraft.value = draft
  orderForm.size = 'M'
  orderForm.quantity = 1
  orderForm.address = ''
  orderForm.phone = ''
  orderForm.remark = ''
  orderForm.price = 399
  orderDialogVisible.value = true
}

const handleOrderSubmit = async () => {
  if (!currentDraft.value || !currentDraft.value.design) {
    ElMessage.warning('草稿信息不完整')
    return
  }
  if (!orderForm.size) {
    ElMessage.warning('请选择尺码')
    return
  }
  if (!orderForm.address.trim()) {
    ElMessage.warning('请输入收货地址')
    return
  }
  if (!orderForm.phone.trim()) {
    ElMessage.warning('请输入联系电话')
    return
  }
  submittingOrder.value = true
  try {
    const now = new Date()
    const orderNo = String(now.getFullYear()) +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0') +
      String(Math.floor(Math.random() * 1000)).padStart(3, '0')
    
    const order = {
      id: Date.now(),
      orderNo,
      title: `${currentDraft.value.title}（定制）`,
      price: orderForm.price,
      quantity: orderForm.quantity,
      cover: currentDraft.value.cover,
      spec: {
        color: currentDraft.value.design.color || '#ffffff',
        size: orderForm.size
      },
      createdAt: now.toISOString().slice(0, 19).replace('T', ' '),
      status: 'pending',
      statusText: '待付款',
      logistics: [],
      design: currentDraft.value.design,
      address: orderForm.address,
      phone: orderForm.phone,
      remark: orderForm.remark
    }
    
    addOrder(order)
    ElMessage.success('订单已提交，请前往个人中心查看')
    orderDialogVisible.value = false
    router.push('/user-center/goods?status=pending')
  } catch (error) {
    ElMessage.error('提交订单失败，请稍后重试')
  } finally {
    submittingOrder.value = false
  }
}
  </script>
  
  <style scoped>
  .draft-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 100px 20px 60px; /* 顶部留空间给固定导航 */
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .page-header h1 {
    font-size: 32px;
    color: #333;
    margin-bottom: 10px;
  }
  
  .page-header p {
    color: #666;
    font-size: 16px;
  }
  
  .draft-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }
  
  .filter-select {
    width: 200px;
  }
  
  .draft-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;
  }
  
  .draft-card {
    display: flex;
    background: #fff;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    transition: transform 0.2s;
  }
  
  .draft-card:hover {
    transform: translateY(-3px);
  }
  
  .draft-img {
    width: 100px;
    height: 100px;
    border-radius: 4px;
    overflow: hidden;
    position: relative;
    flex-shrink: 0;
  }
  
  .draft-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .draft-tag {
    position: absolute;
    top: 5px;
    left: 5px;
    background: rgba(0,0,0,0.6);
    color: white;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 2px;
  }
  
  .draft-info {
    flex-grow: 1;
    margin: 0 15px;
    overflow: hidden;
  }
  
  .draft-title {
    font-size: 16px;
    margin-bottom: 8px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .draft-desc {
    font-size: 13px;
    color: #666;
    margin-bottom: 10px;
    display: -webkit-box;
  line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .draft-meta {
    display: flex;
    font-size: 12px;
    color: #999;
    gap: 15px;
  }
  
  .draft-actions {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 10px;
  }
  
  .delete-btn {
    color: #ff4d4f;
  }
  
  .empty-draft {
    grid-column: 1 / -1;
    padding: 60px 0;
  }

  .order-btn {
    color: #ff9800;
  }

  .order-item-preview {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: #f5f7fb;
    border-radius: 8px;
  }

  .preview-img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 6px;
  }

  .preview-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .preview-title {
    font-size: 14px;
    font-weight: 600;
    color: #1f2329;
  }

  .preview-desc {
    font-size: 12px;
    color: #666;
  }

  .order-total {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
  }

  .total-label {
    color: #666;
  }

  .total-price {
    color: #ff4d4f;
    font-size: 20px;
    font-weight: 600;
  }
  </style>