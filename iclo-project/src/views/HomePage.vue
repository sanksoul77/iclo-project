<template>
  <div class="home-page">
    <section class="hero-card">
      <div class="hero-text">
        <p class="eyebrow">灵感即刻上线</p>
        <h1>iCLO 主创工作台</h1>
        <p class="subtitle">专注定制服饰设计，捕捉每一次灵感，第一时间抢占 C 位。</p>
      </div>
      <div class="search-block">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索作品、设计师或关键词"
          size="large"
          class="search-input"
        >
          <template #append>
            <el-button type="primary" @click="searchWorks">
              搜索
            </el-button>
          </template>
        </el-input>
        <p class="search-hint">热门：国潮卫衣 / 团队定制 / 动漫联名</p>
      </div>
    </section>

    <section class="category-tabs">
      <button
        v-for="tab in categories"
        :key="tab.value"
        class="tab-btn"
        :class="{ active: activeCategory === tab.value }"
        @click="activeCategory = tab.value"
      >
        {{ tab.label }}
      </button>
    </section>

    <section class="content-section">
      <div class="products-panel">
        <div class="panel-header">
          <div>
            <h2>热门作品展示</h2>
            <p>捕捉全网热度，分析爆款特征，助力下一次大卖。</p>
          </div>
          <el-tag type="success" effect="dark">今日热度 {{ heatScore }}</el-tag>
        </div>
        <div class="product-grid">
          <div
            class="product-card"
            v-for="item in filteredProducts"
            :key="item.id"
          >
            <div class="product-cover" :style="{ backgroundImage: `url(${item.cover})` }"></div>
            <div class="product-info">
              <div class="name-row">
                <h3>{{ item.title }}</h3>
                <el-tag size="small" effect="plain">{{ item.tag }}</el-tag>
              </div>
              <p class="desc">{{ item.desc }}</p>
              <div class="meta-row">
                <span>配色：{{ item.palette }}</span>
                <span>售价：¥{{ item.price }}</span>
              </div>
              <el-progress :percentage="item.trend" :stroke-width="6" />
            </div>
          </div>
        </div>
      </div>

      <aside class="sidebar">
        <div class="preview-card">
          <div class="preview-header">
            <h3>3D 试穿预览</h3>
            <el-tag type="info" size="small">实时</el-tag>
          </div>
          <div class="preview-stage">
            <div class="preview-model">
              <div class="avatar-head"></div>
              <div class="avatar-body" :style="{ background: currentVariant.gradient }"></div>
            </div>
            <p class="preview-angle">视角：{{ previewAngle }}°</p>
          </div>
          <div class="preview-info">
            <p>{{ currentVariant.name }}</p>
            <p class="sub">系列：{{ currentVariant.series }}</p>
            <p class="sub">材质：{{ currentVariant.fabric }}</p>
          </div>
          <div class="preview-actions">
            <el-button size="small" @click="rotatePreview">旋转</el-button>
            <el-button size="small" @click="switchVariant">换装</el-button>
            <el-button size="small" type="primary">生成报告</el-button>
          </div>
        </div>

        <div class="trend-card">
          <h3>灵感速递</h3>
          <ul>
            <li v-for="idea in inspiration" :key="idea.title">
              <p class="idea-title">{{ idea.title }}</p>
              <p class="idea-desc">{{ idea.desc }}</p>
            </li>
          </ul>
        </div>
      </aside>
    </section>

    <section class="ai-section">
      <div class="ai-card">
        <div class="ai-header">
          <div>
            <h3>AI 设计助手</h3>
            <p>快速获取面料、配色、版型建议</p>
          </div>
          <el-tag type="warning" size="small">Beta</el-tag>
        </div>
        <div class="chat-window">
          <div
            v-for="(msg, idx) in aiMessages"
            :key="idx"
            class="chat-row"
            :class="msg.role"
          >
            <div class="bubble">{{ msg.content }}</div>
          </div>
          <div v-if="aiTyping" class="chat-row ai">
            <div class="bubble typing">正在思考...</div>
          </div>
        </div>
        <div class="chat-input">
          <el-input
            v-model="newMessage"
            type="textarea"
            :rows="2"
            maxlength="120"
            placeholder="描述你想要的风格，比如：复古运动 + 金属面料 + 秋冬"
          />
          <el-button type="primary" :loading="aiTyping" @click="sendMessage">发送</el-button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const searchKeyword = ref('')
