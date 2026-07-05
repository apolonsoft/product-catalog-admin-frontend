<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import AdminNavigation from './AdminNavigation.vue'
import type { NavigationItem } from '../adminNavigation'

interface Props {
  mode: 'mobile' | 'desktop'
  open?: boolean
  navigation: NavigationItem[]
  isCurrentRoute: (path?: string) => boolean
}

const { mode, open = false, navigation, isCurrentRoute } = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

function handleItemClick() {
  if (mode === 'mobile') {
    emit('close')
  }
}
</script>

<template>
  <TransitionRoot v-if="mode === 'mobile'" as="template" :show="open">
    <Dialog class="relative z-50 lg:hidden" @close="emit('close')">
      <TransitionChild as="template" enter="transition-opacity ease-linear duration-300" enter-from="opacity-0"
        enter-to="opacity-100" leave="transition-opacity ease-linear duration-200" leave-from="opacity-100"
        leave-to="opacity-0">
        <div class="fixed inset-0 bg-gray-900/50" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 flex">
        <TransitionChild as="template" enter="transition ease-in-out duration-300 transform"
          enter-from="-translate-x-full" enter-to="translate-x-0" leave="transition ease-in-out duration-300 transform"
          leave-from="translate-x-0" leave-to="-translate-x-full">
          <DialogPanel class="relative mr-16 flex w-full max-w-64 flex-1 flex-col bg-white">
            <TransitionChild as="template" enter="ease-in-out duration-300" enter-from="opacity-0"
              enter-to="opacity-100" leave="ease-in-out duration-300" leave-from="opacity-100" leave-to="opacity-0">
              <div class="absolute top-0 right-0 flex w-16 justify-center pt-5">
                <button type="button" class="-m-2.5 p-2.5 text-gray-500 hover:text-gray-700" @click="emit('close')">
                  <span class="sr-only">Close sidebar</span>
                  <XMarkIcon class="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
            </TransitionChild>

            <div class="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
              <span class="text-lg font-semibold text-gray-900">Admin</span>
            </div>
            <AdminNavigation :items="navigation" :is-current-route="isCurrentRoute" :item-click="handleItemClick" />
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  </TransitionRoot>

  <div v-else
    class="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-200 lg:bg-white">
    <div class="flex h-16 shrink-0 items-center border-b border-gray-200 px-6">
      <span class="text-lg font-semibold text-gray-900">Product Catalogue Admin</span>
    </div>
    <AdminNavigation :items="navigation" :is-current-route="isCurrentRoute" />
  </div>
</template>
