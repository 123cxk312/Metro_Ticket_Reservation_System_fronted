import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'

import { AUTH_TOKEN_STORAGE_KEY } from '@/constants/storage'

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface ApiErrorBody {
  code?: number | string
  message?: string
}

export class ApiError extends Error {
  readonly status: number | null
  readonly code: number | string | null

  constructor(message: string, status: number | null = null, code: number | string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    const status = error.response?.status ?? null
    const body = error.response?.data
    const message = body?.message || error.message || '请求失败，请稍后重试'

    return Promise.reject(new ApiError(message, status, body?.code ?? null))
  },
)

export function unwrapResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
  const body = response.data

  if (body.code !== 0) {
    throw new ApiError(body.message || '接口返回失败', response.status, body.code)
  }

  return body.data
}

export default http
