import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toasty } from "@cloudflare/kumo";
import { appToastManager } from "./lib/toast";
import { router } from "./router";
import { queryClient } from "./lib/queryClient";
import { AuthProvider } from "./lib/auth";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Toasty toastManager={appToastManager}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </Toasty>
    </QueryClientProvider>
  </StrictMode>
);
