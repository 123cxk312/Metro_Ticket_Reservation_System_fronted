import http, { unwrapResponse } from '@/api/http'
import type { AuthUser, LoginPayload, RegisterPayload } from '@/types/auth'

export interface AuthResult {
  token: string
  user: AuthUser
}

export async function loginApi(payload: LoginPayload): Promise<AuthResult> {
  const response = await http.post('/auth/login', payload)
  return unwrapResponse<AuthResult>(response)
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResult> {
  const response = await http.post('/auth/register', payload)
  return unwrapResponse<AuthResult>(response)
}

export async function getCurrentUserApi(): Promise<AuthUser> {
  const response = await http.get('/auth/me')
  return unwrapResponse<AuthUser>(response)
}
