<template>
  <div class="page-wrap">
    <el-card class="set-card" shadow="never">
      <div class="account-info">
        <el-divider content-position="left">账号信息</el-divider>
        <div class="info-item">
          <span class="label">昵称：</span>
          <span class="value">{{ userInfo.nickname }}</span>
        </div>
        <div class="info-item">
          <span class="label">ID：</span>
          <span class="value">{{ userInfo.id }}</span>
        </div>
        <div class="info-item">
          <span class="label">会员等级：</span>
          <el-tag :type="userInfo.memberLevel === 'VIP' ? 'danger' : userInfo.memberLevel === 'SVIP' ? 'warning' : 'info'" size="small">
            {{ userInfo.memberLevel }}
          </el-tag>
        </div>
      </div>

      <el-divider content-position="left">收货地址</el-divider>
        <div class="addr-list">
          <el-card v-for="addr in addresses" :key="addr.id" class="addr-item" shadow="never">
            <div class="addr-head">
              <div class="name">{{ addr.name }} {{ addr.phone }}</div>
              <el-tag v-if="addr.isDefault" type="success" size="small">默认</el-tag>
            </div>
            <div class="addr-body">{{ addr.full }}</div>
            <div class="addr-ops">
              <el-button size="small" text type="primary" @click="openEditAddressDialog(addr)">编辑</el-button>
              <el-button size="small" text type="danger" @click="removeAddress(addr.id)">删除</el-button>
            </div>
          </el-card>
          <el-button type="primary" plain @click="openAddAddressDialog">新增地址</el-button>
        </div>

        <el-divider content-position="left">账号安全</el-divider>
        <div class="sec-row">
          <div class="sec-item">
            <div class="name">登录密码</div>
            <div class="desc">建议定期更换，提高账号安全性</div>
          </div>
          <el-button text type="primary">修改</el-button>
        </div>
        <div class="sec-row">
          <div class="sec-item">
            <div class="name">支付方式绑定</div>
            <div class="desc">已绑定：微信、支付宝</div>
          </div>
          <el-button text type="primary">管理</el-button>
        </div>
      </el-card>

      <!-- 新增地址弹窗 -->
      <el-dialog v-model="addAddressVisible" :title="isEditing ? '编辑地址' : '新增地址'" width="560px">
        <el-form ref="addressFormRef" :model="addressForm" :rules="addressRules" label-width="88px">
          <el-form-item label="收货人" prop="name">
            <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" maxlength="20" />
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="addressForm.phone" placeholder="请输入手机号" maxlength="11" />
          </el-form-item>
          <el-form-item label="详细地址" prop="full">
            <el-input
              v-model="addressForm.full"
              type="textarea"
              :rows="3"
              placeholder="请输入详细地址"
              maxlength="100"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="设为默认">
            <el-switch v-model="addressForm.isDefault" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="addAddressVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAddress">确定</el-button>
        </template>
      </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, inject } from 'vue'
import { ElMessage } from 'element-plus'

// 从父组件获取用户信息
const userInfo = inject('userInfo', reactive({
  nickname: '一只小熊',
  id: 'U1024001',
  phone: '138****8888',
  address: '上海市 浦东新区 张江路 123 号',
  memberLevel: 'VIP'
}))

const addresses = reactive([
  {
    id: 1,
    name: '张三',
    phone: '13800000000',
    full: '浙江省 杭州市 西湖区 文一路 88 号 xx 大厦 12F',
    isDefault: true,
  },
])

const addAddressVisible = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const addressFormRef = ref(null)
const addressForm = reactive({
  name: '',
  phone: '',
  full: '',
  isDefault: false,
})

const addressRules = {
  name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度 2-20 个字符', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1\d{10}$/, message: '请输入有效的 11 位手机号', trigger: 'blur' }
  ],
  full: [
    { required: true, message: '请输入详细地址', trigger: 'blur' },
    { min: 5, max: 100, message: '长度 5-100 个字符', trigger: 'blur' }
  ]
}

const openAddAddressDialog = () => {
  isEditing.value = false
  editingId.value = null
  addressForm.name = ''
  addressForm.phone = ''
  addressForm.full = ''
  addressForm.isDefault = false
  addAddressVisible.value = true
}

const openEditAddressDialog = (addr) => {
  isEditing.value = true
  editingId.value = addr.id
  addressForm.name = addr.name
  addressForm.phone = addr.phone
  addressForm.full = addr.full
  addressForm.isDefault = !!addr.isDefault
  addAddressVisible.value = true
}

const submitAddress = () => {
  addressFormRef.value?.validate((valid) => {
    if (!valid) return
    // 如果设为默认，先取消其他默认地址（编辑时也适用）
    if (addressForm.isDefault) {
      addresses.forEach(addr => {
        if (!isEditing.value || addr.id !== editingId.value) {
          addr.isDefault = false
        }
      })
    }

    if (isEditing.value) {
      const idx = addresses.findIndex(x => x.id === editingId.value)
      if (idx !== -1) {
        addresses[idx] = {
          ...addresses[idx],
          name: addressForm.name,
          phone: addressForm.phone,
          full: addressForm.full,
          isDefault: addressForm.isDefault,
        }
        ElMessage.success('地址已更新')
      }
    } else {
      addresses.push({
        id: Date.now(),
        name: addressForm.name,
        phone: addressForm.phone,
        full: addressForm.full,
        isDefault: addressForm.isDefault,
      })
      ElMessage.success('地址已添加')
    }

    addAddressVisible.value = false
  })
}

const removeAddress = (id) => {
  const idx = addresses.findIndex((x) => x.id === id)
  if (idx !== -1) {
    addresses.splice(idx, 1)
    ElMessage.success('已删除地址')
  }
}
</script>

<style scoped>
.page-wrap {
  padding: 0;
}
.set-card {
  margin-top: 16px;
}
.account-info {
  margin-bottom: 24px;
}
.info-item {
  padding: 12px 0;
  border-bottom: 1px dashed #eee;
}
.info-item .label {
  color: #666;
  margin-right: 8px;
}
.info-item .value {
  color: #333;
  font-weight: 500;
}
.addr-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 6px;
}
.addr-item .addr-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}
.addr-item .addr-body {
  margin: 8px 0 6px;
  color: #666;
}
.addr-ops {
  display: flex;
  gap: 8px;
}
.sec-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}
.sec-item .name {
  font-weight: 600;
}
.sec-item .desc {
  color: #666;
  font-size: 13px;
}
.save-row {
  margin-top: 16px;
}
</style>


