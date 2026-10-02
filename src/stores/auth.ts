import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { loginApi, registerApi } from '@/api/auth'
import {
  AUTH_TOKEN_STORAGE_KEY,
  AUTH_USER_STORAGE_KEY,
} from '@/constants/storage'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types/auth'

function readStoredUser(): AuthUser | null {
  try {
    const value = localStorage.getItem(AUTH_USER_STORAGE_KEY)
    return value ? (JSON.parse(value) as AuthUser) : null
  } catch {
    return null
  }
}

function readStoredToken(): string {
  return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? ''
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(readStoredUser())
  const token = ref(readStoredToken())
  const loading = ref(false)

  const isAuthenticated = computed(() => Boolean(user.value && token.value))
  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const displayName = computed(() => user.value?.realName || user.value?.username || '未登录')

  function setSession(nextUser: AuthUser, nextToken: string): void {
    user.value = nextUser
    token.value = nextToken
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(nextUser))
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken)
  }

  function clearSession(): void {
    user.value = null
    token.value = ''
    localStorage.removeItem(AUTH_USER_STORAGE_KEY)
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY)
  }

  async function login(payload: LoginPayload): Promise<AuthUser> {
    loading.value = true

    try {
      const username = payload.username.trim()
      const password = payload.password

      if (!username || !password) {
        throw new Error('请输入用户名和密码')
      }

      const result = await loginApi({
        username,
        password,
      })

      setSession(result.user, result.token)
      return result.user
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<AuthUser> {
    loading.value = true

    try {
      const username = payload.username.trim()
      const realName = payload.realName.trim()
      const phone = payload.phone.trim()

      if (!username || !realName || !phone) {
        throw new Error('请完整填写注册信息')
      }

      if (payload.password.length < 6) {
        throw new Error('密码至少需要 6 位')
      }

      if (payload.password !== payload.confirmPassword) {
        throw new Error('两次输入的密码不一致')
      }

      const result = await registerApi({
        username,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
        realName,
        phone,
      })

      setSession(result.user, result.token)
      return result.user
    } finally {
      loading.value = false
    }
  }

  function logout(): void {
    clearSession()
  }

  return {
    user,
    token,
    loading,
    isAuthenticated,
    isAdmin,
    displayName,
    login,
    register,
    logout,
  }
})
