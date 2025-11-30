<template>
  <div class="community">
    <!-- 顶部工具条：搜索 + 发布 -->
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="输入关键词，搜索你感兴趣的内容"
        clearable
        class="search"
        @keyup.enter="applyFilters"
      >
        <template #append>
          <el-button type="primary" @click="applyFilters">搜索</el-button>
        </template>
      </el-input>
    </div>

    <!-- 大菜单：社区热门 / 时尚推荐 -->
    <el-tabs v-model="activeMain" @tab-change="applyFilters">
      <el-tab-pane label="社区热门" name="hot" />
      <el-tab-pane label="时尚推荐" name="fashion" />
    </el-tabs>

    <!-- 小菜单：服饰类别筛选 -->
    <div class="sub-filter">
      <!-- 内容类型与服饰分类合并在一行 -->
      <el-check-tag
        :checked="contentTypeFilter === 'all'"
        @change="() => setContentType('all')"
      >
        全部
      </el-check-tag>
      <el-check-tag
        :checked="contentTypeFilter === 'garment'"
        @change="() => setContentType('garment')"
      >
        成衣
      </el-check-tag>
      <el-check-tag
        :checked="contentTypeFilter === 'article'"
        @change="() => setContentType('article')"
      >
        文章
      </el-check-tag>
      <el-check-tag
        v-for="cat in categories"
        :key="cat"
        :checked="selectedCategories.includes(cat)"
        @change="toggleCategory(cat)"
      >
        {{ cat }}
      </el-check-tag>
    </div>

    <!-- 内容区：卡片网格（可滚动） -->
    <div class="card-grid">
      <el-empty v-if="filteredPosts.length === 0" description="暂无内容，换个关键词或分类试试" />
      <el-card
        v-for="item in filteredPosts"
        :key="item.id"
        class="post-card"
        :class="{ 'highlight-post': highlightedPostId === item.id }"
        :ref="el => setPostRef(el, item.id)"
        shadow="hover"
      >
        <img class="cover" :src="item.cover" :alt="item.title" />
        <div class="card-meta">
          <div class="title">{{ item.title }}</div>
          <div class="tags">
            <el-tag v-for="t in item.tags" :key="t" size="small">{{ t }}</el-tag>
          </div>
          <div class="stats">
            <span>❤ {{ getLikesCount(item.id) }}</span>
            <span>💬 {{ getCommentsCount(item.id) }}</span>
            <span>🛒 {{ item.purchases }}</span>
          </div>
        </div>
        <div class="actions">
          <div class="actions-group">
            <el-button
              class="action-btn"
              @click="toggleLike(item.id)"
              :type="isLiked(item.id) ? 'primary' : 'default'"
              text
            >
              <el-icon class="icon-like" :class="{ active: isLiked(item.id) }" size="18">
                <StarFilled v-if="isLiked(item.id)" />
                <Star v-else />
              </el-icon>
              <span class="label">{{ isLiked(item.id) ? '已点赞' : '点赞' }}</span>
              <span class="count">{{ getLikesCount(item.id) }}</span>
            </el-button>

            <el-button
              class="action-btn"
              @click="toggleFav(item.id)"
              :type="isFav(item.id) ? 'success' : 'default'"
              text
            >
              <el-icon class="icon-fav" :class="{ active: isFav(item.id) }" size="18">
                <CollectionTag v-if="isFav(item.id)" />
                <Collection v-else />
              </el-icon>
              <span class="label">{{ isFav(item.id) ? '已收藏' : '收藏' }}</span>
            </el-button>

            <el-button class="action-btn" @click="openComments(item.id)" text>
              <el-icon class="icon-comment" size="18">
                <ChatDotRound />
              </el-icon>
              <span class="label">评论</span>
              <span class="count">{{ getCommentsCount(item.id) }}</span>
            </el-button>
          </div>
          <el-button type="primary" @click="onBuy(item)">购买</el-button>
        </div>
      </el-card>
    </div>

    <!-- 评论弹窗 -->
    <el-dialog v-model="commentVisible" :title="activePostTitle" width="560px">
      <div class="comment-section">
        <div class="comment-list" v-if="currentComments.length">
          <div class="comment-item" v-for="c in currentComments" :key="c.id">
            <div class="comment-meta">
              <span class="author">{{ c.author }}</span>
              <span class="time">{{ c.time }}</span>
            </div>
            <div class="content">{{ c.content }}</div>
          </div>
        </div>
        <el-empty v-else description="还没有评论，来抢个沙发吧~" />
        <div class="comment-editor">
          <el-input
            v-model="newComment"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 6 }"
            maxlength="200"
            show-word-limit
            placeholder="友善发言，理性交流"
          />
          <div class="editor-ops">
            <el-input v-model="nickname" placeholder="昵称（可选）" class="nick" />
            <el-button type="primary" @click="submitComment" :disabled="!newComment.trim()">发布评论</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="commentVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 悬浮发布按钮 -->
    <el-tooltip content="发布作品" placement="left">
      <el-button class="fab-publish" type="primary" circle @click="openPublish">
        <el-icon size="28"><Plus /></el-icon>
      </el-button>
    </el-tooltip>

    <!-- 发布作品：上传弹窗 -->
    <el-dialog v-model="publishVisible" title="发布作品" width="560px">
      <el-form :model="publishForm" label-width="88px" ref="publishRef" :rules="publishRules">
        <el-form-item label="标题" prop="title">
          <el-input v-model="publishForm.title" maxlength="30" show-word-limit placeholder="给作品起个名字" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="publishForm.category" placeholder="选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select v-model="publishForm.tags" multiple filterable allow-create default-first-option placeholder="输入或选择标签">
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="成图" prop="cover">
          <el-upload
            class="uploader"
            :auto-upload="false"
            :limit="1"
            :on-change="onSelectCover"
            accept="image/*"
          >
            <el-button>选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png，大小建议不超过 5MB</div>
            </template>
          </el-upload>
          <img v-if="publishForm.cover" :src="publishForm.cover" class="preview" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="publishVisible = false">取消</el-button>
        <el-button type="primary" @click="onPublish">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Star, StarFilled, ChatDotRound, Collection, CollectionTag } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()

