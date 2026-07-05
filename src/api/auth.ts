import { API_BASE_URL, parseError } from './client'

export interface SafeUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  role?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: SafeUser
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json() as Promise<LoginResponse>
}

export async function fetchMe(token: string): Promise<SafeUser> {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw await parseError(response)
  }

  return response.json() as Promise<SafeUser>
}
