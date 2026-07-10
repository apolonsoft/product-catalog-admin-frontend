<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { object, string } from 'zod'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import * as profileApi from '@/api/profile'

const AVATAR_MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const authStore = useAuthStore()
const router = useRouter()

const avatarError = ref<string | null>(null)
const avatarSuccess = ref<string | null>(null)
const avatarLoading = ref(false)
const selectedAvatarFile = ref<File | null>(null)
const avatarInput = ref<HTMLInputElement | null>(null)

const profileError = ref<string | null>(null)
const profileSuccess = ref<string | null>(null)
const profileLoading = ref(false)

const passwordError = ref<string | null>(null)
const passwordSuccess = ref<string | null>(null)
const passwordLoading = ref(false)

const initials = computed(() => {
  const user = authStore.user
  if (!user) return 'A'

  const first = user.firstName?.[0] ?? ''
  const last = user.lastName?.[0] ?? ''
  const initials = `${first}${last}`.toUpperCase()
  return initials || user.email.slice(0, 1).toUpperCase()
})

const displayName = computed(() => {
  const user = authStore.user
  if (!user) return ''

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return fullName || user.email
})

const firstName = ref(authStore.user?.firstName ?? '')
const lastName = ref(authStore.user?.lastName ?? '')
const profileErrors = ref<{ firstName?: string; lastName?: string }>({})
const profileValid = computed(() => Object.keys(profileErrors.value).length === 0)

watch(
  () => authStore.user,
  (user) => {
    if (user) {
      firstName.value = user.firstName ?? ''
      lastName.value = user.lastName ?? ''
    }
  },
  { immediate: true }
)

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const passwordErrors = ref<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({})
const passwordValid = computed(() => Object.keys(passwordErrors.value).length === 0)

function validateAvatarFile(file: File): string | null {
  if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
    return 'Only JPEG, PNG, and WebP images are allowed.'
  }
  if (file.size > AVATAR_MAX_BYTES) {
    return 'Image must be smaller than 5 MB.'
  }
  return null
}

function onAvatarSelected(event: Event) {
  avatarError.value = null
  avatarSuccess.value = null
  selectedAvatarFile.value = null

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const validationError = validateAvatarFile(file)
  if (validationError) {
    avatarError.value = validationError
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
    return
  }

  selectedAvatarFile.value = file
}

async function uploadAvatar() {
  if (!selectedAvatarFile.value || !authStore.accessToken) return

  avatarLoading.value = true
  avatarError.value = null
  avatarSuccess.value = null

  try {
    const { uploadId, url } = await profileApi.initiateAvatarUpload(authStore.accessToken, {
      name: selectedAvatarFile.value.name,
      type: selectedAvatarFile.value.type,
      size: selectedAvatarFile.value.size,
    })

    await profileApi.uploadFileToUrl(url, selectedAvatarFile.value)

    const updatedUser = await profileApi.completeAvatarUpload(authStore.accessToken, uploadId)
    authStore.persistUser(updatedUser)

    selectedAvatarFile.value = null
    if (avatarInput.value) {
      avatarInput.value.value = ''
    }
    avatarSuccess.value = 'Avatar updated successfully.'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upload avatar.'
    avatarError.value = message
  } finally {
    avatarLoading.value = false
  }
}

function validateProfile(): boolean {
  profileErrors.value = {}
  return Object.keys(profileErrors.value).length === 0
}

async function onProfileSubmit() {
  if (!authStore.accessToken || !validateProfile()) return

  profileLoading.value = true
  profileError.value = null
  profileSuccess.value = null

  try {
    const trimmedFirstName = firstName.value.trim()
    const trimmedLastName = lastName.value.trim()

    const updatedUser = await profileApi.updateProfile(authStore.accessToken, {
      firstName: trimmedFirstName || null,
      lastName: trimmedLastName || null,
    })
    authStore.persistUser(updatedUser)
    profileSuccess.value = 'Profile updated successfully.'
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update profile.'
    profileError.value = message
  } finally {
    profileLoading.value = false
  }
}

