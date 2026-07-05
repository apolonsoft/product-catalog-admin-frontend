import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { SafeUser } from '@/api/auth'

const TOKEN_KEY = 'admin_auth_token'
const USER_KEY = 'admin_auth_user'
const mockUser: SafeUser = { id: '1', email: 'admin@example.com' }

function createRouterWithGuard() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      {
        path: '/',
        component: { template: '<div>Main</div>' },
        meta: { requiresAuth: true },
        children: [
          { path: '', name: 'home', component: { template: '<div>Home</div>' } },
        ],
      },
      {
        path: '/auth',
        component: { template: '<div>Auth</div>' },
        children: [
          { path: 'login', name: 'login', component: { template: '<div>Login</div>' } },
        ],
      },
    ],
  })

  router.beforeEach((to) => {
    const authStore = useAuthStore()

    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.name === 'login' && authStore.isAuthenticated) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      return redirect
    }

    return true
  })

  return router
}

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  it('redirects unauthenticated access to / to /auth/login with redirect query', async () => {
    const router = createRouterWithGuard()
    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/auth/login')
    expect(router.currentRoute.value.query.redirect).toBe('/')
  })

  it('allows authenticated access to /', async () => {
    localStorage.setItem(TOKEN_KEY, 'token')
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))

    const router = createRouterWithGuard()
    await router.push('/')

    expect(router.currentRoute.value.path).toBe('/')
  })

  it('redirects authenticated access to /auth/login to /', async () => {
    localStorage.setItem(TOKEN_KEY, 'token')
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))

    const router = createRouterWithGuard()
    await router.push('/auth/login')

    expect(router.currentRoute.value.path).toBe('/')
  })
})
