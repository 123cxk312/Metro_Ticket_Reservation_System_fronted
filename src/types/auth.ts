export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number
  username: string
  realName: string
  phone: string | null
  role: UserRole
}

export interface LoginPayload {
  username: string
  password: string
}

export interface RegisterPayload {
  username: string
  password: string
  confirmPassword: string
  realName: string
  phone: string
}
