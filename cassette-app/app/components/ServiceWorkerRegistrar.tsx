"use client";

import { useEffect } from "react";

/**
 * Registers the service worker and immediately activates any waiting update.
 * This prevents users from being stuck on a cached version after deployments.
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // If there's already a waiting SW (new version installed), activate it now
        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        // When a new SW installs and starts waiting, activate it immediately
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New SW installed — tell it to skip waiting and take control
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        // When the SW takes control, reload so the page uses the new version
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true;
            window.location.reload();
          }
        });
      })
      .catch(() => {
        // SW registration failed — silently ignore (app still works without it)
      });
  }, []);

  return null;
}
