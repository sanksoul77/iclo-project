<template>
  <header class="header">
    <!-- 左上角：平台图标 + 隐藏菜单按钮 -->
    <div class="left-area">
      <!-- 平台图标 -->
      <img src="/logo.png" alt="品牌Logo" class="logo" @click="goHome">
      <!-- 隐藏菜单按钮 -->
      <el-button 
        class="menu-btn" 
        @click="showMenu = !showMenu"
      >
        <el-icon><Menu /></el-icon>
      </el-button>
    </div>

    <!-- 隐藏菜单（点击按钮展开） -->
    <div class="hidden-menu" v-if="showMenu">
      <el-menu default-active="/" class="el-menu-vertical-demo" router>
        <el-menu-item index="/">首页</el-menu-item>
        <el-menu-item index="/home-page">主页</el-menu-item>
        <el-menu-item index="/draft-box">草稿箱</el-menu-item>
        <el-menu-item index="/community">社区推荐</el-menu-item>
        <el-menu-item index="/custom-platform">定制平台</el-menu-item>
        <el-menu-item index="/user-center">个人中心</el-menu-item>
        <el-menu-item index="2">女装系列</el-menu-item>
        <el-menu-item index="3">男装系列</el-menu-item>
        <el-menu-item index="4">配饰</el-menu-item>
        <el-menu-item index="5">关于我们</el-menu-item>
      </el-menu>
    </div>

    <!-- 右侧按钮区 -->
    <div class="right-buttons">
      <el-button type="text" class="login-btn" @click="goLogin">登录</el-button>
      <el-button type="primary" class="contact-btn" @click="showContact = true">联系我们</el-button>
    </div>
  </header>

  <el-dialog
    v-model="showContact"
    title="联系我们"
    width="460px"
    class="contact-dialog"
    align-center
    destroy-on-close
  >
    <div class="contact-list">
      <div
        class="contact-item"
        v-for="item in contactDetails"
        :key="item.title"
      >
        <div class="icon-box" :class="item.type">
          <el-icon :size="24">
            <component :is="item.icon" />
          </el-icon>
        </div>
        <div class="item-content">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-main">{{ item.main }}</div>
          <div class="item-sub">{{ item.sub }}</div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button type="primary" class="confirm-btn" @click="showContact = false">我知道了</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Menu, Phone, Message, Location, ChatLineRound } from '@element-plus/icons-vue'

const showMenu = ref(false)
const showContact = ref(false)
const router = useRouter()
const route = useRoute()

const goHome = () => {
  router.push('/')
}
const contactDetails = [
  {
    title: '客服电话',
    main: '400-888-8888',
    sub: '服务时间：9:00 - 18:00',
    icon: Phone,
    type: 'phone'
  },
  {
    title: '邮箱地址',
    main: 'service@iclo.com',
    sub: '24小时在线服务',
    icon: Message,
    type: 'mail'
  },
  {
    title: '公司地址',
    main: '北京市朝阳区xxx街道xxx号',
    sub: '欢迎到访',
    icon: Location,
    type: 'address'
  },
  {
    title: '在线客服',
    main: 'QQ群：123456789',
    sub: '微信：iclo_service',
    icon: ChatLineRound,
    type: 'online'
  }
]

const goLogin = () => {
  const redirect = route.fullPath || '/'
  router.push({ path: '/login', query: { redirect } })
}
</script>

<style scoped>
.header {
  position: fixed; /* 固定在顶部，不随滚动消失 */
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.9); /* 半透明白色背景 */
  z-index: 1000; /* 确保在海报上方 */
}

.left-area {
  display: flex;
  align-items: center;
  gap: 20px; /* 图标和菜单按钮的间距 */
}

.logo {
  height: 40px; /* 图标高度，根据实际调整 */
  width: auto; /* 宽度自适应 */
  cursor: pointer;
}

.menu-btn {
  font-size: 20px;
}

.hidden-menu {
  position: absolute;
  top: 70px;
  left: 30px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  z-index: 100;
}

.right-buttons {
  display: flex;
  gap: 15px;
}

.login-btn {
  color: #333;
  font-size: 16px;
}

.contact-btn {
  background: #0066b2; /* 优衣库风格蓝色 */
  border-color: #0066b2;
}

:deep(.contact-dialog .el-dialog__header) {
  font-weight: 600;
}

:deep(.contact-dialog .el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 16px;
}

.contact-dialog {
  border-radius: 20px;
}

.contact-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 6px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 16px;
  background: #f9fbff;
  border: 1px solid #e6edff;
}

.icon-box {
  width: 50px;
  height: 50px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  background: #edf4ff;
  color: #1d5cff;
}

.icon-box.mail {
  background: #f4f5ff;
}

.icon-box.address {
  background: #f0f8ff;
}

.icon-box.online {
  background: #f5faff;
}

.item-content {
  flex: 1;
}

.item-title {
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 4px;
}

.item-main {
  font-size: 16px;
  color: #1d5cff;
  margin-bottom: 2px;
}

.item-sub {
  font-size: 13px;
  color: #8a8f99;
}

.confirm-btn {
  width: 100%;
  border-radius: 12px;
  background: linear-gradient(120deg, #0f73ff, #0a5bdc);
  border: none;
}
</style>