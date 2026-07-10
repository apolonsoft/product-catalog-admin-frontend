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
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } finally {
    passwordLoading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl">
    <div class="mb-8 sm:mb-10 lg:mb-12">
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-white">Profile</h1>
      <p class="mt-2 text-sm text-gray-600 sm:text-base dark:text-gray-400">
        Manage your account details, avatar, and password.
      </p>
    </div>

    <div class="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <!-- Identity / avatar sidebar -->
      <div class="lg:col-span-4 xl:col-span-3">
        <section
          class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-gray-900 dark:ring-white/10">
          <div class="flex flex-col items-center text-center">
            <div
              class="relative h-28 w-28 overflow-hidden rounded-full bg-indigo-100 ring-1 ring-gray-200 sm:h-32 sm:w-32 dark:bg-indigo-900/30 dark:ring-white/10">
              <img v-if="authStore.user?.avatarFile?.link" :src="authStore.user.avatarFile.link" :alt="displayName"
                class="h-full w-full object-cover" />
              <div v-else
                class="flex h-full w-full items-center justify-center text-3xl font-semibold text-indigo-700 sm:text-4xl dark:text-indigo-300">
                {{ initials }}
              </div>
            </div>

            <h2 class="mt-5 text-lg font-semibold text-gray-900 dark:text-white">{{ displayName }}</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ authStore.user?.email }}</p>

            <div class="mt-6 w-full">
              <input ref="avatarInput" id="avatar" type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
                @change="onAvatarSelected" />
              <label for="avatar"
                class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-white/5 dark:text-white dark:ring-white/10 dark:hover:bg-white/10">
                <ArrowUpTrayIcon class="h-4 w-4" aria-hidden="true" />
                {{ selectedAvatarFile ? 'Change image' : 'Upload new avatar' }}
              </label>

              <p v-if="selectedAvatarFile" class="mt-3 break-words text-sm text-gray-600 dark:text-gray-400">
                Selected: {{ selectedAvatarFile.name }} ({{ (selectedAvatarFile.size / 1024).toFixed(1) }} KB)
              </p>

              <button type="button" :disabled="!selectedAvatarFile || avatarLoading" @click="uploadAvatar"
                class="mt-4 flex w-full justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
                <span v-if="avatarLoading">Uploading...</span>
                <span v-else>Save avatar</span>
              </button>

              <div v-if="avatarSuccess" class="mt-4 rounded-md bg-green-50 p-3 dark:bg-green-900/20">
                <p class="flex items-start justify-center gap-2 text-sm text-green-700 dark:text-green-400">
                  <CheckCircleIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ avatarSuccess }}
                </p>
              </div>
              <div v-if="avatarError" class="mt-4 rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p class="flex items-start justify-center gap-2 text-sm text-red-700 dark:text-red-400">
                  <ExclamationCircleIcon class="h-4 w-4 shrink-0" aria-hidden="true" />
                  {{ avatarError }}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Forms -->
      <div class="space-y-10 lg:col-span-8 xl:col-span-9 lg:space-y-14">
        <!-- Personal information -->
        <section
          class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-gray-900 dark:ring-white/10">
          <div class="border-b border-gray-100 pb-4 dark:border-white/5">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Personal information</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Update your first and last name.</p>
          </div>

          <form class="mt-6 space-y-6 sm:mt-8" @submit.prevent="onProfileSubmit">
            <div class="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <div class="space-y-2">
                <label for="firstName" class="block text-sm font-medium text-gray-900 dark:text-gray-100">First
                  name</label>
                <input id="firstName" type="text" autocomplete="given-name" v-model="firstName"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:px-4 sm:py-3 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
                <p v-if="profileErrors.firstName" class="text-sm text-red-600 dark:text-red-500">{{
                  profileErrors.firstName }}</p>
              </div>

              <div class="space-y-2">
                <label for="lastName" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Last
                  name</label>
                <input id="lastName" type="text" autocomplete="family-name" v-model="lastName"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:px-4 sm:py-3 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
                <p v-if="profileErrors.lastName" class="text-sm text-red-600 dark:text-red-500">{{
                  profileErrors.lastName }}</p>
              </div>
            </div>

            <div class="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center">
              <button type="submit" :disabled="!profileValid || profileLoading"
                class="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
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

        <!-- Change password -->
        <section
          class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-900/5 sm:p-8 dark:bg-gray-900 dark:ring-white/10">
          <div class="border-b border-gray-100 pb-4 dark:border-white/5">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Change password</h2>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose a strong password at least 8 characters
              long.</p>
          </div>

          <form class="mt-6 space-y-6 sm:mt-8" @submit.prevent="onPasswordSubmit">
            <div class="space-y-2">
              <label for="currentPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Current
                password</label>
              <input id="currentPassword" type="password" autocomplete="current-password" v-model="currentPassword"
                class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:px-4 sm:py-3 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
              <p v-if="passwordErrors.currentPassword" class="text-sm text-red-600 dark:text-red-500">{{
                passwordErrors.currentPassword }}</p>
            </div>

            <div class="grid gap-6 sm:grid-cols-2 sm:gap-8">
              <div class="space-y-2">
                <label for="newPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">New
                  password</label>
                <input id="newPassword" type="password" autocomplete="new-password" v-model="newPassword"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:px-4 sm:py-3 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
                <p v-if="passwordErrors.newPassword" class="text-sm text-red-600 dark:text-red-500">{{
                  passwordErrors.newPassword }}</p>
              </div>

              <div class="space-y-2">
                <label for="confirmPassword" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Confirm
                  new password</label>
                <input id="confirmPassword" type="password" autocomplete="new-password" v-model="confirmPassword"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:px-4 sm:py-3 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
                <p v-if="passwordErrors.confirmPassword" class="text-sm text-red-600 dark:text-red-500">{{
                  passwordErrors.confirmPassword }}</p>
              </div>
            </div>

            <div class="pt-2">
              <button type="submit" :disabled="!passwordValid || passwordLoading"
                class="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
                <span v-if="passwordLoading">Changing password...</span>
                <span v-else>Change password</span>
              </button>
            </div>

            <div v-if="passwordError" class="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
              <p class="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                <ExclamationCircleIcon class="h-4 w-4" aria-hidden="true" />
                {{ passwordError }}
              </p>
            </div>
          </form>
        </section>
      </div>
    </div>
  </div>
</template>
