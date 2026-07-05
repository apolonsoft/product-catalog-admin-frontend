import {
  Cog6ToothIcon,
  CubeIcon,
  HomeIcon,
  ShoppingCartIcon,
  Squares2X2Icon,
  UsersIcon,
} from '@heroicons/vue/24/outline'

export interface NavigationItem {
  name: string
  icon: typeof HomeIcon
  to?: string
}

export const adminNavigation: NavigationItem[] = [
  { name: 'Dashboard', to: '/', icon: HomeIcon },
  { name: 'Products', icon: CubeIcon },
  { name: 'Categories', icon: Squares2X2Icon },
  { name: 'Orders', icon: ShoppingCartIcon },
  { name: 'Customers', icon: UsersIcon },
  { name: 'Settings', to: '/about', icon: Cog6ToothIcon },
]

export const baseItemClasses =
  'group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors'

export const activeItemClasses = 'bg-gray-100 text-gray-900'

export const inactiveItemClasses = 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
