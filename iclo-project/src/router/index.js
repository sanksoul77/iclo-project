// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue' // 首页（公开）
import DraftBox from '../views/DraftBox.vue' // 引入草稿箱页面
import UserCenter from '../views/UserCenter.vue' // 个人中心
import Community from '../views/Community.vue' // 社区推荐
import MyGoods from '../views/user/MyGoods.vue' // 我的商品
import MyFavorites from '../views/user/MyFavorites.vue' // 我的收藏
import MyDrafts from '../views/user/MyDrafts.vue' // 我的草稿箱
import MyWallet from '../views/user/MyWallet.vue' // 我的钱包
import MySettings from '../views/user/MySettings.vue' // 设置
import AfterSaleDetail from '../views/user/AfterSaleDetail.vue' // 售后详情
import PublishWork from '../views/PublishWork.vue' // 发布作品
import Login from '../views/Login.vue' // 登录
import HomePage from '../views/HomePage.vue' // 主页
import CustomPlatform from '../views/CustomPlatform.vue' // 定制平台

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home // 未登录可访问首页
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/home-page',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/draft-box', // 草稿箱路由路径
    name: 'DraftBox',
    component: DraftBox
  },
  {
    path: '/user-center',
    name: 'UserCenter',
    component: UserCenter,
    children: [
      { path: '', redirect: '/user-center/goods' },
      { path: 'goods', name: 'MyGoods', component: MyGoods },
      { path: 'favorites', name: 'MyFavorites', component: MyFavorites },
      { path: 'drafts', name: 'MyDrafts', component: MyDrafts },
      { path: 'wallet', name: 'MyWallet', component: MyWallet },
      { path: 'settings', name: 'MySettings', component: MySettings }
    ]
  },
  {
    path: '/community',
    name: 'Community',
    component: Community
  },
  {
    path: '/custom-platform',
    name: 'CustomPlatform',
    component: CustomPlatform
  },
  {
    path: '/publish',
    name: 'PublishWork',
    component: PublishWork
  },
  {
    path: '/after-sale/:id',
    name: 'AfterSaleDetail',
    component: AfterSaleDetail,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 简易鉴权：本地 token 判断
function isAuthenticated() {
  try {
    return !!localStorage.getItem('authToken')
  } catch {
    return false
  }
}

router.beforeEach((to, from, next) => {
  // 已登录用户访问登录页时，直接跳转到个人中心或目标页
  if (to.path === '/login' && isAuthenticated()) {
    const target = typeof to.query.redirect === 'string' && to.query.redirect ? to.query.redirect : '/user-center'
    next(target)
    return
  }

  if (to.matched.some(record => record.meta?.requiresAuth)) {
    if (!isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
      return
    }
  }
  next()
})

export default router