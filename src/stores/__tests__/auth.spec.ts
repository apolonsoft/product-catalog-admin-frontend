import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

const TOKEN_KEY = 'admin_auth_token'
const USER_KEY = 'admin_auth_user'

const mockUser = { id: '1', email: 'admin@example.com', firstName: 'Admin' }
const mockResponse = { accessToken: 'test-token', user: mockUser }

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('stores token and user in localStorage when remember me is checked', async () => {
    mockFetch(new Response(JSON.stringify(mockResponse), { status: 200 }))
    const store = useAuthStore()

    await store.login({ email: 'admin@example.com', password: 'password' }, true)

    expect(store.accessToken).toBe('test-token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(localStorage.getItem(TOKEN_KEY)).toBe('test-token')
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser))
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('stores token and user in sessionStorage when remember me is not checked', async () => {
    mockFetch(new Response(JSON.stringify(mockResponse), { status: 200 }))
    const store = useAuthStore()

    await store.login({ email: 'admin@example.com', password: 'password' }, false)

    expect(store.accessToken).toBe('test-token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
    expect(sessionStorage.getItem(TOKEN_KEY)).toBe('test-token')
    expect(sessionStorage.getItem(USER_KEY)).toBe(JSON.stringify(mockUser))
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('surfaces an error on failed login and does not store auth data', async () => {
    mockFetch(new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 }))
    const store = useAuthStore()

    await expect(
      store.login({ email: 'admin@example.com', password: 'wrong' })
    ).rejects.toThrow('Invalid credentials')

    expect(store.error).toBe('Invalid credentials')
    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
  })

  it('clears both local and session auth state on logout', async () => {
    mockFetch(new Response(JSON.stringify(mockResponse), { status: 200 }))
    const store = useAuthStore()
    await store.login({ email: 'admin@example.com', password: 'password' }, true)

    store.logout()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(store.error).toBeNull()
    expect(store.isAuthenticated).toBe(false)
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(localStorage.getItem(USER_KEY)).toBeNull()
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull()
    expect(sessionStorage.getItem(USER_KEY)).toBeNull()
  })

  it('hydrates auth state from localStorage when the store is created', () => {
    localStorage.setItem(TOKEN_KEY, 'hydrated-token')
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))

    const store = useAuthStore()

    expect(store.accessToken).toBe('hydrated-token')
    expect(store.user).toEqual(mockUser)
    expect(store.isAuthenticated).toBe(true)
  })

  it('updates and persists the current user in localStorage', async () => {
    mockFetch(new Response(JSON.stringify(mockResponse), { status: 200 }))
    const store = useAuthStore()
    await store.login({ email: 'admin@example.com', password: 'password' }, true)

    const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Admin' }
    store.persistUser(updatedUser)

    expect(store.user).toEqual(updatedUser)
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(updatedUser))
  })

  it('updates and persists the current user in sessionStorage', async () => {
    mockFetch(new Response(JSON.stringify(mockResponse), { status: 200 }))
    const store = useAuthStore()
    await store.login({ email: 'admin@example.com', password: 'password' }, false)

    const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Admin' }
    store.persistUser(updatedUser)

    expect(store.user).toEqual(updatedUser)
    expect(sessionStorage.getItem(USER_KEY)).toBe(JSON.stringify(updatedUser))
    expect(localStorage.getItem(USER_KEY)).toBeNull()
  })
})
