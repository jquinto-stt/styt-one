import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@/index.css";
import App from "@/app/App";
import { AppMetaProvider } from "@/shell/meta";
import { ShellProvider } from "@/shell";
import { uiStore } from "@/stores";
import { RootStore } from "@/stores/RootStore";
import { StoreProvider } from "@/stores/StoreProvider";

// ST&T One usa siempre el tema oscuro.
uiStore.setTheme("dark");

// Raíz de estado de la app (MobX). Los stores de sesión, chat, etc. se añaden ahí.
const rootStore = new RootStore();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <StoreProvider store={rootStore}>
      <AppMetaProvider>
        <ShellProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ShellProvider>
      </AppMetaProvider>
    </StoreProvider>
  </StrictMode>
);

export { AppShell } from "@/app/AppShell";
export { AppSidebar } from "@/app/AppSidebar";
