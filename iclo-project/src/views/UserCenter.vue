<template>
  <div class="user-center">
    <!-- 顶部：用户信息栏 -->
    <el-card class="user-info-card" shadow="never">
      <div class="user-info">
        <el-avatar :size="64" :src="user.avatar" icon="UserFilled" />
        <div class="meta">
          <div class="nickname">{{ user.nickname }}</div>
          <div class="sub">
            <span>ID：{{ user.id }}</span>
            <span class="dot">·</span>
            <el-tag :type="user.memberLevel === 'VIP' ? 'danger' : user.memberLevel === 'SVIP' ? 'warning' : 'info'" size="small">
              {{ user.memberLevel }}
            </el-tag>
          </div>
        </div>
        <div class="actions">
          <el-button type="primary" @click="onEditProfile">编辑资料</el-button>
          <el-button @click="onViewQRCode">
            <QrCodeIcon :size="16" />
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 侧边栏导航 + 内容区 -->
    <div class="main-layout">
      <!-- 侧边栏导航 -->
      <div class="sidebar">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: activeNav === item.key || (item.children && expandedNav === item.key) }"
        >
          <div class="nav-item-header" @click="handleNavClick(item)">
            <span>{{ item.title }}</span>
            <el-icon v-if="item.children" class="arrow-icon" :class="{ 'rotate': expandedNav === item.key }">
              <ArrowDown />
            </el-icon>
          </div>
          <div v-if="item.children && expandedNav === item.key" class="nav-children">
            <div
              v-for="child in item.children"
              :key="child.key"
              class="nav-child-item"
              :class="{ active: activeNav === child.key }"
              @click="go(child.key)"
            >
              {{ child.title }}
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区 -->
      <div class="content-area">
        <router-view />
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <el-dialog v-model="editVisible" title="编辑资料" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="80" :src="form.avatar || user.avatar" icon="UserFilled" />
            <el-upload
              :action="uploadAction"
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              accept="image/*"
            >
              <el-button size="small" type="primary">上传头像</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" maxlength="20" show-word-limit placeholder="请输入昵称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="onSave">保存</el-button>
      </template>
    </el-dialog>

    <!-- 二维码名片弹窗 -->
    <el-dialog v-model="qrCodeVisible" title="我的二维码名片" width="400px" align-center>
      <div class="qr-code-content">
        <div class="qr-code-card">
          <div class="qr-header">
            <el-avatar :size="60" :src="user.avatar" icon="UserFilled" />
            <div class="qr-user-info">
              <div class="qr-nickname">{{ user.nickname }}</div>
              <div class="qr-id">ID: {{ user.id }}</div>
              <el-tag :type="user.memberLevel === 'VIP' ? 'danger' : user.memberLevel === 'SVIP' ? 'warning' : 'info'" size="small">
                {{ user.memberLevel }}
              </el-tag>
            </div>
          </div>
          <div class="qr-code-box">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
          </div>
        </div>
        <div class="qr-actions">
          <el-button type="primary" @click="saveQRCode">保存</el-button>
          <el-button @click="shareQRCode">分享</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
  </template>

  <script setup>
  import { reactive, ref, computed, provide, onMounted, nextTick, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'
  import QrCodeIcon from '../components/QrCodeIcon.vue'
  
  const user = reactive({
    nickname: '一只小熊',
    id: 'U1024001',
    phone: '138****8888',
    address: '上海市 浦东新区 张江路 123 号',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    memberLevel: 'VIP' // 普通会员 | VIP | SVIP
  })

  // 提供用户信息给子组件
  provide('userInfo', user)
  
  const editVisible = ref(false)
  const qrCodeVisible = ref(false)
  const formRef = ref(null)
  const qrCanvas = ref(null)
  const form = reactive({
    nickname: '',
    avatar: ''
  })
  const rules = {
    nickname: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度 2-20 个字符', trigger: 'blur' }
    ]
  }

  const uploadAction = '#'
  const handleAvatarSuccess = (response, file) => {
    // 这里应该从服务器获取图片URL，暂时使用本地预览
    const reader = new FileReader()
    reader.onload = (e) => {
      form.avatar = e.target.result
      user.avatar = e.target.result
    }
    reader.readAsDataURL(file.raw)
    ElMessage.success('头像上传成功')
  }
  const beforeAvatarUpload = (file) => {
    const isImage = file.type.startsWith('image/')
    const isLt2M = file.size / 1024 / 1024 < 2
    if (!isImage) {
      ElMessage.error('只能上传图片文件!')
      return false
    }
    if (!isLt2M) {
      ElMessage.error('图片大小不能超过 2MB!')
      return false
    }
    return true
  }

  const router = useRouter()
  const route = useRoute()

  const expandedNav = ref('goods') // 默认展开"我的订单"
  
  // 监听路由变化，自动展开对应的菜单
  watch(() => route.path, (newPath) => {
    if (newPath.includes('/goods')) {
      expandedNav.value = 'goods'
    } else if (newPath.includes('/favorites')) {
      expandedNav.value = 'favorites'
    } else if (newPath.includes('/drafts')) {
      expandedNav.value = 'drafts'
    } else if (newPath.includes('/wallet')) {
      expandedNav.value = 'wallet'
    }
  }, { immediate: true })
  
  const navItems = [
    {
      key: 'goods',
      title: '我的订单',
      children: [
        { key: 'goods', title: '全部订单' },
        { key: 'goods-pending', title: '待付款' },
        { key: 'goods-paid', title: '待发货' },
        { key: 'goods-shipping', title: '待收货' },
        { key: 'goods-completed', title: '待评价' },
        { key: 'goods-refund', title: '退款/售后' }
      ]
    },
    {
      key: 'favorites',
      title: '我的收藏',
      children: [
        { key: 'favorites', title: '全部收藏' },
        { key: 'favorites-clothing', title: '成衣' },
        { key: 'favorites-article', title: '文章' }
      ]
    },
    {
      key: 'drafts',
      title: '我的草稿箱',
      children: [
        { key: 'drafts', title: '全部' },
        { key: 'drafts-clothing', title: '成衣' },
        { key: 'drafts-article', title: '文章' }
      ]
    },
    {
      key: 'wallet',
      title: '我的钱包',
      children: [
        { key: 'wallet', title: '全部' },
        { key: 'wallet-income', title: '收入' },
        { key: 'wallet-expense', title: '支出' },
        { key: 'wallet-coupon', title: '优惠券' }
      ]
    },
    { key: 'settings', title: '设置' }
  ]

  const activeNav = computed(() => {
    const path = route.path
    const query = route.query
    
    if (path.includes('/goods')) {
      // 根据查询参数确定激活的子菜单
      if (query.status === 'pending') return 'goods-pending'
      if (query.status === 'paid') return 'goods-paid'
      if (query.status === 'shipping') return 'goods-shipping'
      if (query.status === 'completed') return 'goods-completed'
      if (query.status === 'refund') return 'goods-refund'
      return 'goods' // 默认全部订单
    }
    if (path.includes('/favorites')) {
      // 根据查询参数确定激活的子菜单
      if (query.type === 'clothing') return 'favorites-clothing'
      if (query.type === 'article') return 'favorites-article'
      return 'favorites' // 默认全部收藏
    }
    if (path.includes('/drafts')) {
      // 根据查询参数确定激活的子菜单
      if (query.type === 'clothing') return 'drafts-clothing'
      if (query.type === 'article') return 'drafts-article'
      return 'drafts' // 默认全部
    }
    if (path.includes('/wallet')) {
      // 根据查询参数确定激活的子菜单
      if (query.type === 'income') return 'wallet-income'
      if (query.type === 'expense') return 'wallet-expense'
      if (query.type === 'coupon') return 'wallet-coupon'
      return 'wallet' // 默认全部收支
    }
    if (path.includes('/settings')) return 'settings'
    return 'goods'
  })

  const onEditProfile = () => {
    form.nickname = user.nickname
    form.avatar = user.avatar
    editVisible.value = true
  }
  const onViewQRCode = () => {
    qrCodeVisible.value = true
    nextTick(() => {
      generateQRCode()
    })
  }
  const generateQRCode = async () => {
    const canvas = qrCanvas.value
    if (!canvas) return
    
    try {
      // 动态导入 qrcode 库
      const QRCode = (await import('qrcode')).default
      
      const qrData = JSON.stringify({
        nickname: user.nickname,
        id: user.id,
        memberLevel: user.memberLevel,
        url: `${window.location.origin}/user-center`
      })
      
      await QRCode.toCanvas(canvas, qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
    } catch (error) {
      console.error('生成二维码失败:', error)
      ElMessage.error('生成二维码失败')
    }
  }
  const saveQRCode = () => {
    const canvas = qrCanvas.value
    if (!canvas) return
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `二维码名片-${user.nickname}.png`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('二维码已保存')
    })
  }
  const shareQRCode = () => {
    ElMessage.info('分享功能（可集成微信/QQ等分享SDK）')
  }
  const handleNavClick = (item) => {
    if (item.children) {
      // 如果有子菜单，切换展开/收起
      expandedNav.value = expandedNav.value === item.key ? '' : item.key
    } else {
      // 如果没有子菜单，直接跳转
      go(item.key)
    }
  }
  
  const go = (key) => {
    const to = {
      goods: '/user-center/goods',
      'goods-pending': '/user-center/goods?status=pending',
      'goods-paid': '/user-center/goods?status=paid',
      'goods-shipping': '/user-center/goods?status=shipping',
      'goods-completed': '/user-center/goods?status=completed',
      'goods-refund': '/user-center/goods?status=refund',
      favorites: '/user-center/favorites',
      'favorites-clothing': '/user-center/favorites?type=clothing',
      'favorites-article': '/user-center/favorites?type=article',
      drafts: '/user-center/drafts',
      'drafts-clothing': '/user-center/drafts?type=clothing',
      'drafts-article': '/user-center/drafts?type=article',
      wallet: '/user-center/wallet',
      'wallet-income': '/user-center/wallet?type=income',
      'wallet-expense': '/user-center/wallet?type=expense',
      'wallet-coupon': '/user-center/wallet?type=coupon',
      settings: '/user-center/settings'
    }[key]
    if (to) router.push(to)
  }
  const onSave = () => {
    formRef.value?.validate((valid) => {
      if (!valid) return
      user.nickname = form.nickname
      if (form.avatar) {
        user.avatar = form.avatar
      }
      editVisible.value = false
      ElMessage.success('资料已保存')
    })
  }
  </script>
  
  <style scoped>
  .user-center {
    padding: 100px 24px 40px; /* 预留顶部固定头部的高度 */
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .user-info-card {
    margin-bottom: 24px;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  
  .meta {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .nickname {
    font-size: 20px;
    font-weight: 600;
  }
  
  .sub {
    color: #666;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .dot {
    color: #999;
  }
  
  .actions {
    margin-left: auto;
    display: flex;
    gap: 12px;
  }

  .avatar-upload {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .qr-code-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .qr-code-card {
    background: #fff;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 20px;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .qr-header {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .qr-user-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .qr-nickname {
    font-size: 16px;
    font-weight: 600;
  }

  .qr-id {
    font-size: 12px;
    color: #666;
  }

  .qr-code-box {
    padding: 16px;
    background: #fff;
    border: 1px solid #eee;
    border-radius: 4px;
  }

  .qr-canvas {
    display: block;
  }

  .qr-actions {
    display: flex;
    gap: 12px;
    width: 100%;
    justify-content: center;
  }
  
  .main-layout {
    display: flex;
    gap: 24px;
    margin-top: 24px;
  }

  .sidebar {
    width: 200px;
    flex-shrink: 0;
    background: #fff;
    border-radius: 4px;
    padding: 8px 0;
  }

  .nav-item {
    font-size: 15px;
    color: #333;
    transition: all 0.2s;
  }

  .nav-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 20px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .nav-item-header:hover {
    background: #f5f5f5;
  }

  .nav-item.active > .nav-item-header {
    background: #f0f0f0;
    color: #333;
    font-weight: 600;
  }

  .arrow-icon {
    font-size: 14px;
    transition: transform 0.3s;
    color: #666;
  }

  .arrow-icon.rotate {
    transform: rotate(180deg);
  }

  .nav-children {
    background: #fafafa;
    padding: 4px 0;
  }

  .nav-child-item {
    padding: 10px 20px 10px 40px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    transition: all 0.2s;
  }

  .nav-child-item:hover {
    background: #f0f0f0;
    color: #333;
  }

  .nav-child-item.active {
    background: #e6f7ff;
    color: #1890ff;
    font-weight: 500;
  }

  .content-area {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 1024px) {
    .main-layout {
      flex-direction: column;
    }
    .sidebar {
      width: 100%;
      display: flex;
      gap: 8px;
      padding: 8px;
    }
    .nav-item {
      flex: 1;
      text-align: center;
      padding: 12px 8px;
    }
  }
  
  @media (max-width: 640px) {
    .actions {
      width: 100%;
      justify-content: flex-end;
      margin-top: 8px;
    }
    .user-info {
      align-items: flex-start;
    }
  }
  </style>
*** End Patch} ***!

