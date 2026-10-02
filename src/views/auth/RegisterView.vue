<template>
  <main class="register-page">
    <header class="register-header">
      <RouterLink class="brand-link" to="/login">
        <span class="brand-icon">
          <TrainFront :size="22" />
        </span>
        <span>
          <strong>地铁票务预约系统</strong>
          <small>Metro Ticket Reservation</small>
        </span>
      </RouterLink>

      <RouterLink class="back-link" to="/login">
        <ArrowLeft :size="17" />
        返回登录
      </RouterLink>
    </header>

    <section class="register-content">
      <div class="register-intro">
        <p>CREATE ACCOUNT</p>
        <h1>注册普通用户账号</h1>
        <span>填写基础信息后即可查询车票和提交预约。</span>
      </div>

      <div class="register-form-panel">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keyup.enter="submit"
        >
          <div class="form-grid">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="form.username" placeholder="3-20 位字母、数字或下划线">
                <template #prefix>
                  <UserRound :size="18" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="真实姓名" prop="realName">
              <el-input v-model="form.realName" placeholder="请输入真实姓名">
                <template #prefix>
                  <ContactRound :size="18" />
                </template>
              </el-input>
            </el-form-item>
          </div>

          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" maxlength="11" placeholder="请输入 11 位手机号">
              <template #prefix>
                <Smartphone :size="18" />
              </template>
            </el-input>
          </el-form-item>

          <div class="form-grid">
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="至少 6 位"
                show-password
              >
                <template #prefix>
                  <KeyRound :size="18" />
                </template>
              </el-input>
            </el-form-item>

            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="再次输入密码"
                show-password
              >
                <template #prefix>
                  <ShieldCheck :size="18" />
                </template>
              </el-input>
            </el-form-item>
          </div>

          <el-button
            class="submit-button"
            type="primary"
            size="large"
            :loading="authStore.loading"
            @click="submit"
          >
            创建账号
            <ArrowRight :size="18" />
          </el-button>
        </el-form>

        <p class="auth-switch">
          已经有账号？
          <RouterLink to="/login">返回登录</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  ArrowRight,
  ContactRound,
  KeyRound,
  ShieldCheck,
  Smartphone,
  TrainFront,
  UserRound,
} from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  realName: '',
  phone: '',
  password: '',
  confirmPassword: '',
})

const validateUsername = (_rule: unknown, value: string, callback: (error?: Error) => void) => {
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
    callback(new Error('用户名需要 3-20 位字母、数字或下划线'))
    return
  }

  callback()
}

const validateConfirmPassword = (
  _rule: unknown,
  value: string,
  callback: (error?: Error) => void,
) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const rules: FormRules<typeof form> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { validator: validateUsername, trigger: 'blur' },
  ],
  realName: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    {
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的 11 位手机号',
      trigger: 'blur',
    },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少需要 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function submit(): Promise<void> {
  if (!formRef.value) {
    return
  }

  const valid = await formRef.value.validate().catch(() => false)

  if (!valid) {
    return
  }

  try {
    const user = await authStore.register(form)
    ElMessage.success(`注册成功，欢迎 ${user.realName}`)
    await router.replace({ name: 'home' })
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '注册失败，请稍后重试')
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  padding: 0 32px 48px;
  background:
    linear-gradient(180deg, rgb(15 139 141 / 7%), transparent 260px),
    var(--app-bg);
}

.register-header {
  display: flex;
  width: min(100%, 1120px);
  min-height: 84px;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.brand-link,
.brand-link > span:last-child,
.back-link {
  display: flex;
  align-items: center;
}

.brand-link {
  gap: 12px;
}

.brand-icon {
  display: grid;
  width: 42px;
  height: 42px;
  border-radius: 7px;
  place-items: center;
  background: var(--app-primary);
  color: #ffffff;
}

.brand-link > span:last-child {
  align-items: flex-start;
  flex-direction: column;
  gap: 2px;
}

.brand-link strong {
  font-size: 15px;
}

.brand-link small {
  color: var(--app-text-secondary);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.back-link {
  gap: 7px;
  color: var(--app-text-secondary);
  font-size: 14px;
}

.back-link:hover {
  color: var(--app-primary);
}

.register-content {
  display: grid;
  width: min(100%, 1120px);
  margin: 40px auto 0;
  grid-template-columns: minmax(280px, 0.72fr) minmax(520px, 1.28fr);
  gap: 56px;
  align-items: start;
}

.register-intro {
  position: sticky;
  top: 40px;
  padding-top: 28px;
}

.register-intro p {
  margin: 0 0 14px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
}

.register-intro h1 {
  margin: 0;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.08;
}

.register-intro span {
  display: block;
  margin-top: 20px;
  color: var(--app-text-secondary);
  line-height: 1.8;
}

.register-form-panel {
  padding: 36px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.submit-button {
  width: 100%;
  gap: 8px;
  margin-top: 10px;
}

.auth-switch {
  margin: 24px 0 0;
  color: var(--app-text-secondary);
  font-size: 14px;
  text-align: center;
}

.auth-switch a {
  color: var(--app-primary);
  font-weight: 700;
}

.auth-switch a:hover {
  color: var(--app-primary-dark);
}

@media (max-width: 920px) {
  .register-header {
    min-height: 72px;
  }

  .register-content {
    margin-top: 24px;
    grid-template-columns: 1fr;
    gap: 28px;
  }

  .register-intro {
    position: static;
    padding-top: 0;
  }
}

@media (max-width: 640px) {
  .register-page {
    padding: 0 18px 32px;
  }

  .brand-link small {
    display: none;
  }

  .register-form-panel {
    padding: 24px 18px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
