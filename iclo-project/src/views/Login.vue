<template>
  <div class="login-page">
    <div class="backdrop"></div>
    <div class="login-dialog">
      <div class="dialog-header">
        <h2>账号登录</h2>
      </div>
      <el-form 
        :model="form" 
        class="login-form" 
        @keyup.enter.native="onSubmit"
      >
        <el-form-item label="账号">
          <el-input 
            v-model="form.account" 
            placeholder="手机号或邮箱"
            clearable
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码">
          <el-input 
            v-model="form.password" 
            placeholder="请输入密码" 
            type="password" 
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码">
          <div class="captcha-row">
            <el-input 
              v-model="form.captcha" 
              maxlength="4" 
              placeholder="4位验证码" 
            >
              <template #prefix>
                <el-icon><Edit /></el-icon>
              </template>
            </el-input>
            <div class="captcha-box" @click="refreshCaptcha">
              {{ captchaCode }}
            </div>
          </div>
        </el-form-item>

        <div class="form-extra">
          <el-checkbox v-model="form.remember">记住账号</el-checkbox>
          <a class="forget" href="#" @click.prevent="onForgot">忘记密码?</a>
        </div>

        <div class="actions">
          <el-button class="ghost" @click="goHome">取消</el-button>
          <el-button 
            type="primary" 
            class="submit" 
            :loading="loading" 
            @click="onSubmit"
          >
            登录
            <span class="arrow">→</span>
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Edit } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)

const form = reactive({
  account: '',
  password: '',
  captcha: '',
  remember: true,
})

const captchaCode = ref('3DE5')

const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const refreshCaptcha = () => {
  captchaCode.value = generateCaptcha()
}

const onSubmit = async () => {
  if (!form.account || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  if (!form.captcha) {
    ElMessage.warning('请输入验证码')
    return
  }
  if (form.captcha.toUpperCase() !== captchaCode.value) {
    ElMessage.error('验证码错误')
    refreshCaptcha()
    form.captcha = ''
    return
  }
  try {
    loading.value = true
    // 模拟请求
    await new Promise((r) => setTimeout(r, 600))
    // 生成一个简单 token
    localStorage.setItem('authToken', `token_${Date.now()}`)
    if (form.remember) {
      localStorage.setItem('rememberAccount', form.account)
    } else {
      localStorage.removeItem('rememberAccount')
    }
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/user-center'
    router.replace(redirect)
  } finally {
    loading.value = false
  }
}

const goHome = () => {
  router.push('/')
}

const onForgot = () => {
  ElMessage.info('请联系系统管理员重置密码')
}

refreshCaptcha()
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 16px;
  background: #000;
  overflow: hidden;
}
.backdrop {
  position: absolute;
  inset: 0;
  background: url('/login-bg.jpg') center/cover no-repeat;
  filter: blur(6px) brightness(0.5);
  transform: scale(1.1);
}
.login-dialog {
  position: relative;
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24px;
  padding: 32px 40px 36px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}
.dialog-header {
  margin-bottom: 12px;
  text-align: left;
  border-bottom: 1px solid #f1f1f1;
  padding-bottom: 16px;
}
.dialog-header h2 {
  margin: 0;
  font-size: 22px;
  color: #1f1f1f;
}
.login-form {
  margin-top: 10px;
}
.el-form-item {
  margin-bottom: 20px;
}
.captcha-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.captcha-row .el-input {
  flex: 1;
}
.captcha-box {
  width: 110px;
  text-align: center;
  font-size: 20px;
  letter-spacing: 6px;
  font-weight: 600;
  padding: 12px 0;
  border-radius: 12px;
  background: linear-gradient(120deg, #e4efff, #f0f7ff);
  color: #2463ff;
  cursor: pointer;
  user-select: none;
  box-shadow: inset 0 0 0 1px rgba(36, 99, 255, 0.2);
}
.form-extra {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 26px;
  font-size: 13px;
}
.forget {
  color: #1d5cff;
  text-decoration: none;
}
.forget:hover {
  text-decoration: underline;
}
.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}
.ghost {
  flex: 1;
  border-radius: 12px;
}
.submit {
  flex: 1;
  border-radius: 12px;
  background: linear-gradient(120deg, #0f73ff, #0a5bdc);
  border: none;
  font-weight: 600;
  letter-spacing: 1px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}
.arrow {
  font-size: 18px;
}
</style>


