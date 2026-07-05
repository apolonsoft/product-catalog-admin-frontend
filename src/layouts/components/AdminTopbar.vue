<script setup lang="ts">
import {
  Bars3Icon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  userLabel: string
}

const { userLabel } = defineProps<Props>()

const emit = defineEmits<{
  openSidebar: []
  logout: []
}>()
</script>

<template>
  <header
    class="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6"
  >
    <button
      type="button"
      class="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700 lg:hidden"
      @click="emit('openSidebar')"
    >
      <span class="sr-only">Open sidebar</span>
      <Bars3Icon class="h-6 w-6" aria-hidden="true" />
    </button>

    <div class="hidden text-sm font-medium text-gray-500 sm:block lg:hidden">
      Product Admin
    </div>

    <div class="flex flex-1 items-center justify-end gap-4">
      <!-- Search placeholder -->
      <div class="hidden max-w-xs flex-1 items-center sm:flex">
        <label for="topbar-search" class="sr-only">Search</label>
        <div class="relative w-full">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MagnifyingGlassIcon class="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="topbar-search"
            type="text"
            placeholder="Search..."
            class="block w-full rounded-md border-0 bg-gray-100 py-1.5 pl-9 pr-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-gray-400"
          />
        </div>
      </div>

      <button
        type="button"
        class="relative -m-2.5 rounded-full p-2.5 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
      >
        <span class="sr-only">View notifications</span>
        <BellIcon class="h-6 w-6" aria-hidden="true" />
        <span
          class="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
        />
      </button>

      <button
        type="button"
        class="flex items-center gap-2 rounded-full p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        @click="emit('logout')"
      >
        <span class="sr-only">Log out</span>
        <UserCircleIcon class="h-7 w-7" aria-hidden="true" />
        <span class="hidden text-sm font-medium text-gray-700 sm:block">{{ userLabel }}</span>
      </button>
    </div>
  </header>
</template>
