import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-agenda-runner",
  description: "A shared, live agenda for lightweight facilitated sessions.",
  accentHex: "#237d67",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
