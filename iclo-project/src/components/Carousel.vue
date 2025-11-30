<template>
  <!-- 全屏滚动容器 -->
  <div class="fullscreen-carousel" @wheel="handleWheel">
    <section
      v-for="(slide, index) in slides"
      :key="slide.id"
      class="slide"
      :class="{ active: currentSlide === index }"
      :style="{ backgroundImage: 'url(' + slide.image + ')' }"
    >
      <div class="slide-overlay"></div>
      <div class="slide-content">
        <p class="eyebrow">{{ slide.eyebrow }}</p>
        <h2>{{ slide.title }}</h2>
        <p class="subtitle">{{ slide.subtitle }}</p>
        <div class="cta">
          <el-button type="primary" size="large">{{ slide.cta }}</el-button>
        </div>
      </div>
    </section>

    <!-- 滑动指示器（底部小点） -->
    <div class="indicators">
      <span 
        v-for="(item, index) in slides" 
        :key="item.id" 
        :class="{ active: currentSlide === index }"
        @click="jumpToSlide(index)"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const slides = [
  {
    id: 1,
    eyebrow: 'iCLO EXHIBITION · 2024',
    title: '全球精选时尚服饰',
    subtitle: '品质与设计的平衡，焕新都市衣橱',
    cta: '探索品牌',
    image: 'https://images.unsplash.com/photo-1490111718993-d98654ce6cf7?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 2,
    eyebrow: 'SUMMER CAPSULE',
    title: '热浪系列 · 轻盈登场',
    subtitle: '高定面料与夏日廓形，演绎高级松弛感',
    cta: '即刻选购',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1920&q=80'
  },
  {
    id: 3,
    eyebrow: 'URBAN ATELIER',
    title: '秋冬廓形 · 重塑比例',
    subtitle: '以建筑线条定义力量，呈现利落气场',
    cta: '查看系列',
    image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1920&q=80'
  }
]

// 当前显示的海报索引
const currentSlide = ref(0)
const totalSlides = slides.length

// 处理鼠标滚轮事件（上下滑动切换海报）
const handleWheel = (e) => {
  // 向上滚动（滚轮 deltaY 为负）→ 切换到上一张
  if (e.deltaY < 0 && currentSlide.value > 0) {
    currentSlide.value--
  }
  // 向下滚动（滚轮 deltaY 为正）→ 切换到下一张
  if (e.deltaY > 0 && currentSlide.value < totalSlides - 1) {
    currentSlide.value++
  }
  // 滚动到对应海报位置
  scrollToSlide()
}

const jumpToSlide = (index) => {
  currentSlide.value = index
  scrollToSlide()
}

// 滚动到当前选中的海报
const scrollToSlide = () => {
  const slideHeight = window.innerHeight // 屏幕高度 = 海报高度
  window.scrollTo({
    top: slideHeight * currentSlide.value,
    behavior: 'smooth' // 平滑滚动效果
  })
}

// 监听页面滚动，同步当前海报索引（避免手动拖动滚动条时索引不一致）
const handleScroll = () => {
  const scrollTop = window.scrollY
  const slideHeight = window.innerHeight
  // 计算当前可见的海报索引（四舍五入）
  const currentIndex = Math.round(scrollTop / slideHeight)
  // 限制索引范围（0-2）
  if (currentIndex >= 0 && currentIndex <= totalSlides - 1) {
    currentSlide.value = currentIndex
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* 全屏容器 */
.fullscreen-carousel {
  width: 100%;
  overflow: hidden;
}

/* 单张海报（高度等于屏幕高度） */
.slide {
  width: 100%;
  height: 100vh; /* 100%视口高度，覆盖全屏 */
  position: relative;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  color: #fff;
}

.slide-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(110deg, rgba(9, 9, 9, 0.75) 0%, rgba(9, 9, 9, 0.15) 60%);
}

/* 海报文字内容 */
.slide-content {
  position: relative;
  max-width: 560px;
  margin-left: 10%;
  z-index: 2;
}

.eyebrow {
  letter-spacing: 0.35em;
  text-transform: uppercase;
  font-size: 14px;
  margin-bottom: 24px;
  color: rgba(255,255,255,0.7);
}

.slide-content h2 {
  font-size: clamp(36px, 5vw, 66px);
  margin-bottom: 20px;
  font-weight: 600;
  line-height: 1.2;
}

.slide-content .subtitle {
  font-size: clamp(16px, 1.5vw, 22px);
  margin-bottom: 40px;
  color: rgba(255,255,255,0.85);
}

.cta .el-button {
  padding: 0 36px;
  height: 48px;
  border-radius: 999px;
  font-size: 16px;
  box-shadow: 0 8px 24px rgba(3, 86, 252, 0.4);
}

/* 底部指示器（小点） */
.indicators {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 100;
}

.indicators span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: background 0.3s;
}

.indicators span.active {
  background: white;
  width: 30px;
  border-radius: 6px; /* 激活状态变成长条形 */
}
</style>