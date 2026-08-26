import { expect, test } from "@playwright/test";
import { openTwoPeers } from "@baditaflorin/mesh-common/testing";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as {
  name: string;
};
const storagePrefix = pkg.name;

/**
 * Agenda Runner's product promise is not merely that two pages mount. A beat
 * written by one facilitator and the shared current marker selected by a
 * second facilitator must converge without a server.
 */
test("two peers share agenda beats and the current focus", async ({ browser, baseURL }) => {
  const { a, b, cleanup } = await openTwoPeers(browser, baseURL ?? "", { storagePrefix });
  try {
    await expect(a.getByRole("heading", { level: 1, name: "Keep the room moving." })).toBeVisible();
    await expect(b.getByRole("heading", { level: 1, name: "Keep the room moving." })).toBeVisible();

    const title = "Confirm release scope";
    await expect(a.getByText("Agenda shared live")).toBeVisible();
    await a.getByPlaceholder("e.g. Align on launch decisions").fill(title);
    await expect(a.getByRole("button", { name: "Add to agenda" })).toBeEnabled();
    await a.getByRole("button", { name: "15m" }).click();
    await a.getByRole("button", { name: "Add to agenda" }).click();

    await expect(b.getByText(title, { exact: true })).toBeVisible();
    await b.getByRole("button", { name: `Make ${title} the current item` }).click();
    await expect(
      a.getByTestId("active-agenda").getByRole("heading", { name: title }),
    ).toBeVisible();
    await expect(a.getByRole("progressbar")).toHaveAttribute("value", "1");
  } finally {
    await cleanup();
  }
});
