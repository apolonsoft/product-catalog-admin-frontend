export interface SafeUser {
  id: string
  email: string
  name?: string
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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001'

class AuthApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.statusCode = statusCode
    this.name = 'AuthApiError'
  }
}

async function parseError(response: Response): Promise<AuthApiError> {
  let message = `Request failed: ${response.statusText}`
  try {
    const body = (await response.json()) as { message?: string }
    if (body.message) {
      message = body.message
    }
  } catch {
    // ignore non-JSON error bodies
  }
  return new AuthApiError(message, response.status)
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
