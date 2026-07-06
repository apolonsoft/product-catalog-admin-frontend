import { describe, it, expect, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AdminUserMenu from '../AdminUserMenu.vue'

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/settings', name: 'settings', component: { template: '<div>Settings</div>' } },
    ],
  })
}

async function mountAdminUserMenu(router = createTestRouter()) {
  router.push('/')
  await router.isReady()

  const wrapper = mount(AdminUserMenu, {
    props: { userLabel: 'Admin User' },
    global: { plugins: [router] },
  })

  return { wrapper, router }
}

describe('AdminUserMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders the provided user label', async () => {
    const { wrapper } = await mountAdminUserMenu()

    expect(wrapper.text()).toContain('Admin User')
  })

  it('opens the dropdown when the avatar button is clicked', async () => {
    const { wrapper } = await mountAdminUserMenu()

    expect(wrapper.text()).not.toContain('Profile')
    expect(wrapper.text()).not.toContain('Log out')

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Profile')
    expect(wrapper.text()).toContain('Log out')
  })

  it('shows Profile and Log out items when open', async () => {
    const { wrapper } = await mountAdminUserMenu()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('a').text()).toContain('Profile')
    expect(wrapper.findAll('button')[1]?.text()).toContain('Log out')
  })

  it('emits logout when Log out is clicked', async () => {
    const { wrapper } = await mountAdminUserMenu()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    const logoutButton = wrapper.findAll('button').find((b) => b.text().includes('Log out'))
    await logoutButton?.trigger('click')

    expect(wrapper.emitted('logout')).toHaveLength(1)
  })

  it('links Profile to the settings route', async () => {
    const { wrapper, router } = await mountAdminUserMenu()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    const profileLink = wrapper.find('a[href="/settings"]')
    expect(profileLink.exists()).toBe(true)
    expect(profileLink.text()).toContain('Profile')

    await profileLink.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('settings')
  })
})
