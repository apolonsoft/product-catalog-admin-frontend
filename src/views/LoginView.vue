<script lang="ts" setup>
import { useForm } from 'vee-validate';
import { object, string, email } from 'zod';
import { toTypedSchema } from '@vee-validate/zod';

const { meta, defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(
    object({
      email: email('Please enter a valid email address').nonempty('Email is required').default(''),
      password: string().min(8, 'Password must be at least 8 characters long').nonempty('Password is required').default(''),
    })
  ),
});

const [emailInput, emailInputAttrs] = defineField('email');
const [passwordInput, passwordInputAttrs] = defineField('password');


const onSubmit = handleSubmit((values) => {
  console.log('Form submitted with values:', values);
});

</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 dark:bg-gray-950">
    <div class="w-full max-w-6xl bg-white rounded-2xl shadow-xl overflow-hidden dark:bg-gray-900">
      <div class="grid lg:grid-cols-2 min-h-[600px]">
        <!-- Brand panel -->
        <div class="relative hidden lg:flex flex-col justify-between bg-indigo-600 p-12 text-white overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700"></div>
          <div class="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-white/10"></div>
          <div class="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10"></div>

          <div class="relative z-10">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span class="text-xl font-bold tracking-tight">VueLearning</span>
            </div>
          </div>

          <div class="relative z-10">
            <blockquote class="space-y-4">
              <p class="text-2xl font-medium leading-relaxed">
                "Build faster, learn deeper, and ship with confidence."
              </p>
              <footer class="text-indigo-100">— The VueLearning Team</footer>
            </blockquote>
          </div>

          <div class="relative z-10 text-sm text-indigo-100">
            &copy; {{ new Date().getFullYear() }} VueLearning. All rights reserved.
          </div>
        </div>

        <!-- Form panel -->
        <div class="flex flex-col justify-center px-5 py-10 sm:px-8 sm:py-12 lg:px-16">
          <!-- Mobile brand -->
          <div class="mb-10 flex items-center gap-3 lg:hidden">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg class="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span class="text-xl font-bold tracking-tight text-gray-900 dark:text-white">VueLearning</span>
          </div>

          <div class="mb-8">
            <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Sign in to your account
            </h1>
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Welcome back! Please enter your details.
            </p>
          </div>

          <form class="space-y-8" method="POST" @submit.prevent="onSubmit">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-900 dark:text-gray-100">Email
                address</label>
              <div class="mt-4">
                <input id="email" type="email" autocomplete="email" v-model="emailInput" v-bind="emailInputAttrs"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
              </div>
              <div class="mt-6">
                <p class="text-sm text-red-600 dark:text-red-500">{{ errors.email }}</p>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between">
                <label for="password"
                  class="block text-sm font-medium text-gray-900 dark:text-gray-100">Password</label>
                <a href="#"
                  class="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                  Forgot password?
                </a>
              </div>
              <div class="mt-4">
                <input id="password" type="password" autocomplete="current-password" v-model="passwordInput"
                  v-bind="passwordInputAttrs"
                  class="block w-full rounded-lg border-0 bg-white px-3.5 py-2.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm dark:bg-white/5 dark:text-white dark:ring-white/10 dark:placeholder:text-gray-500 dark:focus:ring-indigo-500" />
              </div>
              <div class="mt-6">
                <p class="text-sm text-red-600 dark:text-red-500">{{ errors.password }}</p>
              </div>
            </div>

            <div class="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 dark:border-gray-600 dark:bg-white/5 dark:focus:ring-indigo-500" />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900 dark:text-gray-100">Remember me</label>
            </div>

            <button type="submit" :disabled="!meta.touched"
              class="flex w-full justify-center rounded-lg bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:focus-visible:outline-indigo-500">
              Sign in
            </button>
          </form>

          <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Not a member?
            {{ ' ' }}
            <RouterLink to="/auth/register"
              class="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
              Register for free
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