// 搜索与筛选
const keyword = ref('')
const activeMain = ref('hot') // hot | fashion
const categories = ['女装上衣', '女装裙装', '男装上衣', '男装裤装', '配饰', '运动', '童装']
const selectedCategories = ref([])
const contentTypeFilter = ref('all') // all | garment | article
const setContentType = (type) => {
  contentTypeFilter.value = type
  applyFilters()
}

// 点赞与评论持久化
const likedSet = ref(new Set())
const favSet = ref(new Set())
const commentsMap = ref({})
const commentVisible = ref(false)
const activePostId = ref(null)
const newComment = ref('')
const nickname = ref('')

const activePostTitle = computed(() => {
  const p = posts.value.find(p => p.id === activePostId.value)
  return p ? `评论 · ${p.title}` : '评论'
})

const loadPersist = () => {
  try {
    const likedRaw = JSON.parse(localStorage.getItem('community_likes') || '[]')
    likedSet.value = new Set(Array.isArray(likedRaw) ? likedRaw : [])
  } catch (e) {}
  try {
    const favRaw = JSON.parse(localStorage.getItem('community_favs') || '[]')
    favSet.value = new Set(Array.isArray(favRaw) ? favRaw : [])
  } catch (e) {}
  try {
    const cmRaw = JSON.parse(localStorage.getItem('community_comments') || '{}')
    commentsMap.value = typeof cmRaw === 'object' && cmRaw ? cmRaw : {}
  } catch (e) {}
}
const saveLikes = () => {
  try {
    localStorage.setItem('community_likes', JSON.stringify(Array.from(likedSet.value)))
  } catch (e) {}
}
const saveFavs = () => {
  try {
    localStorage.setItem('community_favs', JSON.stringify(Array.from(favSet.value)))
  } catch (e) {}
}
const saveComments = () => {
  try {
    localStorage.setItem('community_comments', JSON.stringify(commentsMap.value))
  } catch (e) {}
}

const isLiked = (postId) => likedSet.value.has(postId)
const getLikesCount = (postId) => {
  const p = posts.value.find(p => p.id === postId)
  const base = p ? p.likes : 0
  // 简单规则：已点赞则 +1，未点赞维持 base
  return base + (isLiked(postId) ? 1 : 0)
}
const getCommentsCount = (postId) => {
  const arr = commentsMap.value[postId] || []
  return Array.isArray(arr) ? arr.length : 0
}
const toggleLike = (postId) => {
  if (isLiked(postId)) {
    likedSet.value.delete(postId)
    ElMessage.success('已取消点赞')
  } else {
    likedSet.value.add(postId)
    ElMessage.success('已点赞')
  }
  saveLikes()
}

