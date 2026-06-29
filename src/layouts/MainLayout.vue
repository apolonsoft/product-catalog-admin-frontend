<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import {
  Bars3Icon,
  BellIcon,
  Cog6ToothIcon,
  CubeIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  UserCircleIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const sidebarOpen = ref(false)
const route = useRoute()

interface NavigationItem {
  name: string
  icon: typeof HomeIcon
  to?: string
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Products', icon: CubeIcon },
  { name: 'Categories', icon: Squares2X2Icon },
  { name: 'Orders', icon: ShoppingCartIcon },
  { name: 'Customers', icon: UsersIcon },
  { name: 'Settings', to: '/about', icon: Cog6ToothIcon },
]

const isCurrentRoute = computed(() => (path?: string) => path !== undefined && route.path === path)

const baseItemClasses =
  'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'

const activeItemClasses = 'bg-gray-100 text-gray-900'
const inactiveItemClasses =
  'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile sidebar drawer -->
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="transition-opacity ease-linear duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-gray-900/50" aria-hidden="true" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel class="relative mr-16 flex w-full max-w-64 flex-1 flex-col bg-white">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-300"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div class="absolute top-0 right-0 flex w-16 justify-center pt-5">
                  <button
                    type="button"
                    class="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700"
                    @click="sidebarOpen = false"
                  >
                    <span class="sr-only">Close sidebar</span>
                    <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <!-- Mobile sidebar content -->
              <div class="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
                <span class="text-lg font-semibold text-gray-900">Admin</span>
              </div>
              <nav class="flex-1 overflow-y-auto px-4 py-4">
                <ul class="space-y-1">
                  <li v-for="item in navigation" :key="item.name">
                    <RouterLink
                      v-if="item.to"
                      :to="item.to"
                      :class="[
                        baseItemClasses,
                        isCurrentRoute(item.to) ? activeItemClasses : inactiveItemClasses,
                      ]"
                      @click="sidebarOpen = false"
                    >
                      <component
                        :is="item.icon"
                        class="h-5 w-5 shrink-0"
                        :class="
                          isCurrentRoute(item.to)
                            ? 'text-gray-900'
                            : 'text-gray-400 group-hover:text-gray-600'
                        "
                        aria-hidden="true"
                      />
                      {{ item.name }}
                    </RouterLink>
                    <button
                      v-else
                      type="button"
                      :class="[baseItemClasses, inactiveItemClasses, 'w-full text-left']"
                      disabled
                    >
                      <component
                        :is="item.icon"
                        class="h-5 w-5 shrink-0 text-gray-400"
                        aria-hidden="true"
                      />
                      {{ item.name }}
                    </button>
                  </li>
                </ul>
              </nav>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Desktop sidebar -->
    <div
      class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white"
    >
      <div class="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
        <span class="text-lg font-semibold text-gray-900">Product Admin</span>
      </div>
      <nav class="flex-1 overflow-y-auto px-4 py-4">
        <ul class="space-y-1">
          <li v-for="item in navigation" :key="item.name">
            <RouterLink
              v-if="item.to"
              :to="item.to"
              :class="[
                baseItemClasses,
                isCurrentRoute(item.to) ? activeItemClasses : inactiveItemClasses,
              ]"
            >
              <component
                :is="item.icon"
                class="h-5 w-5 shrink-0"
                :class="
                  isCurrentRoute(item.to)
                    ? 'text-gray-900'
                    : 'text-gray-400 group-hover:text-gray-600'
                "
                aria-hidden="true"
              />
              {{ item.name }}
            </RouterLink>
            <button
              v-else
              type="button"
              :class="[baseItemClasses, inactiveItemClasses, 'w-full text-left']"
              disabled
            >
              <component
                :is="item.icon"
                class="h-5 w-5 shrink-0 text-gray-400"
                aria-hidden="true"
              />
              {{ item.name }}
            </button>
          </li>
        </ul>
      </nav>
    </div>

    <!-- Main wrapper -->
    <div class="flex min-h-screen flex-col lg:pl-64">
      <!-- Topbar -->
      <header
        class="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-4 sm:px-6"
      >
        <button
          type="button"
          class="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700 lg:hidden"
          @click="sidebarOpen = true"
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
          >
            <span class="sr-only">Open user menu</span>
            <UserCircleIcon class="h-7 w-7" aria-hidden="true" />
            <span class="hidden text-sm font-medium text-gray-700 sm:block">Admin</span>
          </button>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div class="mx-auto max-w-7xl">
          <RouterView />
        </div>
      </main>
    </div>
  </div>
</template>
