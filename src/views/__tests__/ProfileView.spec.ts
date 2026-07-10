import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import ProfileView from '../ProfileView.vue'
import { useAuthStore } from '@/stores/auth'

const TOKEN_KEY = 'admin_auth_token'
const USER_KEY = 'admin_auth_user'

function mockFetch(response: Response) {
  vi.stubGlobal('fetch', vi.fn<() => Promise<Response>>().mockResolvedValue(response))
}

function mockFetchSequence(responses: Response[]) {
  const fetchMock = vi.fn<() => Promise<Response>>()
  responses.forEach((response) => fetchMock.mockResolvedValueOnce(response))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function getInputValue(wrapper: ReturnType<typeof mount>, selector: string): string {
  return (wrapper.find(selector).element as HTMLInputElement).value
}

function setInputValue(wrapper: ReturnType<typeof mount>, selector: string, value: string) {
  const found = wrapper.find(selector)
  ;(found.element as HTMLInputElement).value = value
  return found
}

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/auth/login', name: 'login', component: { template: '<div>Login</div>' } },
      { path: '/profile', name: 'profile', component: ProfileView },
    ],
  })
}

const mockUser = {
  id: 'user-1',
  email: 'ada@example.com',
  firstName: 'Ada',
  lastName: 'Lovelace',
  phone: null,
  role: 'ADMIN',
  status: 'ACTIVE',
  avatarFileId: null,
  avatarFile: null,
}

async function mountProfileView(router = createTestRouter()) {
  router.push('/profile')
  await router.isReady()

  const wrapper = mount(ProfileView, {
    global: { plugins: [router] },
    attachTo: document.body,
  })

  return { wrapper, router }
}