const isFav = (postId) => favSet.value.has(postId)
const toggleFav = (postId) => {
  const post = posts.value.find(p => p.id === postId)
  if (isFav(postId)) {
    favSet.value.delete(postId)
    // 同步移除到通用收藏列表
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
      const next = Array.isArray(stored) ? stored.filter(i => i.id !== postId) : []
      localStorage.setItem('favorites', JSON.stringify(next))
    } catch (e) {}
    ElMessage.success('已取消收藏')
  } else {
    favSet.value.add(postId)
    // 同步写入到通用收藏列表，避免重复
    if (post) {
      const typeKey = (post.contentType === 'article') ? 'article' : 'clothing'
      const typeLabel = (typeKey === 'article') ? '文章' : '成衣'
      const favItem = {
        id: post.id,              // 与社区文章ID对齐，便于反向同步
        postId: post.id,
        title: post.title,
        type: typeLabel,
        typeKey,
        desc: Array.isArray(post.tags) && post.tags.length ? post.tags.join(' / ') : (post.category || ''),
        cover: post.cover
      }
      try {
        const stored = JSON.parse(localStorage.getItem('favorites') || '[]')
        const arr = Array.isArray(stored) ? stored : []
        const exists = arr.some(i => i.id === post.id)
        if (!exists) {
          arr.unshift(favItem)
          localStorage.setItem('favorites', JSON.stringify(arr))
        }
      } catch (e) {}
    }
    ElMessage.success('已收藏')
  }
  saveFavs()
}

const openComments = (postId) => {
  activePostId.value = postId
  newComment.value = ''
  commentVisible.value = true
}
const currentComments = computed(() => {
  if (!activePostId.value) return []
  const arr = commentsMap.value[activePostId.value] || []
  return Array.isArray(arr) ? arr : []
})
const submitComment = () => {
  const content = newComment.value.trim()
  if (!content) return
  const postId = activePostId.value
  if (!commentsMap.value[postId]) commentsMap.value[postId] = []
  commentsMap.value[postId].push({
    id: Date.now(),
    author: nickname.value.trim() || '匿名用户',
    content,
    time: new Date().toLocaleString()
  })
  newComment.value = ''
  saveComments()
  ElMessage.success('评论发布成功')
}

const toggleCategory = (cat) => {
  const idx = selectedCategories.value.indexOf(cat)
  if (idx === -1) selectedCategories.value.push(cat)
  else selectedCategories.value.splice(idx, 1)
  applyFilters()
}
const applyFilters = () => {
  // 由 computed 负责实时过滤，这里可以放打点或请求触发
}

// 模拟社区数据
const allTags = ['复古', '极简', '通勤', '学院风', '街头', '法式', '运动风']
const posts = ref([
  {
    id: 1,
    title: '法式方领连衣裙',
    cover: 'https://images.pexels.com/photos/7940621/pexels-photo-7940621.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1&v=1',
    tags: ['法式', '裙装'],
    category: '女装裙装',
    contentType: 'garment',
    likes: 128,
    purchases: 36,
    channel: 'fashion'
  },
  {
    id: 2,
    title: '社区精选：复古穿搭指南',
    cover: 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?q=80&w=1200&auto=format&fit=crop',
    tags: ['复古', '穿搭指南'],
    category: '配饰',
    contentType: 'article',
    likes: 256,
    purchases: 58,
    channel: 'hot'
  },
  {
    id: 4,
    title: '极简通勤西装外套',
    cover: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1&v=1',
    tags: ['极简', '通勤'],
    category: '女装上衣',
    contentType: 'garment',
    likes: 256,
    purchases: 58,
    channel: 'hot'
  },
  {
    id: 3,
    title: '街头宽松连帽卫衣',
    cover: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?q=80&w=1200&auto=format&fit=crop',
    tags: ['街头', '运动风'],
    category: '男装上衣',
    contentType: 'garment',
    likes: 402,
    purchases: 91,
    channel: 'hot'
  }
])

const filteredPosts = computed(() => {
  const kw = keyword.value.trim()
  return posts.value.filter((p) => {
    const byMain = activeMain.value ? p.channel === activeMain.value : true
    const byType = contentTypeFilter.value === 'all'
      ? true
      : (p.contentType || 'garment') === contentTypeFilter.value
    const byCat = selectedCategories.value.length
      ? selectedCategories.value.includes(p.category)
      : true
    const byKw = kw
      ? p.title.includes(kw) ||
        p.tags.some((t) => t.includes(kw)) ||
        p.category.includes(kw)
      : true
    return byMain && byType && byCat && byKw
  })
})

