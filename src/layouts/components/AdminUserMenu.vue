<script setup lang="ts">
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionRoot,
} from '@headlessui/vue'
import {
  ArrowRightCircleIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  UserCircleIcon,
} from '@heroicons/vue/24/outline'

interface Props {
  userLabel: string
}

defineProps<Props>()

const emit = defineEmits<{
  logout: []
}>()
</script>

<template>
  <Menu as="div" class="relative">
    <MenuButton
      class="flex items-center gap-2 rounded-full p-1 text-gray-500 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400">
      <span class="sr-only">Open user menu</span>
      <UserCircleIcon class="h-7 w-7" aria-hidden="true" />
      <span class="hidden text-sm font-medium text-gray-700 sm:block">{{ userLabel }}</span>
      <ChevronDownIcon class="hidden h-4 w-4 text-gray-500 sm:block" aria-hidden="true" />
    </MenuButton>

    <TransitionRoot as="template" enter="transition ease-out duration-100" enter-from="transform opacity-0 scale-95"
      enter-to="transform opacity-100 scale-100" leave="transition ease-in duration-75"
      leave-from="transform opacity-100 scale-100" leave-to="transform opacity-0 scale-95">
      <MenuItems
        class="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus-visible:outline-none">
        <MenuItem v-slot="{ active }" as="template">
          <RouterLink :to="{ name: 'profile' }" :class="[
            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
            'flex items-center gap-2 px-4 py-2 text-sm',
          ]">
            <Cog6ToothIcon class="h-4 w-4" aria-hidden="true" />
            Profile
          </RouterLink>
        </MenuItem>
        <MenuItem v-slot="{ active }" as="template">
          <button type="button" :class="[
            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
            'flex w-full items-center gap-2 px-4 py-2 text-left text-sm',
          ]" @click="emit('logout')">
            <ArrowRightCircleIcon class="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </MenuItem>
      </MenuItems>
    </TransitionRoot>
  </Menu>
</template>
