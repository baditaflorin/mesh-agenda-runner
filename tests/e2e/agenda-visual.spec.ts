import { expect, test, type Locator, type Page } from "@playwright/test";

async function expectInViewport(page: Page, locator: Locator) {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "expected a rendered element").not.toBeNull();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(await page.evaluate(() => window.innerHeight));
}

test.describe("first-view composition", () => {
  test("keeps the agenda action visible on a narrow phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("./", { waitUntil: "domcontentloaded" });

    await expectInViewport(
      page,
      page.getByRole("heading", { level: 1, name: "Keep the room moving." }),
    );
    await expectInViewport(page, page.getByRole("button", { name: "Load a 45-minute session" }));
    const pageBox = await page.locator(".agenda-page").boundingBox();
    expect(pageBox?.width).toBeLessThanOrEqual(390);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test("keeps the shared-plan controls visible in a short desktop window", async ({ page }) => {
    await page.setViewportSize({ width: 1141, height: 602 });
    await page.goto("./", { waitUntil: "domcontentloaded" });

    await expectInViewport(
      page,
      page.getByRole("heading", { level: 1, name: "Keep the room moving." }),
    );
    await expectInViewport(page, page.getByRole("button", { name: "Load a 45-minute session" }));
    await expectInViewport(page, page.getByRole("heading", { level: 2, name: "Add a beat" }));
    await expect(page.getByLabel("What needs the room's attention?")).toBeVisible();
  });
});

test("exposes a labelled, keyboard-operable agenda composer", async ({ page }) => {
  await page.goto("./", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("main")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Keep the room moving." }),
  ).toBeVisible();
  await expect(page.getByLabel("What needs the room's attention?")).toBeVisible();
  await expect(page.getByRole("group", { name: "Agenda item duration" })).toBeVisible();
  await expect(page.getByRole("button", { name: "10m", pressed: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add to agenda" })).toBeDisabled();
});
