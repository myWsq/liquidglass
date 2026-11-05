import "./styles.css";
import "@myna/liquidglass/styles.css";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./router";

if (import.meta.env.DEV) void import("virtual:stylex:runtime");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Theme theme={neutralTheme} mode="dark">
      <RouterProvider router={router} />
    </Theme>
  </StrictMode>,
);
