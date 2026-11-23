import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import { BaseAppShell } from "@/shell";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { HeaderTitleContext } from "@/components/layout/PageHeader";
import { ChatIcon, DocsIcon, FolderIcon, PlugInIcon } from "@/icons";

const MOBILE_DOCK_ITEMS = [
  { to: "/", label: "Inicio", Icon: ChatIcon },
  { to: "/biblioteca", label: "Biblioteca", Icon: DocsIcon },
  { to: "/carpetas", label: "Carpetas", Icon: FolderIcon },
  { to: "/integraciones", label: "Integraciones", Icon: PlugInIcon },
];

/** Shell autenticado: barra lateral + header + página activa + pie (modo full-bleed en chat). */
export const AppShell = () => {
  const [titleNode, setTitleNode] = useState<HTMLDivElement | null>(null);
  const { pathname } = useLocation();
  const isChatWorkspace = pathname.startsWith("/conversacion");

  return (
    <BaseAppShell
      sidebar={<AppSidebar />}
      header={<AppHeader titleRef={setTitleNode} />}
      fullBleed={isChatWorkspace}
    >
      {isChatWorkspace ? (
        <div className="flex h-full min-h-0 flex-col pb-16 sm:pb-0">
          <div className="min-h-0 flex-1">
            <HeaderTitleContext.Provider value={titleNode}>
              <Outlet />
            </HeaderTitleContext.Provider>
          </div>
          <nav aria-label="Accesos rápidos" className="mobile-dock sm:hidden">
            {MOBILE_DOCK_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end aria-label={label}>
                <Icon className="size-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : (
        <div className="flex min-h-[calc(100vh-8rem)] flex-col pb-16 sm:pb-0">
          <div className="flex-1">
            <HeaderTitleContext.Provider value={titleNode}>
              <Outlet />
            </HeaderTitleContext.Provider>
          </div>
          <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-theme-xs text-gray-400 dark:border-gray-800">
            <span>© 2026 ST&amp;T Ltda. · ST&amp;T One es un nombre de trabajo.</span>
            <span>Datos ficticios · Sin conexión a sistemas productivos</span>
          </footer>
          <nav aria-label="Accesos rápidos" className="mobile-dock sm:hidden">
            {MOBILE_DOCK_ITEMS.map(({ to, label, Icon }) => (
              <NavLink key={to} to={to} end aria-label={label}>
                <Icon className="size-5" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </BaseAppShell>
  );
};

export default AppShell;
