<template>
  <div class="page-wrap">
    <!-- 草稿操作工具栏 -->
    <div class="draft-toolbar">
      <el-button 
        type="primary" 
        @click="showCreateDraft = true"
      >
        <el-icon><Plus /></el-icon>
        新建草稿
      </el-button>
    </div>

    <!-- 草稿列表 -->
    <div class="draft-list">
      <!-- 草稿项（循环渲染） -->
      <div class="draft-card" v-for="draft in filteredDrafts" :key="draft.id">
        <!-- 草稿缩略图 -->
        <div class="draft-img">
          <el-image
            :src="draft.cover"
            fit="cover"
            :lazy="true"
            loading="lazy"
          >
            <template #error>
              <div class="image-slot">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <span class="draft-tag">{{ getTypeText(draft.type) }}</span>
        </div>
        
        <!-- 草稿信息 -->
        <div class="draft-info">
          <h3 class="draft-title">{{ draft.title }}</h3>
          <p class="draft-desc">{{ draft.desc }}</p>
          <div class="draft-meta">
            <span>更新于 {{ draft.updateTime }}</span>
            <span>包含 {{ draft.itemCount }} 件商品</span>
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
        />
      </div>
    </div>

    <!-- 新建草稿弹窗 -->
    <el-dialog 
      title="新建草稿" 
      v-model="showCreateDraft" 
      width="500px"
    >
      <el-form :model="newDraft">
        <el-form-item label="草稿名称" required>
          <el-input v-model="newDraft.title"></el-input>
        </el-form-item>
        <el-form-item label="草稿类型" required>
          <el-radio-group v-model="newDraft.type">
            <el-radio label="clothing">成衣</el-radio>
            <el-radio label="article">文章</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="newDraft.desc" 
            type="textarea" 
            rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDraft = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="createDraft"
        >
          保存草稿
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Edit, Delete, Picture } from '@element-plus/icons-vue'

const route = useRoute()
const activeFilter = ref('all')

// 从 URL 查询参数中读取类型
const updateFilterFromRoute = () => {
  const type = route.query.type
  if (type && ['clothing', 'article'].includes(type)) {
    activeFilter.value = type
  } else {
    activeFilter.value = 'all'
  }
}

onMounted(() => {
  updateFilterFromRoute()
})

// 监听路由变化
watch(() => route.query.type, () => {
  updateFilterFromRoute()
})

// 模拟草稿数据
const drafts = ref([
  {
    id: 1,
    title: '春季成衣搭配方案',
    desc: '白色衬衫+卡其裤+乐福鞋，适合办公室通勤',
    cover: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=200&fit=crop&q=80',
    type: 'clothing', // 成衣
    itemCount: 3,
    updateTime: '2025-11-08'
  },
  {
    id: 2,
    title: '时尚穿搭文章草稿',
    desc: '关于秋冬季节如何搭配出时尚感的文章',
    cover: 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?w=300&h=200&fit=crop&q=80',
    type: 'article', // 文章
    itemCount: 0,
    updateTime: '2025-11-05'
  },
  {
    id: 3,
    title: '冬季成衣收藏',
    desc: '羽绒服、毛呢大衣等冬季保暖外套',
    cover: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=300&h=200&fit=crop&q=80',
    type: 'clothing',
    itemCount: 5,
    updateTime: '2025-11-01'
  },
  {
    id: 4,
    title: '穿搭技巧分享',
    desc: '如何通过配饰提升整体造型',
    cover: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=200&fit=crop&q=80',
    type: 'article',
    itemCount: 0,
    updateTime: '2025-10-28'
  }
])

// 筛选后的草稿
const filteredDrafts = computed(() => {
  if (activeFilter.value === 'all') {
    return drafts.value
  }
  return drafts.value.filter(draft => draft.type === activeFilter.value)
})

// 获取类型文本
const getTypeText = (type) => {
  return type === 'clothing' ? '成衣' : '文章'
}

// 新建草稿弹窗控制
const showCreateDraft = ref(false)
// 新草稿数据
const newDraft = ref({
  title: '',
  type: 'clothing',
  desc: ''
})

// 创建草稿
const createDraft = () => {
  if (!newDraft.value.title.trim()) {
    ElMessage.warning('请输入草稿名称')
    return
  }
  drafts.value.unshift({
    id: Date.now(), // 用时间戳作为唯一ID
    title: newDraft.value.title,
    desc: newDraft.value.desc,
    type: newDraft.value.type,
    cover: newDraft.value.type === 'clothing' 
      ? 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=200&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1472417583565-62e7bdeda490?w=300&h=200&fit=crop&q=80',
    itemCount: 0,
    updateTime: new Date().toLocaleDateString('zh-CN')
  })
  // 重置表单并关闭弹窗
  newDraft.value = { title: '', type: 'clothing', desc: '' }
  showCreateDraft.value = false
  ElMessage.success('草稿已保存')
}

// 编辑草稿
const editDraft = (id) => {
  ElMessage.info(`编辑草稿 #${id}`)
  // 实际项目中可跳转到编辑页面
}

// 删除草稿
const deleteDraft = (id) => {
  drafts.value = drafts.value.filter(draft => draft.id !== id)
  ElMessage.success('草稿已删除')
}
</script>

<style scoped>
.page-wrap {
  padding: 0;
}

.draft-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 16px;
}

.draft-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.draft-card {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.draft-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.draft-img {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.draft-img :deep(.el-image) {
  width: 100%;
  height: 100%;
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
  -webkit-line-clamp: 2;
  line-clamp: 2;
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

@media (max-width: 640px) {
  .draft-list {
    grid-template-columns: 1fr;
  }
  
  .draft-card {
    flex-direction: column;
  }
  
  .draft-img {
    width: 100%;
    height: 200px;
    margin-bottom: 12px;
  }
  
  .draft-info {
    margin: 0 0 12px 0;
  }
  
  .draft-actions {
    flex-direction: row;
    justify-content: flex-end;
  }
}
</style>

