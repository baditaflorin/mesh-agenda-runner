import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-agenda-runner",
  breadcrumbs: false,
  displayName: "Agenda Runner",
  visualProfile: "utility",
  shellLayout: "inset",
  description: "A live run of show that keeps every person in the room on the same beat.",
  accentHex: "#7ea5ff",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
