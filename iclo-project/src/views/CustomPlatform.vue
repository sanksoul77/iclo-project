<template>
  <div class="custom-platform">
    <!-- 左侧：品类与款式 -->
    <aside class="panel category-panel">
      <header class="panel-header">
        <h2>定制品类</h2>
        <p>挑选基础款，开始创作</p>
      </header>
      <div
        v-for="category in categories"
        :key="category.name"
        class="category-block"
      >
        <div class="category-title">
          <span>{{ category.name }}</span>
          <small>{{ category.items.length }} 款</small>
        </div>
        <div class="item-grid">
          <button
            v-for="item in category.items"
            :key="item.id"
            class="item-card"
            :class="{ active: selectedItem?.id === item.id }"
            @click="selectItem(item)"
          >
            <img :src="item.thumbnail" :alt="item.name" @error="handleImageError">
            <span>{{ item.name }}</span>
          </button>
        </div>
      </div>
    </aside>

    <!-- 中间：展示舞台 -->
    <section class="panel preview-panel">
      <header class="panel-header">
        <div>
          <h2>展示舞台</h2>
          <p>{{ selectedItem?.name || '请选择一件基础服饰' }}</p>
        </div>
        <div class="preview-actions">
          <el-button size="small" @click="resetPatterns" :disabled="!patternInstances.length">清空纹饰</el-button>
          <el-button size="small" type="primary" @click="captureDesign" :disabled="!selectedItem">导出预览</el-button>
          <el-button size="small" type="success" :disabled="!selectedItem" @click="openDraftDialog">
            保存草稿
          </el-button>
          <el-button size="small" type="warning" :disabled="!selectedItem" @click="openOrderDialog">
            下单
          </el-button>
        </div>
      </header>
      <div class="preview-stage" ref="stageRef">
        <template v-if="selectedItem">
          <img :src="selectedItem.preview" class="garment-base" alt="base garment" @error="handleImageError">
          <div
            class="color-overlay"
            :class="getColorClass(selectedColor)"
            :style="{ backgroundColor: selectedColor }"
          ></div>
          <transition-group name="pattern-fade" tag="div">
            <div
              v-for="instance in patternInstances"
              :key="instance.id"
              class="pattern-instance"
              :class="{ selected: activePatternId === instance.id }"
              :style="patternStyle(instance)"
              @mousedown.stop="startDrag(instance.id, $event)"
              @click.stop="activePatternId = instance.id"
            >
              <img 
              :src="instance.icon" 
              :alt="instance.name"
              :style="getPatternImageStyle(instance.color)"
            >
              <div class="pattern-controls" v-if="activePatternId === instance.id">
                <button @click.stop="duplicatePattern(instance.id)">复制</button>
                <button @click.stop="changeScale(instance.id, 0.1)">放大</button>
                <button @click.stop="changeScale(instance.id, -0.1)">缩小</button>
                <button class="danger" @click.stop="removePattern(instance.id)">删除</button>
              </div>
              <span
                class="resize-handle"
                @mousedown.stop="startResize(instance.id, $event)"
              ></span>
            </div>
          </transition-group>
        </template>
        <div v-else class="empty-preview">
          请选择左侧服饰开始设计
        </div>
      </div>
    </section>

    <!-- 右侧：颜色与纹饰 -->
    <aside class="panel tools-panel">
      <header class="panel-header">
        <h2>风格工具</h2>
        <p>选择颜色与纹饰，赋予服饰个性</p>
      </header>

      <section class="tool-block" v-if="selectedItem">
        <div class="block-header">
          <h3>颜色选择</h3>
          <span>{{ getColorName(selectedColor) }}</span>
        </div>
        <div class="color-grid">
          <div class="color-row">
            <button
              v-for="color in colorPalette[0]"
              :key="color"
              class="color-dot"
              :style="{ backgroundColor: color, borderColor: color === '#ffffff' ? '#e0e0e0' : '#fff' }"
              :class="{ active: color === selectedColor }"
              @click="selectedColor = color"
              :title="getColorName(color)"
            ></button>
          </div>
        </div>
        <div class="color-names">
          <div class="color-name-item" v-for="color in colorPalette[0]" :key="color">
            <span class="color-name-dot" :style="{ backgroundColor: color, borderColor: color === '#ffffff' ? '#e0e0e0' : '#fff' }"></span>
            <span>{{ getColorName(color) }}</span>
          </div>
        </div>
      </section>
      <section class="tool-block" v-else>
        <div class="block-header">
          <h3>颜色选择</h3>
        </div>
        <p class="color-hint">请先选择一件物品</p>
      </section>

      <section class="tool-block">
        <div class="block-header with-action">
          <div>
            <h3>纹饰库</h3>
            <span class="meta">点击添加至服饰</span>
          </div>
          <div class="header-actions">
            <el-button size="small" text @click="openCreateCollectionDialog">新建集合</el-button>
            <el-button size="small" text @click="triggerPatternUpload">上传纹饰</el-button>
          </div>
        </div>
        <input
          type="file"
          ref="patternInputRef"
          class="hidden-upload-input"
          accept="image/*"
          @change="handlePatternUpload"
        >
        
        <!-- 集合列表 -->
        <div class="collections-list" v-if="patternCollections.length > 0">
          <div
            v-for="collection in patternCollections"
            :key="collection.id"
            class="collection-item"
          >
            <div class="collection-header" @click="toggleCollection(collection.id)">
              <span class="collection-name">{{ collection.name }}</span>
              <span class="collection-count">({{ collection.patterns.length }})</span>
              <el-icon class="collection-arrow" :class="{ expanded: expandedCollections.includes(collection.id) }">
                <ArrowDown />
              </el-icon>
            </div>
            <div v-if="expandedCollections.includes(collection.id)" class="collection-patterns">
              <div class="pattern-grid">
                <button
                  v-for="pattern in collection.patterns"
                  :key="pattern.id"
                  class="pattern-card"
                  @click="addPattern(pattern)"
                >
                  <img :src="pattern.icon" :alt="pattern.name">
                  <span>{{ pattern.name }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 普通纹饰列表 -->
        <div class="pattern-grid">
          <button
            v-for="pattern in availablePatterns"
            :key="pattern.id"
            class="pattern-card"
            @click="addPattern(pattern)"
          >
            <img :src="pattern.icon" :alt="pattern.name">
            <span>{{ pattern.name }}</span>
          </button>
        </div>
      </section>

      <section class="tool-block" v-if="activePattern">
        <div class="block-header">
          <h3>纹饰详情</h3>
          <span>#{{ activePattern.name }}</span>
        </div>
        <div class="pattern-detail">
          <div class="detail-section">
            <label class="detail-label">大小</label>
            <el-slider
              v-model="activePattern.scale"
              :min="0.3"
              :max="2"
              :step="0.05"
              @input="updatePatternScale"
            />
          </div>
          <div class="detail-section">
            <label class="detail-label">颜色</label>
            <div class="color-picker-section">
              <div class="rgb-inputs">
                <div class="rgb-input-group">
                  <label>R</label>
                  <el-input-number
                    v-model="activePattern.color.r"
                    :min="0"
                    :max="255"
                    size="small"
                    @change="updatePatternColor"
                  />
                </div>
                <div class="rgb-input-group">
                  <label>G</label>
                  <el-input-number
                    v-model="activePattern.color.g"
                    :min="0"
                    :max="255"
                    size="small"
                    @change="updatePatternColor"
                  />
                </div>
                <div class="rgb-input-group">
                  <label>B</label>
                  <el-input-number
                    v-model="activePattern.color.b"
                    :min="0"
                    :max="255"
                    size="small"
                    @change="updatePatternColor"
                  />
                </div>
              </div>
              <div class="color-preview" :style="{ backgroundColor: getPatternColorString(activePattern.color) }"></div>
            </div>
          </div>
          <div class="detail-actions">
            <el-button size="small" @click="duplicatePattern(activePattern.id)">复制</el-button>
            <el-button size="small" @click="centerPattern(activePattern.id)">居中</el-button>
            <el-button size="small" type="danger" @click="removePattern(activePattern.id)">删除</el-button>
          </div>
        </div>
      </section>
    </aside>
  </div>

  <el-dialog
    v-model="showColorModal"
    title="编辑颜色"
    width="520px"
    align-center
    @close="closeColorDialog"
  >
    <div class="color-dialog">
      <div class="dialog-preview" :style="{ backgroundColor: selectedColor }"></div>
      <p class="dialog-text">使用系统取色器选择任意颜色，点击确定后自动应用。</p>
      <div class="dialog-actions">
        <el-button type="primary" @click="triggerColorPicker">打开取色器</el-button>
        <el-button @click="closeColorDialog">关闭</el-button>
      </div>
    </div>
  </el-dialog>

  <!-- 新建集合对话框 -->
  <el-dialog
    v-model="createCollectionDialogVisible"
    title="新建纹饰集合"
    width="500px"
    align-center
  >
    <el-form :model="collectionForm" label-width="80px">
      <el-form-item label="集合名称" required>
        <el-input v-model="collectionForm.name" placeholder="如：玫瑰系列字母集"></el-input>
      </el-form-item>
      <el-form-item label="选择纹饰">
        <div class="collection-pattern-selector">
          <div
            v-for="pattern in allPatternsForCollection"
            :key="pattern.id"
            class="pattern-select-item"
            :class="{ selected: collectionForm.selectedPatterns.includes(pattern.id) }"
            @click="togglePatternInCollection(pattern.id)"
          >
            <img :src="pattern.icon" :alt="pattern.name">
            <span>{{ pattern.name }}</span>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="createCollectionDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleCreateCollection">创建</el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="draftDialogVisible"
    title="保存到草稿箱"
    width="460px"
    align-center
  >
    <el-form :model="draftForm" label-width="80px">
      <el-form-item label="草稿名称">
        <el-input v-model="draftForm.title" placeholder="如：风衣裙定制方案"></el-input>
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="draftForm.desc"
          type="textarea"
          rows="3"
          placeholder="可记录搭配思路、选择颜色等信息"
        ></el-input>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="draftDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="savingDraft" @click="handleDraftSave">
        {{ editingDraftId ? '更新草稿' : '保存草稿' }}
      </el-button>
    </template>
  </el-dialog>

  <el-dialog
    v-model="orderDialogVisible"
    title="提交订单"
    width="520px"
    align-center
  >
    <el-form :model="orderForm" label-width="90px">
      <el-form-item label="商品信息">
        <div class="order-item-preview">
          <img :src="selectedItem?.preview" alt="商品预览" class="preview-img">
          <div class="preview-info">
            <div class="preview-title">{{ selectedItem?.name }}</div>
            <div class="preview-desc">定制颜色：{{ selectedColor }}</div>
            <div class="preview-desc" v-if="patternInstances.length > 0">
              纹饰数量：{{ patternInstances.length }} 个
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
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { addDraft, getDraftById, upsertDraft } from '../utils/draftStorage'
import { addOrder } from '../utils/orderStorage'

// 生成白色服饰图片的辅助函数 - 使用SVG Data URL，包含简单轮廓
const getWhiteImageUrl = (width = 400, height = 600, type = 'tshirt') => {
  // 根据类型生成不同的服饰轮廓
  let shape = ''
  if (type === 'tshirt' || type === 'polo') {
    // T恤/Polo衫轮廓
    shape = `<path d="M ${width*0.2} ${height*0.15} Q ${width*0.5} ${height*0.1} ${width*0.8} ${height*0.15} L ${width*0.85} ${height*0.4} L ${width*0.7} ${height*0.6} L ${width*0.3} ${height*0.6} L ${width*0.15} ${height*0.4} Z" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.15} ${height*0.4} L ${width*0.15} ${height*0.9} M ${width*0.85} ${height*0.4} L ${width*0.85} ${height*0.9}" stroke="#e0e0e0" stroke-width="2"/>`
  } else if (type === 'dress') {
    // 连衣裙轮廓
    shape = `<path d="M ${width*0.2} ${height*0.1} Q ${width*0.5} ${height*0.05} ${width*0.8} ${height*0.1} L ${width*0.85} ${height*0.35} L ${width*0.7} ${height*0.5} L ${width*0.3} ${height*0.5} L ${width*0.15} ${height*0.35} Z" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.3} ${height*0.5} Q ${width*0.5} ${height*0.6} ${width*0.7} ${height*0.5} L ${width*0.75} ${height*0.95} L ${width*0.25} ${height*0.95} Z" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>`
  } else if (type === 'hoodie') {
    // 卫衣轮廓（带帽子）
    shape = `<path d="M ${width*0.2} ${height*0.1} Q ${width*0.5} ${height*0.05} ${width*0.8} ${height*0.1} L ${width*0.85} ${height*0.4} L ${width*0.7} ${height*0.6} L ${width*0.3} ${height*0.6} L ${width*0.15} ${height*0.4} Z" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.2} ${height*0.1} Q ${width*0.3} ${height*0.05} ${width*0.4} ${height*0.08} Q ${width*0.5} ${height*0.03} ${width*0.6} ${height*0.08} Q ${width*0.7} ${height*0.05} ${width*0.8} ${height*0.1}" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.15} ${height*0.4} L ${width*0.15} ${height*0.9} M ${width*0.85} ${height*0.4} L ${width*0.85} ${height*0.9}" stroke="#e0e0e0" stroke-width="2"/>`
  } else if (type === 'cap') {
    // 帽子轮廓
    shape = `<ellipse cx="${width*0.5}" cy="${height*0.4}" rx="${width*0.4}" ry="${height*0.15}" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.1} ${height*0.4} Q ${width*0.5} ${height*0.2} ${width*0.9} ${height*0.4}" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <rect x="${width*0.45}" y="${height*0.4}" width="${width*0.1}" height="${height*0.3}" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>`
  } else if (type === 'bag') {
    // 包轮廓
    shape = `<rect x="${width*0.2}" y="${height*0.2}" width="${width*0.6}" height="${height*0.6}" rx="8" fill="#f0f0f0" stroke="#e0e0e0" stroke-width="2"/>
      <path d="M ${width*0.25} ${height*0.2} Q ${width*0.3} ${height*0.15} ${width*0.35} ${height*0.2} M ${width*0.65} ${height*0.2} Q ${width*0.7} ${height*0.15} ${width*0.75} ${height*0.2}" stroke="#e0e0e0" stroke-width="2" fill="none"/>`
  }
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#ffffff"/>
    ${shape}
  </svg>`
  // 使用URL编码而不是base64，更兼容
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const categories = [
  {
    name: '基础系列',
    items: [
      {
        id: 'basic-01',
        name: '圆领短袖T恤',
        thumbnail: getWhiteImageUrl(280, 350, 'tshirt'),
        preview: getWhiteImageUrl(800, 1000, 'tshirt')
      },
      {
        id: 'basic-02',
        name: '圆领长袖T恤',
        thumbnail: getWhiteImageUrl(280, 350, 'tshirt'),
        preview: getWhiteImageUrl(800, 1000, 'tshirt')
      },
      {
        id: 'basic-03',
        name: '戴帽长袖卫衣',
        thumbnail: getWhiteImageUrl(280, 350, 'hoodie'),
        preview: getWhiteImageUrl(800, 1000, 'hoodie')
      }
    ]
  },
  {
    name: '女装系列',
    items: [
      {
        id: 'women-01',
        name: '连衣裙',
        thumbnail: getWhiteImageUrl(280, 350, 'dress'),
        preview: getWhiteImageUrl(800, 1000, 'dress')
      }
    ]
  },
  {
    name: '男装系列',
    items: [
      {
        id: 'men-01',
        name: 'polo衫',
        thumbnail: getWhiteImageUrl(280, 350, 'polo'),
        preview: getWhiteImageUrl(800, 1000, 'polo')
      }
    ]
  },
  {
    name: '配饰系列',
    items: [
      {
        id: 'accessory-01',
        name: '鸭嘴帽',
        thumbnail: getWhiteImageUrl(280, 280, 'cap'),
        preview: getWhiteImageUrl(800, 800, 'cap')
      },
      {
        id: 'accessory-02',
        name: '渔夫帽',
        thumbnail: getWhiteImageUrl(280, 280, 'cap'),
        preview: getWhiteImageUrl(800, 800, 'cap')
      },
      {
        id: 'accessory-03',
        name: '单肩帆布包',
        thumbnail: getWhiteImageUrl(280, 350, 'bag'),
        preview: getWhiteImageUrl(800, 1000, 'bag')
      }
    ]
  }
]

const patternLibrary = [
  {
    id: 'pattern-01',
    name: '几何线条',
    icon: 'https://img.icons8.com/fluency/96/triangle-stroked.png'
  },
  {
    id: 'pattern-02',
    name: '星芒',
    icon: 'https://img.icons8.com/fluency/96/star.png'
  },
  {
    id: 'pattern-03',
    name: '花瓣',
    icon: 'https://img.icons8.com/fluency/96/flower-doodle.png'
  },
  {
    id: 'pattern-04',
    name: '箭头',
    icon: 'https://img.icons8.com/fluency/96/long-arrow-down.png'
  },
  {
    id: 'pattern-05',
    name: '笑脸',
    icon: 'https://img.icons8.com/fluency/96/lol.png'
  }
]

// 生成24字母的玫瑰系列（A-X，去掉I和O）
const generateRoseAlphabetSeries = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ' // 24个字母，去掉I和O
  return letters.split('').map((letter, index) => ({
    id: `rose-letter-${letter.toLowerCase()}`,
    name: `字母 ${letter}`,
    icon: generateLetterIcon(letter) // 生成字母图标
  }))
}

// 生成字母图标（使用SVG）
const generateLetterIcon = (letter) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" fill="#ff69b4" opacity="0.1"/>
    <text x="48" y="48" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ff69b4" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

// 创建玫瑰系列字母集
const roseAlphabetCollection = {
  id: 'rose-alphabet-collection',
  name: '玫瑰系列字母集',
  patterns: generateRoseAlphabetSeries()
}

// 只显示黑白灰三种颜色
const colorPalette = [
  ['#000000', '#808080', '#ffffff'] // 黑色、灰色、白色
]

const router = useRouter()
const route = useRoute()
const flatItems = categories.flatMap(category => category.items)

const selectedItem = ref(null)
const selectedColor = ref('#ffffff')
const patternInstances = ref([])
const activePatternId = ref(null)
const stageRef = ref(null)
const colorInputRef = ref(null)
const showColorModal = ref(false)
const customPatterns = ref([])
const patternInputRef = ref(null)

// 集合相关状态
const patternCollections = ref([roseAlphabetCollection])
const expandedCollections = ref([roseAlphabetCollection.id])
const createCollectionDialogVisible = ref(false)
const collectionForm = reactive({
  name: '',
  selectedPatterns: []
})

// 计算属性
const availablePatterns = computed(() => [...patternLibrary, ...customPatterns.value])
const allPatternsForCollection = computed(() => [...patternLibrary, ...customPatterns.value])

const draftDialogVisible = ref(false)
const draftForm = reactive({
  title: '',
  desc: ''
})
const savingDraft = ref(false)
const editingDraftId = ref(null)

const orderDialogVisible = ref(false)
const orderForm = reactive({
  size: 'M',
  quantity: 1,
  address: '',
  phone: '',
  remark: '',
  price: 399 // 默认价格
})
const submittingOrder = ref(false)

let pointerState = null

const selectItem = (item) => {
  selectedItem.value = item
  patternInstances.value = []
  activePatternId.value = null
  // 默认选择白色
  selectedColor.value = '#ffffff'
}

// 图片加载错误处理
const handleImageError = (event) => {
  // 如果图片加载失败，创建一个简单的白色占位图
  const canvas = document.createElement('canvas')
  canvas.width = 280
  canvas.height = 350
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 2
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
  event.target.src = canvas.toDataURL('image/png')
}

// 获取颜色名称
const getColorName = (color) => {
  const colorMap = {
    '#000000': '黑色',
    '#808080': '灰色',
    '#ffffff': '白色'
  }
  return colorMap[color] || color
}

// 获取颜色类名
const getColorClass = (color) => {
  if (color === '#ffffff') return 'color-white'
  if (color === '#000000') return 'color-black'
  if (color === '#808080') return 'color-gray'
  return ''
}

const openColorDialog = () => {
  showColorModal.value = true
  requestAnimationFrame(() => {
    triggerColorPicker()
  })
}

const closeColorDialog = () => {
  showColorModal.value = false
}

const triggerColorPicker = () => {
  colorInputRef.value?.click()
}

const addPattern = (pattern) => {
  if (!selectedItem.value) {
    ElMessage.warning('请先选择一件服饰')
    return
  }
  const id = `${pattern.id}-${Date.now()}`
  patternInstances.value.push({
    id,
    name: pattern.name,
    icon: pattern.icon,
    x: 40 + Math.random() * 20,
    y: 30 + Math.random() * 20,
    scale: 0.9,
    color: { r: 0, g: 0, b: 0 } // 默认黑色
  })
  activePatternId.value = id
}

const patternStyle = (instance) => {
  const color = instance.color || { r: 0, g: 0, b: 0 }
  const colorString = `rgb(${color.r}, ${color.g}, ${color.b})`
  return {
    left: `${instance.x}%`,
    top: `${instance.y}%`,
    transform: `translate(-50%, -50%) scale(${instance.scale})`,
    filter: `drop-shadow(0 0 0 ${colorString})`,
    '--pattern-color': colorString
  }
}

// 获取纹饰颜色字符串
const getPatternColorString = (color) => {
  if (!color) return 'rgb(0, 0, 0)'
  return `rgb(${color.r}, ${color.g}, ${color.b})`
}

// 获取纹饰图片样式（应用颜色）
const getPatternImageStyle = (color) => {
  if (!color) return {}
  const { r, g, b } = color
  // 使用CSS filter来应用颜色
  // 将图片转为单色，然后应用目标颜色
  const brightness = (r + g + b) / 765
  const hue = getHueFromRGB(r, g, b)
  return {
    filter: `brightness(0) saturate(100%) invert(${brightness}) sepia(1) saturate(2) hue-rotate(${hue}deg)`
  }
}

// 从RGB计算色相
const getHueFromRGB = (r, g, b) => {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  
  if (max === min) {
    h = 0
  } else if (max === r) {
    h = ((g - b) / (max - min)) % 6
  } else if (max === g) {
    h = (b - r) / (max - min) + 2
  } else {
    h = (r - g) / (max - min) + 4
  }
  
  h = Math.round(h * 60)
  if (h < 0) h += 360
  return h
}

// 更新纹饰颜色
const updatePatternColor = () => {
  // 颜色更新会自动通过v-model同步
}

const triggerPatternUpload = () => {
  patternInputRef.value?.click()
}

const handlePatternUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    event.target.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    customPatterns.value.push({
      id: `custom-pattern-${Date.now()}`,
      name: file.name.replace(/\.\w+$/, ''),
      icon: reader.result
    })
    ElMessage.success('纹饰已上传，可在列表中选择使用')
    event.target.value = ''
  }
  reader.readAsDataURL(file)
}

// 集合相关方法
const openCreateCollectionDialog = () => {
  collectionForm.name = ''
  collectionForm.selectedPatterns = []
  createCollectionDialogVisible.value = true
}

const togglePatternInCollection = (patternId) => {
  const index = collectionForm.selectedPatterns.indexOf(patternId)
  if (index > -1) {
    collectionForm.selectedPatterns.splice(index, 1)
  } else {
    collectionForm.selectedPatterns.push(patternId)
  }
}

const handleCreateCollection = () => {
  if (!collectionForm.name.trim()) {
    ElMessage.warning('请输入集合名称')
    return
  }
  if (collectionForm.selectedPatterns.length === 0) {
    ElMessage.warning('请至少选择一个纹饰')
    return
  }
  
  const allPatterns = [...patternLibrary, ...customPatterns.value]
  const selectedPatterns = allPatterns.filter(p => 
    collectionForm.selectedPatterns.includes(p.id)
  )
  
  const newCollection = {
    id: `collection-${Date.now()}`,
    name: collectionForm.name,
    patterns: selectedPatterns
  }
  
  patternCollections.value.push(newCollection)
  expandedCollections.value.push(newCollection.id)
  createCollectionDialogVisible.value = false
  ElMessage.success('集合创建成功')
}

const toggleCollection = (collectionId) => {
  const index = expandedCollections.value.indexOf(collectionId)
  if (index > -1) {
    expandedCollections.value.splice(index, 1)
  } else {
    expandedCollections.value.push(collectionId)
  }
}

const startDrag = (id, event) => {
  pointerState = {
    type: 'drag',
    id,
    startX: event.clientX,
    startY: event.clientY,
    origin: { ...findPattern(id) }
  }
  attachPointerListeners()
}

const startResize = (id, event) => {
  pointerState = {
    type: 'resize',
    id,
    startX: event.clientX,
    originScale: findPattern(id).scale
  }
  attachPointerListeners()
}

const attachPointerListeners = () => {
  window.addEventListener('mousemove', handlePointerMove)
  window.addEventListener('mouseup', handlePointerUp)
}

const detachPointerListeners = () => {
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseup', handlePointerUp)
}

const handlePointerMove = (event) => {
  if (!pointerState) return
  const target = findPattern(pointerState.id)
  if (!target) return

  if (pointerState.type === 'drag') {
    const rect = stageRef.value?.getBoundingClientRect()
    if (!rect) return
    const deltaX = ((event.clientX - pointerState.startX) / rect.width) * 100
    const deltaY = ((event.clientY - pointerState.startY) / rect.height) * 100
    target.x = clamp(pointerState.origin.x + deltaX, 5, 95)
    target.y = clamp(pointerState.origin.y + deltaY, 5, 95)
  } else if (pointerState.type === 'resize') {
    const delta = (event.clientX - pointerState.startX) / 200
    target.scale = clamp(pointerState.originScale + delta, 0.3, 2)
  }
}

const handlePointerUp = () => {
  pointerState = null
  detachPointerListeners()
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const findPattern = (id) => patternInstances.value.find(item => item.id === id)

const changeScale = (id, delta) => {
  const target = findPattern(id)
  if (!target) return
  target.scale = clamp(target.scale + delta, 0.3, 2)
}

const removePattern = (id) => {
  patternInstances.value = patternInstances.value.filter(item => item.id !== id)
  if (activePatternId.value === id) {
    activePatternId.value = patternInstances.value.at(-1)?.id ?? null
  }
}

const duplicatePattern = (id) => {
  const original = findPattern(id)
  if (!original) return
  const newPattern = {
    ...original,
    id: `${original.id}-copy-${Date.now()}`,
    x: clamp(original.x + 5, 5, 95),
    y: clamp(original.y + 5, 5, 95)
  }
  patternInstances.value.push(newPattern)
  activePatternId.value = newPattern.id
}

const resetPatterns = () => {
  patternInstances.value = []
  activePatternId.value = null
}

const centerPattern = (id) => {
  const target = findPattern(id)
  if (!target) return
  target.x = 50
  target.y = 50
}

const activePattern = computed(() => {
  if (!activePatternId.value) return null
  return findPattern(activePatternId.value) || null
})

const updatePatternScale = () => {
  // v-model 已经实时更新，这里留空用于触发计算
}

const captureDesign = () => {
  ElMessage.success('示例环境下仅模拟导出，真实项目可使用 html2canvas 等方案')
}

const openDraftDialog = () => {
  if (!selectedItem.value) {
    ElMessage.warning('请先选择基础服饰')
    return
  }
  draftDialogVisible.value = true
}

const openOrderDialog = () => {
  if (!selectedItem.value) {
    ElMessage.warning('请先选择基础服饰')
    return
  }
  // 重置表单
  orderForm.size = 'M'
  orderForm.quantity = 1
  orderForm.address = ''
  orderForm.phone = ''
  orderForm.remark = ''
  orderForm.price = 399
  orderDialogVisible.value = true
}

const handleOrderSubmit = async () => {
  if (!selectedItem.value) {
    ElMessage.warning('请选择基础服饰')
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
      title: `${selectedItem.value.name}（定制）`,
      price: orderForm.price,
      quantity: orderForm.quantity,
      cover: selectedItem.value.preview,
      spec: {
        color: selectedColor.value,
        size: orderForm.size
      },
      createdAt: now.toISOString().slice(0, 19).replace('T', ' '),
      status: 'pending',
      statusText: '待付款',
      logistics: [],
      design: buildDesignPayload(),
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

const buildDesignPayload = () => ({
  baseItemId: selectedItem.value?.id,
  baseItemName: selectedItem.value?.name,
  preview: selectedItem.value?.preview,
  color: selectedColor.value,
  patterns: patternInstances.value.map(pattern => ({
    id: pattern.id,
    name: pattern.name,
    icon: pattern.icon,
    x: pattern.x,
    y: pattern.y,
    scale: pattern.scale,
    color: pattern.color || { r: 0, g: 0, b: 0 }
  }))
})

const handleDraftSave = async () => {
  if (!selectedItem.value) {
    ElMessage.warning('请选择基础服饰')
    return
  }
  savingDraft.value = true
  const payload = {
    id: editingDraftId.value || Date.now(),
    title: draftForm.title || `${selectedItem.value.name} 定制草稿`,
    desc: draftForm.desc || `主色：${selectedColor.value}`,
    type: 'custom',
    cover: selectedItem.value.preview,
    itemCount: patternInstances.value.length,
    updateTime: new Date().toLocaleString(),
    design: buildDesignPayload()
  }
  try {
    if (editingDraftId.value) {
      upsertDraft(payload)
    } else {
      addDraft(payload)
    }
    ElMessage.success(editingDraftId.value ? '草稿已更新' : '草稿已保存')
    draftDialogVisible.value = false
    if (!editingDraftId.value) {
      draftForm.title = ''
      draftForm.desc = ''
    }
    router.push('/draft-box')
  } finally {
    savingDraft.value = false
  }
}

const findBaseItemById = (id) => flatItems.find(item => item.id === id)

const loadDraftForEdit = () => {
  const draftId = route.query.draftId
  if (!draftId) {
    editingDraftId.value = null
    draftForm.title = ''
    draftForm.desc = ''
    return
  }
  const draft = getDraftById(draftId)
  if (!draft) {
    ElMessage.warning('未找到草稿，已返回草稿箱')
    router.replace({ path: '/custom-platform' })
    return
  }
  editingDraftId.value = draft.id
  draftForm.title = draft.title
  draftForm.desc = draft.desc
  if (draft.design) {
    selectedColor.value = draft.design.color || '#ffffff'
    const baseItem = findBaseItemById(draft.design.baseItemId) || {
      id: draft.design.baseItemId || `custom-${draft.id}`,
      name: draft.design.baseItemName || draft.title,
      thumbnail: draft.design.preview,
      preview: draft.design.preview
    }
    selectedItem.value = baseItem
    patternInstances.value = (draft.design.patterns || []).map((pattern, index) => ({
      ...pattern,
      id: pattern.id || `pattern-${index}-${Date.now()}`,
      color: pattern.color || { r: 0, g: 0, b: 0 }
    }))
    activePatternId.value = patternInstances.value[0]?.id ?? null
  }
}

watch(() => route.query.draftId, () => {
  loadDraftForEdit()
}, { immediate: true })

onMounted(() => {
  document.body.classList.add('custom-platform-page')
  window.addEventListener('mouseup', handlePointerUp)
})

onUnmounted(() => {
  document.body.classList.remove('custom-platform-page')
  detachPointerListeners()
  window.removeEventListener('mouseup', handlePointerUp)
})
</script>

<style scoped>
:global(body.custom-platform-page) {
  overflow: hidden;
  background: #f5f7fb;
}

.custom-platform {
  display: grid;
  grid-template-columns: 260px 1fr 280px;
  gap: 16px;
  padding: 80px 16px 16px;
  height: 100vh;
  background: linear-gradient(135deg, #f7f9fc 0%, #eef2f7 100%);
  box-sizing: border-box;
}

.panel {
  background: white;
  border-radius: 24px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.05);
  min-height: 0;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2329;
}

.panel-header p {
  margin: 2px 0 0;
  color: #7f8693;
  font-size: 12px;
}

.category-panel,
.tools-panel {
  overflow: hidden;
}

.category-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
}

.category-block + .category-block {
  margin-top: 16px;
}

.category-title {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #1f2329;
  margin-bottom: 12px;
}

.category-title small {
  color: #999;
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.item-card {
  border: 1px solid transparent;
  border-radius: 16px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: #f5f7fb;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.item-card img {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 10px;
}

.item-card.active {
  border-color: #3055ff;
  background: #edf1ff;
  box-shadow: 0 8px 24px rgba(48, 85, 255, 0.15);
}

.preview-panel {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.preview-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.preview-stage {
  position: relative;
  flex: 1;
  margin-top: 16px;
  border-radius: 24px;
  background: radial-gradient(circle at center, #fefefe, #dfe6f7);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.garment-base {
  width: auto;
  height: 95%;
  object-fit: contain;
  filter: grayscale(1) brightness(1.1);
  position: relative;
  z-index: 1;
}

.color-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 24px;
  z-index: 2;
}

.color-overlay.color-white {
  opacity: 0;
}

.color-overlay.color-black {
  opacity: 0.95;
  mix-blend-mode: multiply;
}

.color-overlay.color-gray {
  opacity: 0.75;
  mix-blend-mode: multiply;
}

.pattern-instance {
  position: absolute;
  cursor: grab;
  user-select: none;
}

.pattern-instance.selected {
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.15));
  z-index: 2;
}

.pattern-instance img {
  width: 80px;
  height: 80px;
  transition: filter 0.3s;
}

.pattern-controls {
  position: absolute;
  top: -36px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
}

.pattern-controls button {
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.pattern-controls .danger {
  color: #ff4d4f;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #3055ff;
  right: -6px;
  bottom: -6px;
  cursor: nwse-resize;
}

.empty-preview {
  color: #a0a7b6;
  font-size: 16px;
}

.tools-panel {
  gap: 12px;
  overflow-y: auto;
}

.tool-block {
  background: #f8f9fd;
  border-radius: 20px;
  padding: 16px;
}

.block-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  color: #1f2329;
  font-weight: 600;
}

.block-header .meta {
  display: block;
  font-size: 12px;
  color: #8a8fa3;
  font-weight: 400;
  margin-top: 2px;
}

.block-header.with-action {
  align-items: flex-start;
}

.block-header.with-action h3 {
  margin-bottom: 0;
}

.block-header.with-action :deep(.el-button) {
  margin-top: 2px;
}

 .color-grid {
   display: flex;
   flex-direction: column;
   gap: 10px;
   padding: 10px 6px 4px;
 }

 .color-row {
   display: flex;
   gap: 12px;
   justify-content: center;
   align-items: center;
 }

 .color-names {
   margin-top: 16px;
   display: flex;
   flex-direction: column;
   gap: 10px;
   padding: 12px;
   background: white;
   border-radius: 12px;
 }

 .color-name-item {
   display: flex;
   align-items: center;
   gap: 10px;
   font-size: 13px;
   color: #333;
 }

 .color-name-dot {
   width: 20px;
   height: 20px;
   border-radius: 50%;
   border: 2px solid #fff;
   box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
 }

 .color-hint {
   color: #999;
   font-size: 13px;
   text-align: center;
   padding: 20px;
 }

 .color-dot {
   width: 30px;
   height: 30px;
   border-radius: 50%;
   border: 2px solid #fff;
   box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
   cursor: pointer;
   transition: transform 0.2s, box-shadow 0.2s;
 }

 .color-dot.active {
   transform: scale(1.1);
   box-shadow: 0 0 0 3px rgba(48, 85, 255, 0.25);
 }

.custom-color {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  padding: 10px 16px;
  border-radius: 12px;
  gap: 12px;
  position: relative;
}

 .custom-color-label {
   display: flex;
   flex-direction: column;
   font-size: 13px;
   color: #7a7f8c;
 }

.custom-color :deep(.el-button) {
  border-radius: 20px;
}

.hidden-color-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  pointer-events: none;
}

.hidden-upload-input {
  display: none;
}

.color-dialog {
  text-align: center;
}

.dialog-preview {
  width: 120px;
  height: 120px;
  margin: 0 auto 12px;
  border-radius: 16px;
  border: 1px solid #e5e7f0;
  box-shadow: inset 0 6px 12px rgba(0, 0, 0, 0.08);
}

.dialog-text {
  font-size: 14px;
  color: #6c7381;
}

.dialog-actions {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  gap: 12px;
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

.pattern-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.pattern-card {
  border: none;
  border-radius: 16px;
  padding: 10px;
  background: white;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  color: #1f2329;
}

.pattern-card img {
  width: 60px;
  height: 60px;
}

.pattern-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(30, 60, 114, 0.15);
}

.pattern-detail {
  background: white;
  border-radius: 16px;
  padding: 16px;
}

.detail-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 集合相关样式 */
.header-actions {
  display: flex;
  gap: 8px;
}

.collections-list {
  margin-bottom: 16px;
}

.collection-item {
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.collection-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  gap: 8px;
}

.collection-header:hover {
  background-color: #f5f7fb;
}

.collection-name {
  font-weight: 600;
  color: #1f2329;
  flex: 1;
}

.collection-count {
  color: #8a8fa3;
  font-size: 12px;
}

.collection-arrow {
  transition: transform 0.3s;
  color: #8a8fa3;
}

.collection-arrow.expanded {
  transform: rotate(180deg);
}

.collection-patterns {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

/* 新建集合对话框样式 */
.collection-pattern-selector {
  max-height: 300px;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: #f8f9fd;
  border-radius: 12px;
}

.pattern-select-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.pattern-select-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pattern-select-item.selected {
  border-color: #3055ff;
  background: #edf1ff;
}

.pattern-select-item img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.pattern-select-item span {
  font-size: 12px;
  color: #333;
}

/* RGB颜色选择器样式 */
.detail-section {
  margin-bottom: 16px;
}

.detail-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.color-picker-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rgb-inputs {
  display: flex;
  gap: 12px;
  align-items: center;
}

.rgb-input-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.rgb-input-group label {
  font-size: 12px;
  color: #999;
  text-align: center;
}

.color-preview {
  width: 100%;
  height: 60px;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1280px) {
  .custom-platform {
    grid-template-columns: 260px 1fr;
    grid-template-rows: auto auto;
    height: auto;
    overflow: visible;
  }
  .tools-panel {
    grid-column: span 2;
    max-height: none;
  }
}

@media (max-width: 960px) {
  .custom-platform {
    grid-template-columns: 1fr;
  }
  .panel {
    min-height: auto;
  }
  .color-wheel {
    transform: scale(0.8);
  }
}
</style>