// 高亮显示的文章ID
const highlightedPostId = ref(null)
const postRefs = ref({})

const setPostRef = (el, id) => {
  if (el) {
    postRefs.value[id] = el
  }
}

// 监听路由查询参数，如果有 postId，则高亮并滚动到对应文章
watch(() => route.query.postId, (postId) => {
  if (postId) {
    const id = Number(postId)
    highlightedPostId.value = id
    
    // 确保文章在过滤结果中可见
    const post = posts.value.find(p => p.id === id)
    if (post) {
      // 如果文章不在当前筛选结果中，调整筛选条件
      if (!filteredPosts.value.find(p => p.id === id)) {
        // 清除筛选，显示所有文章
        keyword.value = ''
        selectedCategories.value = []
        activeMain.value = post.channel || 'hot'
      }
      
      // 滚动到对应文章
      nextTick(() => {
        const cardEl = postRefs.value[id]?.$el || postRefs.value[id]
        if (cardEl) {
          cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
          // 3秒后取消高亮
          setTimeout(() => {
            highlightedPostId.value = null
          }, 3000)
        }
      })
    }
  }
}, { immediate: true })

onMounted(() => {
  // 如果URL中有postId，触发高亮
  if (route.query.postId) {
    const id = Number(route.query.postId)
    highlightedPostId.value = id
  }
  loadPersist()
})

// 购买（占位交互）
const onBuy = (item) => {
  item.purchases += 1
  ElMessage.success('已加入购买流程（占位）')
}

// 发布成图
const publishVisible = ref(false)
const publishRef = ref(null)
const publishForm = reactive({
  title: '',
  category: '',
  tags: [],
  cover: ''
})
const publishRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  cover: [{ required: true, message: '请上传成图', trigger: 'change' }]
}
const openPublish = () => {
  router.push('/publish')
}
const onSelectCover = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    publishForm.cover = String(e.target?.result || '')
  }
  reader.readAsDataURL(file.raw)
}
const onPublish = () => {
  publishRef.value?.validate((valid) => {
    if (!valid) return
    posts.value.unshift({
      id: Date.now(),
      title: publishForm.title,
      cover: publishForm.cover,
      tags: publishForm.tags.slice(0),
      category: publishForm.category,
      likes: 0,
      purchases: 0,
      channel: 'hot'
    })
    publishVisible.value = false
    publishForm.title = ''
    publishForm.category = ''
    publishForm.tags = []
    publishForm.cover = ''
    ElMessage.success('发布成功，已进入社区')
  })
}
</script>

<style scoped>
.community {
  padding: 100px 24px 40px;
  max-width: 1200px;
  margin: 0 auto;
}
.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.toolbar .search {
  flex: 1;
}
.sub-filter {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  max-height: calc(100vh - 260px);
  overflow: auto;
  padding-right: 4px;
}
.post-card {
  display: flex;
  flex-direction: column;
}
.post-card .cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 4px;
}
.card-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}
.card-meta .title {
  font-weight: 600;
}
.card-meta .tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.card-meta .stats {
  display: flex;
  gap: 16px;
  color: #666;
}
.actions {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
}
.actions-group {
  display: flex;
  gap: 0;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-right: 1px solid #f0f2f5;
}
.action-btn:last-child {
  border-right: none;
}
.action-btn .label {
  font-size: 13px;
}
.action-btn .count {
  font-size: 12px;
  color: #909399;
}
.icon-like.active {
  color: #f56c6c;
}
.icon-fav.active {
  color: #67c23a;
}
.post-card.highlight-post {
  border: 2px solid #409eff;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.3);
  animation: highlightPulse 0.5s ease-in-out;
}
/* 评论样式 */
.comment-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.comment-list {
  max-height: 320px;
  overflow: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.comment-item {
  padding: 8px 10px;
  background: #f8f8f8;
  border-radius: 6px;
}
.comment-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #888;
  margin-bottom: 6px;
}
.comment-meta .author {
  font-weight: 600;
  color: #666;
}
.comment-editor {
  margin-top: 6px;
}
.editor-ops {
  margin-top: 8px;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  align-items: center;
}
.editor-ops .nick {
  max-width: 180px;
}
@keyframes highlightPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
  }
}
@media (max-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 640px) {
  .card-grid {
    grid-template-columns: 1fr;
  }
}
.uploader .el-upload__tip {
  margin-left: 12px;
}
.preview {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
  margin-left: 12px;
}
.fab-publish {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  width: 56px;
  height: 56px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px rgba(64, 158, 255, 0.35);
}
</style>


