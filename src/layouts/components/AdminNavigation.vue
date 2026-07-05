<script setup lang="ts">
import { RouterLink } from 'vue-router'
import {
  activeItemClasses,
  baseItemClasses,
  inactiveItemClasses,
  type NavigationItem,
} from '../adminNavigation'

interface Props {
  items: NavigationItem[]
  isCurrentRoute: (path?: string) => boolean
  itemClick?: (path?: string) => void
}

const { items, isCurrentRoute, itemClick } = defineProps<Props>()

function handleClick(path?: string) {
  itemClick?.(path)
}
</script>

<template>
  <nav class="flex-1 overflow-y-auto px-4 py-4">
    <ul class="space-y-1">
      <li v-for="item in items" :key="item.name">
        <RouterLink
          v-if="item.to"
          :to="item.to"
          :class="[
            baseItemClasses,
            isCurrentRoute(item.to) ? activeItemClasses : inactiveItemClasses,
          ]"
          @click="handleClick(item.to)"
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
</template>