const passwordSchema = object({
  currentPassword: string().min(1, 'Current password is required'),
  newPassword: string().min(8, 'Password must be at least 8 characters long').min(1, 'New password is required'),
  confirmPassword: string().min(1, 'Please confirm your new password'),
}).refine((values) => values.newPassword === values.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

function validatePassword(): boolean {
  const result = passwordSchema.safeParse({
    currentPassword: currentPassword.value,
    newPassword: newPassword.value,
    confirmPassword: confirmPassword.value,
  })

  if (!result.success) {
    passwordErrors.value = {}
    result.error.issues.forEach((issue) => {
      const path = issue.path[0] as keyof typeof passwordErrors.value
      if (!passwordErrors.value[path]) {
        passwordErrors.value[path] = issue.message
      }
    })
    return false
  }

  passwordErrors.value = {}
  return true
}

async function onPasswordSubmit() {
  if (!authStore.accessToken || !validatePassword()) return

  passwordLoading.value = true
  passwordError.value = null
  passwordSuccess.value = null

  try {
    await profileApi.changePassword(authStore.accessToken, {
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    authStore.logout()
    await router.push({ name: 'login', query: { passwordChanged: '1' } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to change password.'
    passwordError.value = message
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Profile</h1>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your account details and password.</p>
    </div>

    <!-- Avatar section -->
    <section class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Avatar</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Upload a profile picture. JPEG, PNG, or WebP up to 5 MB.
      </p>

      <div class="mt-6 flex items-center gap-6">
        <div
          class="relative h-24 w-24 overflow-hidden rounded-full bg-indigo-100 ring-1 ring-gray-200 dark:bg-indigo-900/30 dark:ring-white/10">
          <img v-if="authStore.user?.avatarFile?.link" :src="authStore.user.avatarFile.link" :alt="displayName"
            class="h-full w-full object-cover" />
          <div v-else
            class="flex h-full w-full items-center justify-center text-2xl font-semibold text-indigo-700 dark:text-indigo-300">
            {{ initials }}
          </div>
        </div>

        <div class="flex-1 space-y-4">
          <div>
            <input ref="avatarInput" id="avatar" type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
              @change="onAvatarSelected" />
            <label for="avatar"
              class="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10">
              <ArrowUpTrayIcon class="h-4 w-4" aria-hidden="true" />
              {{ selectedAvatarFile ? 'Change image' : 'Choose image' }}
            </label>
            <p v-if="selectedAvatarFile" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Selected: {{ selectedAvatarFile.name }} ({{ (selectedAvatarFile.size / 1024).toFixed(1) }} KB)
            </p>
          </div>

          <button type="button" :disabled="!selectedAvatarFile || avatarLoading" @click="uploadAvatar"
            class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
            <span v-if="avatarLoading">Uploading...</span>
            <span v-else>Upload avatar</span>
          </button>

          <div v-if="avatarSuccess" class="rounded-md bg-green-50 p-3 dark:bg-green-900/20">
            <p class="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircleIcon class="h-4 w-4" aria-hidden="true" />
              {{ avatarSuccess }}
            </p>
          </div>
          <div v-if="avatarError" class="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
            <p class="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
              <ExclamationCircleIcon class="h-4 w-4" aria-hidden="true" />
              {{ avatarError }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Profile details section -->
    <section class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Profile details</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Update your profile.</p>

      <form class="mt-6 space-y-6" @submit.prevent="onProfileSubmit">
        <div class="grid gap-6 sm:grid-cols-2">
          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-900 dark:text-gray-100">First name</label>
            <div class="mt-2">
              <input id="firstName" type="text" autocomplete="given-name" v-model="firstName"
                class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
            </div>
            <p v-if="profileErrors.firstName" class="mt-2 text-sm text-red-600 dark:text-red-500">{{
              profileErrors.firstName }}</p>
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Last name</label>
            <div class="mt-2">
              <input id="lastName" type="text" autocomplete="family-name" v-model="lastName"
                class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
            </div>
            <p v-if="profileErrors.lastName" class="mt-2 text-sm text-red-600 dark:text-red-500">{{
              profileErrors.lastName }}</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <button type="submit" :disabled="!profileValid || profileLoading"
            class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
            <span v-if="profileLoading">Saving...</span>
            <span v-else>Save profile</span>
          </button>

          <div v-if="profileSuccess" class="rounded-md bg-green-50 px-3 py-2 dark:bg-green-900/20">
            <p class="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircleIcon class="h-4 w-4" aria-hidden="true" />
              {{ profileSuccess }}
            </p>
          </div>
        </div>

        <div v-if="profileError" class="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p class="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <ExclamationCircleIcon class="h-4 w-4" aria-hidden="true" />
            {{ profileError }}
          </p>
        </div>
      </form>
    </section>

    <!-- Change password section -->
    <section class="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 dark:bg-gray-900 dark:ring-white/10">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Change password</h2>
      <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose a strong password at least 8 characters long.</p>

      <form class="mt-6 space-y-6" @submit.prevent="onPasswordSubmit">
        <div>
          <label for="currentPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Current
            password</label>
          <div class="mt-2">
            <input id="currentPassword" type="password" autocomplete="current-password" v-model="currentPassword"
              class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
          </div>
          <p v-if="passwordErrors.currentPassword" class="mt-2 text-sm text-red-600 dark:text-red-500">{{
            passwordErrors.currentPassword }}</p>
        </div>

        <div>
          <label for="newPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">New
            password</label>
          <div class="mt-2">
            <input id="newPassword" type="password" autocomplete="new-password" v-model="newPassword"
              class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
          </div>
          <p v-if="passwordErrors.newPassword" class="mt-2 text-sm text-red-600 dark:text-red-500">{{
            passwordErrors.newPassword }}</p>
        </div>

        <div>
          <label for="confirmPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Confirm new
            password</label>
          <div class="mt-2">
            <input id="confirmPassword" type="password" autocomplete="new-password" v-model="confirmPassword"
              class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
          </div>
          <p v-if="passwordErrors.confirmPassword" class="mt-2 text-sm text-red-600 dark:text-red-500">{{
            passwordErrors.confirmPassword }}</p>
        </div>

        <button type="submit" :disabled="!passwordValid || passwordLoading"
          class="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
          <span v-if="passwordLoading">Changing password...</span>
          <span v-else>Change password</span>
        </button>

        <div v-if="passwordError" class="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
          <p class="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
            <ExclamationCircleIcon class="h-4 w-4" aria-hidden="true" />
            {{ passwordError }}
          </p>
        </div>
      </form>
    </section>
  </div>
</template>