const categories = [
  { label: '全部', value: 'all' },
  { label: '热门', value: 'hot' },
  { label: '动漫游戏', value: 'anime' },
  { label: '团体定制', value: 'team' },
  { label: '个性化定制', value: 'custom' }
]
const activeCategory = ref('hot')

const products = ref([
  {
    id: 1,
    title: '复古撞色卫衣',
    desc: '灵感来源于 90s 复古街头，宽松剪裁搭配低饱和度配色。',
    palette: '午夜蓝 / 云雾灰',
    price: 299,
    tag: '爆款',
    trend: 82,
    category: 'hot',
    cover: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=60'
  },
  {
    id: 2,
    title: 'NEO-FLUX 机能套装',
    desc: '防风面料 + 模块化结构，适合团队机能风定制。',
    palette: '霓虹紫 / 冰川白',
    price: 459,
    tag: '机能',
    trend: 75,
    category: 'team',
    cover: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=60'
  },
  {
    id: 3,
    title: '动漫联名系列',
    desc: '热门 IP 正版授权，采用全幅热升华工艺呈现细节。',
    palette: '赛博红 / 深空黑',
    price: 369,
    tag: '联名',
    trend: 68,
    category: 'anime',
    cover: 'https://images.unsplash.com/photo-1503342250628-25064b7c8050?auto=format&fit=crop&w=600&q=60'
  }
])

const filteredProducts = computed(() => {
  if (activeCategory.value === 'all') return products.value
  return products.value.filter(item => item.category === activeCategory.value || (activeCategory.value === 'hot' && item.category === 'hot'))
})

const heatScore = computed(() => {
  return filteredProducts.value.reduce((sum, item) => sum + item.trend, 0)
})

const variants = [
  {
    name: '潮流宽松 T 恤',
    series: 'NEO-FLUX',
    fabric: '云感棉',
    gradient: 'linear-gradient(135deg, #7F7FD5, #86A8E7, #91EAE4)'
  },
  {
    name: '都市机能外套',
    series: 'URBAN TECH',
    fabric: '科技纤维',
    gradient: 'linear-gradient(135deg, #667db6, #0082c8, #00bfff, #00d2ff)'
  }
]

const currentVariantIndex = ref(0)
const previewAngle = ref(35)
const currentVariant = computed(() => variants[currentVariantIndex.value])

const rotatePreview = () => {
  previewAngle.value = (previewAngle.value + 45) % 360
}

const switchVariant = () => {
  currentVariantIndex.value = (currentVariantIndex.value + 1) % variants.length
}

const inspiration = [
  { title: '国潮泼墨系列', desc: '以宣纸纹理为灵感，融入泼墨渐变。' },
  { title: '冬日机能保暖', desc: '模块化口袋 + 可拆卸内胆，适配不同温区。' },
  { title: 'AI 生成花型', desc: '通过 AI 生成器，每日输出 20+ 套花型方案。' }
]

const aiMessages = ref([
  { role: 'ai', content: '你好，我是 iCLO AI 设计助手，有任何灵感都可以告诉我。' },
  { role: 'user', content: '我想做一款秋冬团队卫衣，想突出科技感。' },
  { role: 'ai', content: '建议使用冰川白 + 霓虹蓝配色，搭配反光条与植绒 logo。' }
])
const newMessage = ref('')
const aiTyping = ref(false)