describe('ProfileView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
    vi.unstubAllGlobals()
  })

  it('renders current user data in the profile form', async () => {
    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    expect(getInputValue(wrapper, '#firstName')).toBe('Ada')
    expect(getInputValue(wrapper, '#lastName')).toBe('Lovelace')
  })

  it('submits trimmed profile updates and persists the returned user', async () => {
    const updatedUser = { ...mockUser, firstName: 'Updated', lastName: 'Name' }
    mockFetch(new Response(JSON.stringify(updatedUser), { status: 200 }))

    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser
    localStorage.setItem(TOKEN_KEY, 'token-123')

    const { wrapper } = await mountProfileView()

    const firstNameInput = setInputValue(wrapper, '#firstName', ' Updated ')
    await firstNameInput.trigger('input')
    await flushPromises()

    const lastNameInput = setInputValue(wrapper, '#lastName', ' Name ')
    await lastNameInput.trigger('input')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(store.user).toEqual(updatedUser)
    expect(localStorage.getItem(USER_KEY)).toBe(JSON.stringify(updatedUser))
    expect(wrapper.text()).toContain('Profile updated successfully.')
  })

  it('sends null for cleared profile fields', async () => {
    mockFetch(new Response(JSON.stringify(mockUser), { status: 200 }))

    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    const firstNameInput = setInputValue(wrapper, '#firstName', '')
    await firstNameInput.trigger('input')
    await flushPromises()

    const lastNameInput = setInputValue(wrapper, '#lastName', '')
    await lastNameInput.trigger('input')
    await flushPromises()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const fetchMock = vi.mocked(fetch)
    const profileCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH')
    expect(profileCall).toBeDefined()
    expect(profileCall![1]?.body).toBe(JSON.stringify({ firstName: null, lastName: null }))
  })

  it('blocks password submission when confirmation does not match', async () => {
    const fetchMock = vi.fn<() => Promise<Response>>()
    vi.stubGlobal('fetch', fetchMock)

    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    const passwordForm = wrapper.findAll('form').find((form) => form.find('#currentPassword').exists())
    expect(passwordForm).toBeDefined()

    const currentPasswordInput = setInputValue(wrapper, '#currentPassword', 'current-password')
    await currentPasswordInput.trigger('input')
    await flushPromises()

    const newPasswordInput = setInputValue(wrapper, '#newPassword', 'new-password')
    await newPasswordInput.trigger('input')
    await flushPromises()

    const confirmPasswordInput = setInputValue(wrapper, '#confirmPassword', 'different-password')
    await confirmPasswordInput.trigger('input')
    await flushPromises()

    await passwordForm!.trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Passwords do not match')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redirects to login after a successful password change', async () => {
    mockFetch(new Response(null, { status: 204 }))

    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser
    localStorage.setItem(TOKEN_KEY, 'token-123')
    localStorage.setItem(USER_KEY, JSON.stringify(mockUser))

    const { wrapper, router } = await mountProfileView()

    const passwordForm = wrapper.findAll('form').find((form) => form.find('#currentPassword').exists())
    expect(passwordForm).toBeDefined()

    const currentPasswordInput = setInputValue(wrapper, '#currentPassword', 'current-password')
    await currentPasswordInput.trigger('input')
    await flushPromises()

    const newPasswordInput = setInputValue(wrapper, '#newPassword', 'new-password')
    await newPasswordInput.trigger('input')
    await flushPromises()

    const confirmPasswordInput = setInputValue(wrapper, '#confirmPassword', 'new-password')
    await confirmPasswordInput.trigger('input')
    await flushPromises()

    await passwordForm!.trigger('submit')
    await flushPromises()

    expect(store.accessToken).toBeNull()
    expect(store.user).toBeNull()
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query).toEqual({ passwordChanged: '1' })
  })

  it('rejects oversized avatar files', async () => {
    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    const oversizedFile = new File(['x'], 'avatar.png', { type: 'image/png' })
    Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 })

    const input = wrapper.find('#avatar')
    await input.setValue('')
    Object.defineProperty(input.element, 'files', {
      value: [oversizedFile],
    })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('Image must be smaller than 5 MB.')
  })

  it('rejects avatar files with unsupported types', async () => {
    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    const invalidFile = new File(['x'], 'avatar.gif', { type: 'image/gif' })

    const input = wrapper.find('#avatar')
    await input.setValue('')
    Object.defineProperty(input.element, 'files', {
      value: [invalidFile],
    })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.text()).toContain('Only JPEG, PNG, and WebP images are allowed.')
  })

  it('uploads avatar through initiate, direct PUT, and complete sequence', async () => {
    const updatedUser = {
      ...mockUser,
      avatarFileId: 'file-1',
      avatarFile: {
        id: 'file-1',
        link: 'https://cdn.test/avatar.png',
        type: 'image/png',
        name: 'avatar.png',
        size: 1024,
        status: 'UPLOADED',
      },
    }

    mockFetchSequence([
      new Response(JSON.stringify({ uploadId: 'upload-1', url: 'https://signed.example/put' }), { status: 200 }),
      new Response(null, { status: 200 }),
      new Response(JSON.stringify(updatedUser), { status: 200 }),
    ])

    const store = useAuthStore()
    store.accessToken = 'token-123'
    store.user = mockUser

    const { wrapper } = await mountProfileView()

    const file = new File(['x'], 'avatar.png', { type: 'image/png' })
    const input = wrapper.find('#avatar')
    Object.defineProperty(input.element, 'files', {
      value: [file],
    })
    await input.trigger('change')
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(store.user).toEqual(updatedUser)
    expect(wrapper.text()).toContain('Avatar updated successfully.')

    const fetchMock = vi.mocked(fetch)
    const [initiateUrl, initiateInit] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(initiateUrl).toContain('/profile/avatar/uploads')
    expect(initiateInit?.method).toBe('POST')

    const [putUrl, putInit] = fetchMock.mock.calls[1] as [string, RequestInit]
    expect(putUrl).toBe('https://signed.example/put')
    expect(putInit?.method).toBe('PUT')
    expect(putInit?.headers).toMatchObject({ 'Content-Type': 'image/png' })

    const [completeUrl, completeInit] = fetchMock.mock.calls[2] as [string, RequestInit]
    expect(completeUrl).toContain('/profile/avatar/uploads/upload-1/complete')
    expect(completeInit?.method).toBe('POST')
  })
})
