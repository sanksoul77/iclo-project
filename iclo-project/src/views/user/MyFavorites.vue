<template>
  <div class="page-wrap">
    <el-card shadow="never" class="fav-card">
      <div class="fav-list">
        <div v-for="item in filteredFavorites" :key="item.id" class="fav-item">
          <el-image class="cover" :src="item.cover" fit="cover" />
          <div class="meta">
            <div class="title">
              {{ item.title }}
              <el-tag size="small" class="ml8" type="info" effect="light">{{ item.type }}</el-tag>
            </div>
            <div class="desc">{{ item.desc }}</div>
            <div class="ops">
              <el-button size="small" type="primary" text @click="viewItem(item)">查看</el-button>
              <el-button size="small" type="danger" text @click="removeFav(item.id)">取消收藏</el-button>
            </div>
          </div>
        </div>
      </div>
      <el-empty v-if="filteredFavorites.length === 0" description="暂无收藏内容" />
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const activeFilter = ref('all')

// 从 URL 查询参数中读取状态
const updateFilterFromRoute = () => {
  const type = route.query.type
  if (type && ['all', 'clothing', 'article'].includes(type)) {
    activeFilter.value = type
  } else {
    activeFilter.value = 'all'
  }
}

onMounted(() => {
  updateFilterFromRoute()
  // 优先从本地存储加载收藏
  try {
    const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (Array.isArray(stored) && stored.length) {
      favorites.splice(0, favorites.length, ...stored)
    } else {
      // 初始数据写入本地，便于后续统一读取
      localStorage.setItem('favorites', JSON.stringify(favorites))
    }
  } catch (e) {
    // 如果本地存储异常，忽略并使用默认数据
  }
})

// 监听路由变化
watch(() => route.query.type, () => {
  updateFilterFromRoute()
})

const favorites = reactive([
  {
    id: 1,
    title: '极简通勤西装外套',
    type: '成衣',
    typeKey: 'clothing',
    desc: '极简 / 通勤 · 社区同款',
    cover:
      'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1&v=1',
  },
  {
    id: 2,
    title: '社区精选：复古穿搭指南',
    type: '文章',
    typeKey: 'article',
    desc: '复古与现代的碰撞，提升穿搭高级感',
    cover:
      'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?q=80&w=1200&auto=format&fit=crop',
    postId: 2, // 对应社区文章ID
  },
  {
    id: 3,
    title: '简约羊毛呢大衣',
    type: '成衣',
    typeKey: 'clothing',
    desc: '经典款式，百搭单品',
    cover:
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1200&auto=format&fit=crop',
  },
])

const filteredFavorites = computed(() => {
  if (activeFilter.value === 'all') {
    return favorites
  }
  return favorites.filter(item => item.typeKey === activeFilter.value)
})

const viewItem = (item) => {
  if (item.type === '文章' && item.postId) {
    // 跳转到社区页面，并传递文章ID
    router.push({ path: '/community', query: { postId: item.postId } })
  } else {
    ElMessage.info('查看详情（占位）')
  }
}

const removeFav = (id) => {
  const idx = favorites.findIndex((x) => x.id === id)
  if (idx !== -1) {
    favorites.splice(idx, 1)
    ElMessage.success('已取消收藏')
    try {
      localStorage.setItem('favorites', JSON.stringify(favorites))
    } catch (e) {
      // 忽略持久化失败
    }
    // 反向同步社区收藏集合
    try {
      const raw = JSON.parse(localStorage.getItem('community_favs') || '[]')
      const set = new Set(Array.isArray(raw) ? raw : [])
      if (set.has(id)) {
        set.delete(id)
        localStorage.setItem('community_favs', JSON.stringify(Array.from(set)))
      }
    } catch (e) {}
  }
}

// 收藏变更时自动持久化
watch(
  favorites,
  (val) => {
    try {
      localStorage.setItem('favorites', JSON.stringify(val))
    } catch (e) {
      // 忽略持久化失败
    }
  },
  { deep: true }
)
</script>

<style scoped>
.page-wrap {
  padding: 0;
}
.fav-card {
  margin-top: 16px;
}
.fav-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.fav-item {
  display: grid;
  grid-template-columns: 120px 1fr;
  grid-gap: 16px;
  align-items: center;
}
.cover {
  width: 120px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}
.meta .title {
  font-weight: 600;
}
.meta .desc {
  margin: 6px 0 8px;
  color: #666;
  font-size: 13px;
}
.ops {
  display: flex;
  gap: 8px;
}
.ml8 {
  margin-left: 8px;
}
@media (max-width: 640px) {
  .fav-item {
    grid-template-columns: 96px 1fr;
  }
  .cover {
    width: 96px;
    height: 72px;
  }
}
</style>


