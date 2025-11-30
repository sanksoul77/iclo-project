<template>
  <div class="publish-work">
    <h2 class="page-title">发布作品</h2>

    <el-card class="editor-card">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="92px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" maxlength="50" show-word-limit placeholder="输入作品标题" />
        </el-form-item>

        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类">
            <el-option v-for="cat in categories" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select v-model="form.tags" multiple filterable allow-create default-first-option placeholder="输入或选择标签">
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>

        <el-tabs v-model="activeTab" class="edit-tabs">
          <el-tab-pane label="文字编辑" name="text">
            <el-form-item label="正文" prop="content">
              <el-input
                v-model="form.content"
                type="textarea"
                :autosize="{ minRows: 8, maxRows: 20 }"
                placeholder="输入作品描述、搭配思路、材质信息等"
              />
            </el-form-item>
          </el-tab-pane>

          <el-tab-pane label="图片编辑" name="images">
            <el-form-item label="封面图" prop="cover">
              <el-upload
                class="cover-uploader"
                :auto-upload="false"
                :limit="1"
                :on-change="onSelectCover"
                accept="image/*"
                list-type="picture-card"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">建议尺寸 1200x800，JPG/PNG，≤ 5MB</div>
                </template>
              </el-upload>
              <img v-if="form.cover" :src="form.cover" class="cover-preview" />
            </el-form-item>

            <el-form-item label="图集">
              <el-upload
                class="gallery-uploader"
                :auto-upload="false"
                multiple
                :on-change="onSelectGallery"
                accept="image/*"
                list-type="picture-card"
              >
                <el-icon><Plus /></el-icon>
                <template #tip>
                  <div class="el-upload__tip">可上传多张细节或上身图，单张 ≤ 5MB</div>
                </template>
              </el-upload>
              <div class="gallery-preview" v-if="form.gallery.length">
                <img v-for="(g, idx) in form.gallery" :key="idx" :src="g" />
              </div>
            </el-form-item>
          </el-tab-pane>
        </el-tabs>

        <div class="actions">
          <el-button @click="onSaveDraft">保存到草稿箱</el-button>
          <el-button type="primary" @click="onPublish">发布作品</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
  </template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const categories = ['女装上衣', '女装裙装', '男装上衣', '男装裤装', '配饰', '运动', '童装']
const allTags = ['复古', '极简', '通勤', '学院风', '街头', '法式', '运动风']

const formRef = ref(null)
const activeTab = ref('text')
const form = reactive({
  title: '',
  category: '',
  tags: [],
  content: '',
  cover: '',
  gallery: []
})

const rules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入正文内容', trigger: 'blur' }],
  cover: [{ required: true, message: '请上传封面图', trigger: 'change' }]
}

const readFileAsDataURL = (raw) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(String(e.target?.result || ''))
    reader.readAsDataURL(raw)
  })
}

const onSelectCover = async (file) => {
  form.cover = await readFileAsDataURL(file.raw)
}

const onSelectGallery = async (file) => {
  const url = await readFileAsDataURL(file.raw)
  form.gallery.push(url)
}

const onSaveDraft = () => {
  // 模拟保存草稿
  ElMessage.success('已保存到草稿箱')
  router.push('/draft-box')
}

const onPublish = () => {
  formRef.value?.validate((valid) => {
    if (!valid) return
    // 模拟发布成功，跳回社区页
    ElMessage.success('发布成功')
    router.push('/community')
  })
}
</script>

<style scoped>
.publish-work {
  padding: 100px 24px 40px;
  max-width: 960px;
  margin: 0 auto;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}
.editor-card {
  padding: 8px 4px;
}
.edit-tabs {
  margin-top: 8px;
}
.cover-preview {
  width: 240px;
  height: 160px;
  object-fit: cover;
  border-radius: 6px;
  margin-left: 12px;
  border: 1px solid #eee;
}
.gallery-preview {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 8px;
}
.gallery-preview img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #eee;
}
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
}
</style>


