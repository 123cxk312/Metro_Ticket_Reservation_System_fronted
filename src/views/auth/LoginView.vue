<template>
  <main class="login-page">
    <section class="brand-panel">
      <div class="brand-mark">
        <TrainFront :size="28" />
      </div>

      <div class="brand-copy">
        <p class="brand-kicker">METRO TICKET</p>
        <h1>地铁票务预约系统</h1>
        <p>连接线路、站点与每一次出行。</p>
      </div>

      <div class="route-map" aria-hidden="true">
        <span class="route-line route-line-one"></span>
        <span class="route-line route-line-two"></span>
        <span class="route-stop stop-one"></span>
        <span class="route-stop stop-two"></span>
        <span class="route-stop stop-three"></span>
        <span class="route-stop stop-four"></span>
        <span class="route-label label-start">人民广场</span>
        <span class="route-label label-middle">科技园</span>
        <span class="route-label label-end">机场</span>
      </div>
    </section>

    <section class="form-panel">
      <div class="form-shell">
        <div class="form-heading">
          <p>欢迎回来</p>
          <h2>登录账号</h2>
        </div>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keyup.enter="submit"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名">
              <template #prefix>
                <UserRound :size="18" />
              </template>
            </el-input>
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              type="password"
              placeholder="请输入密码"
              show-password
            >
              <template #prefix>
                <KeyRound :size="18" />
              </template>
            </el-input>
          </el-form-item>

          <el-button
            class="submit-button"
            type="primary"
            size="large"
            :loading="authStore.loading"
            @click="submit"
          >
            登录
            <ArrowRight :size="18" />
          </el-button>
        </el-form>

        <p class="auth-switch">
          还没有账号？
          <RouterLink to="/register">前往注册</RouterLink>
        </p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { ArrowRight, KeyRound, TrainFront, UserRound } from '@lucide/vue'

import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const formRef = ref<FormInstance>()

const form = reactive({
  username: '',
  password: '',
})

const rules: FormRules<typeof form> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
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
    const user = await authStore.login(form)
    ElMessage.success(`欢迎回来，${user.realName}`)

    const requestedPath = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const redirectPath = requestedPath.startsWith('/') ? requestedPath : '/'

    await router.replace(redirectPath)
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败，请稍后重试')
  }
}
</script>

<style scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  grid-template-columns: minmax(0, 1.12fr) minmax(420px, 0.88fr);
  background: var(--app-surface);
}

.brand-panel {
  position: relative;
  display: flex;
  min-height: 100vh;
  padding: 56px;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  background:
    linear-gradient(145deg, rgb(7 96 98 / 96%), rgb(15 139 141 / 90%)),
    var(--app-primary);
  color: #ffffff;
}

.brand-panel::after {
  position: absolute;
  right: -120px;
  bottom: -160px;
  width: 460px;
  height: 460px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 50%;
  content: "";
}

.brand-mark {
  display: grid;
  width: 52px;
  height: 52px;
  border: 1px solid rgb(255 255 255 / 26%);
  border-radius: 8px;
  place-items: center;
  background: rgb(255 255 255 / 12%);
}

.brand-copy {
  position: relative;
  z-index: 1;
  max-width: 560px;
}

.brand-kicker {
  margin: 0 0 12px;
  color: #c7eeee;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.brand-copy h1 {
  margin: 0;
  font-size: clamp(38px, 5vw, 68px);
  line-height: 1.05;
}

.brand-copy p:last-child {
  margin: 20px 0 0;
  color: rgb(255 255 255 / 76%);
  font-size: 17px;
}

.route-map {
  position: relative;
  z-index: 1;
  height: 180px;
  margin-top: 48px;
}

.route-line {
  position: absolute;
  height: 4px;
  border-radius: 999px;
  transform-origin: left center;
}

.route-line-one {
  top: 72px;
  left: 20px;
  width: 72%;
  background: #ffd166;
  transform: rotate(8deg);
}

.route-line-two {
  top: 72px;
  left: 42%;
  width: 44%;
  background: #ff8c61;
  transform: rotate(-24deg);
}

.route-stop {
  position: absolute;
  z-index: 2;
  width: 18px;
  height: 18px;
  border: 4px solid #ffffff;
  border-radius: 50%;
  background: var(--app-primary-dark);
  box-shadow: 0 0 0 3px rgb(255 255 255 / 18%);
}

.stop-one {
  top: 76px;
  left: 46px;
}

.stop-two {
  top: 95px;
  left: 31%;
}

.stop-three {
  top: 80px;
  left: 56%;
}

.stop-four {
  top: 38px;
  left: 76%;
}

.route-label {
  position: absolute;
  color: rgb(255 255 255 / 82%);
  font-size: 12px;
}

.label-start {
  top: 108px;
  left: 34px;
}

.label-middle {
  top: 128px;
  left: 29%;
}

.label-end {
  top: 8px;
  left: 72%;
}

.form-panel {
  display: grid;
  min-height: 100vh;
  padding: 48px;
  place-items: center;
  background:
    linear-gradient(180deg, rgb(15 139 141 / 4%), transparent 190px),
    #f7f9f8;
}

.form-shell {
  width: min(100%, 430px);
}

.form-heading {
  margin-bottom: 32px;
}

.form-heading p {
  margin: 0 0 8px;
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 700;
}

.form-heading h2 {
  margin: 0;
  color: var(--app-text);
  font-size: 34px;
  line-height: 1.2;
}

.submit-button {
  width: 100%;
  gap: 8px;
  margin-top: 8px;
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

@media (max-width: 960px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    min-height: auto;
    padding: 36px 28px 24px;
  }

  .brand-copy h1 {
    font-size: 36px;
  }

  .route-map {
    display: none;
  }

  .form-panel {
    min-height: auto;
    padding: 48px 24px 64px;
  }
}

</style>
