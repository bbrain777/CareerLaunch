import { createKumoToastManager } from "@cloudflare/kumo";

export const appToastManager = createKumoToastManager();

let lastErrorDescription = "";
let lastErrorAt = 0;

export function notifyError(title: string, description: string) {
  const now = Date.now();
  if (description === lastErrorDescription && now - lastErrorAt < 3000) {
    return;
  }
  lastErrorDescription = description;
  lastErrorAt = now;
  appToastManager.add({ title, description, variant: "error" });
}
