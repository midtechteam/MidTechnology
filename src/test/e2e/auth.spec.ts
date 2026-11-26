import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL("/auth/login")
  })

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/auth/login")
    await expect(page.getByText("Welcome back")).toBeVisible()
    await expect(page.getByPlaceholder(/email/i)).toBeVisible()
    await expect(page.getByPlaceholder(/password/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible()
  })

  test("signup page renders correctly", async ({ page }) => {
    await page.goto("/auth/signup")
    await expect(page.getByText("Create your account")).toBeVisible()
  })

  test("shows validation errors on empty login submit", async ({ page }) => {
    await page.goto("/auth/login")
    await page.getByRole("button", { name: /sign in/i }).click()
    await expect(page.getByText(/email/i)).toBeVisible()
  })
})

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated state - this would need a proper auth setup
    await page.goto("/auth/login")
  })

  test("404 page displays for unknown routes", async ({ page }) => {
    await page.goto("/unknown-route-xyz")
    await expect(page.getByText("404")).toBeVisible()
  })
})
