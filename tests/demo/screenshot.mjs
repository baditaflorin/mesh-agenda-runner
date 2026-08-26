export default async function screenshotAgenda(page) {
  await page.getByRole("button", { name: "Load a 45-minute session" }).click();
  await page.getByRole("button", { name: "Start the agenda" }).click();
  await page.waitForTimeout(250);
}
