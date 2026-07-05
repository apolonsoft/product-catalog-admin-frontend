import { test, expect } from '@playwright/test'

test('unauthenticated root visit lands on the login page', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('Sign in to your account')
})

test('login form renders expected email and password controls', async ({ page }) => {
  await page.goto('/auth/login')
  await expect(page.locator('input#email')).toBeVisible()
  await expect(page.locator('input#password')).toBeVisible()
  await expect(page.locator('input#remember-me')).toBeVisible()
  await expect(page.locator('button[type="submit"]')).toHaveText('Sign in')
})
