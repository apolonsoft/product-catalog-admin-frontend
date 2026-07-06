<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AdminSidebar from './components/AdminSidebar.vue'
import AdminTopbar from './components/AdminTopbar.vue'
import { adminNavigation } from './adminNavigation'

const sidebarOpen = ref(false)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isCurrentRoute = computed(() => (path?: string) => path !== undefined && route.path === path)

const userLabel = computed(
  () => authStore.user?.name ?? authStore.user?.email ?? 'Admin'
)

function logout() {
  authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <AdminSidebar mode="mobile" :open="sidebarOpen" :navigation="adminNavigation" :is-current-route="isCurrentRoute"
      @close="sidebarOpen = false" />

    <AdminSidebar mode="desktop" :navigation="adminNavigation" :is-current-route="isCurrentRoute" />

    <div class="flex min-h-screen flex-col lg:pl-64">
      <AdminTopbar :user-label="userLabel" @open-sidebar="sidebarOpen = true" @logout="logout" />

      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
