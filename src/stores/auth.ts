import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'

const TOKEN_KEY = 'admin_auth_token'
const USER_KEY = 'admin_auth_user'

function getStorage(rememberMe: boolean) {
  return rememberMe ? localStorage : sessionStorage
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const user = ref<authApi.SafeUser | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)

  function clearStorage() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }

  function persist(token: string, authenticatedUser: authApi.SafeUser, rememberMe: boolean) {
    clearStorage()
    const storage = getStorage(rememberMe)
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USER_KEY, JSON.stringify(authenticatedUser))
  }

  function hydrate() {
    let token = localStorage.getItem(TOKEN_KEY)
    let userJson = localStorage.getItem(USER_KEY)

    if (token === null) {
      token = sessionStorage.getItem(TOKEN_KEY)
      userJson = sessionStorage.getItem(USER_KEY)
    }

    if (token && userJson) {
      try {
        accessToken.value = token
        user.value = JSON.parse(userJson) as authApi.SafeUser
      } catch {
        clearStorage()
      }
    }
  }

  async function login(credentials: authApi.LoginCredentials, rememberMe = false) {
    loading.value = true
    error.value = null

    try {
      const response = await authApi.login(credentials)
      accessToken.value = response.accessToken
      user.value = response.user
      persist(response.accessToken, response.user, rememberMe)
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed. Please try again.'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  function logout() {
    accessToken.value = null
    user.value = null
    error.value = null
    clearStorage()
  }

  function persistUser(updatedUser: authApi.SafeUser) {
    user.value = updatedUser
    const rememberMe = localStorage.getItem(TOKEN_KEY) !== null
    if (accessToken.value) {
      persist(accessToken.value, updatedUser, rememberMe)
    }
  }

  async function refreshMe() {
    if (!accessToken.value) return

    try {
      user.value = await authApi.fetchMe(accessToken.value)
      const rememberMe = localStorage.getItem(TOKEN_KEY) !== null
      persist(accessToken.value, user.value, rememberMe)
    } catch {
      logout()
      throw new Error('Session expired. Please sign in again.')
    }
  }

  hydrate()

  return {
    accessToken,
    user,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    persistUser,
    refreshMe,
    hydrate,
  }
})