const sendMessage = () => {
  const text = newMessage.value.trim()
  if (!text) return
  aiMessages.value.push({ role: 'user', content: text })
  newMessage.value = ''
  aiTyping.value = true
  setTimeout(() => {
    aiMessages.value.push({
      role: 'ai',
      content: `AI 建议：可以尝试 ${text} 主题，加入局部金属质感或发光元素。`
    })
    aiTyping.value = false
  }, 900)
}

const searchWorks = () => {
  if (!searchKeyword.value.trim()) return
  aiMessages.value.push({
    role: 'ai',
    content: `已为你标记 “${searchKeyword.value.trim()}” 相关灵感，稍后可在作品库查看。`
  })
  searchKeyword.value = ''
}
</script>

<style scoped>
.home-page {
  padding: 110px 32px 60px;
  background: #f4f6fb;
  min-height: 100vh;
}

.hero-card {
  background: linear-gradient(120deg, #c33764, #1d2671);
  color: #fff;
  border-radius: 28px;
  padding: 32px 40px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 40px;
}

.hero-text h1 {
  font-size: 36px;
  margin: 6px 0 10px;
}

.hero-text .subtitle {
  opacity: 0.85;
}

.eyebrow {
  letter-spacing: 0.3em;
  text-transform: uppercase;
  font-size: 13px;
}

.search-block {
  flex: 1.2;
}

.search-input :deep(.el-input-group__append) {
  background: transparent;
  border: none;
  padding: 0;
}

.search-hint {
  margin-top: 8px;
  opacity: 0.8;
  font-size: 13px;
}

.category-tabs {
  display: flex;
  gap: 12px;
  margin: 26px 0 10px;
}

.tab-btn {
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid #d6d8e1;
  background: #fff;
  cursor: pointer;
  transition: all .2s;
}

.tab-btn.active {
  background: #1d5cff;
  color: #fff;
  border-color: #1d5cff;
  box-shadow: 0 8px 20px rgba(29, 92, 255, 0.25);
}

.content-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
  margin-bottom: 28px;
}

.products-panel,
.sidebar > div {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 35, 95, 0.08);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}

.product-grid {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.product-card {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 18px;
  border: 1px solid #eef0f6;
  border-radius: 18px;
  overflow: hidden;
}

.product-cover {
  background-size: cover;
  background-position: center;
  min-height: 180px;
}

.product-info {
  padding: 16px 18px 18px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6c7285;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.preview-card {
  text-align: center;
}

.preview-stage {
  margin: 14px 0;
  background: linear-gradient(135deg, #f0f4ff, #fff);
  border-radius: 16px;
  padding: 24px 12px;
}

.preview-model {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.avatar-head {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ffe0b2;
}

.avatar-body {
  width: 90px;
  height: 120px;
  border-radius: 18px 18px 30px 30px;
}

.preview-angle {
  margin-top: 8px;
  color: #6c7285;
  font-size: 13px;
}

.preview-info .sub {
  color: #8c90a3;
  font-size: 13px;
}

.preview-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.trend-card ul {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 12px;
}

.idea-title {
  font-weight: 600;
}

.idea-desc {
  font-size: 13px;
  color: #8a8f99;
}

.ai-section {
  margin-top: 16px;
}

.ai-card {
  background: #fff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 10px 30px rgba(15, 35, 95, 0.08);
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.chat-window {
  max-height: 220px;
  overflow-y: auto;
  padding-right: 4px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-row {
  display: flex;
}

.chat-row.user {
  justify-content: flex-end;
}

.bubble {
  max-width: 70%;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
  word-break: break-word;
}

.chat-row.user .bubble {
  background: #1d5cff;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-row.ai .bubble {
  background: #eef1ff;
  color: #1f2233;
  border-bottom-left-radius: 4px;
}

.bubble.typing {
  font-style: italic;
  opacity: 0.7;
}

.chat-input {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.chat-input :deep(textarea.el-textarea__inner) {
  border-radius: 16px;
}

@media (max-width: 1100px) {
  .content-section {
    grid-template-columns: 1fr;
  }
}
</style>

