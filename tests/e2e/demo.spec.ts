import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page, email: string) {
  await page.goto("/demo");
  await page.locator(`form:has(input[value="${email}"]) button`).click();
  await page.waitForLoadState("networkidle");
}

test("anonymous visitors are sent to sign in", async ({ page }) => {
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/login/);
});

test("student dashboard, lesson interaction and permission boundary", async ({ page }) => {
  await signIn(page, "maya@example.test");
  await expect(page.getByRole("heading", { name: "Maya" })).toBeVisible();
  await page.goto("/student/lessons/holes");
  const measure = page.getByLabel("Your answer").first();
  await measure.fill("38");
  await page.getByRole("button", { name: "Test" }).first().click();
  await expect(page.getByText("Test result: that doesn't match yet.")).toBeVisible();
  await measure.fill("36");
  await page.getByRole("button", { name: "Test" }).first().click();
  await expect(page.getByText("Test result: that measurement checks out.")).toBeVisible();
  // students can't reach teacher pages
  await page.goto("/teacher");
  await expect(page).toHaveURL(/\/student$/);
});

test("teacher heatmap, review queue and print queue", async ({ page }) => {
  await signIn(page, "teacher@example.test");
  await expect(page.getByText("Students who may need help")).toBeVisible();
  await page.getByRole("link", { name: "Heatmap" }).first().click();
  await expect(page.getByRole("table", { name: "Class skill heatmap" })).toBeVisible();
  await page.goto("/teacher/print-queue");
  await expect(page.getByRole("heading", { name: "Print Queue" })).toBeVisible();
});
