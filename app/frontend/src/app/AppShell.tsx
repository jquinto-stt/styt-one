import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { BaseAppShell } from "@/shell";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { HeaderTitleContext } from "@/components/layout/PageHeader";
import { ChatIcon, DocsIcon, FolderIcon, PlugInIcon } from "@/icons";

/** Shell autenticado: barra lateral + header + página activa + pie. */
export const AppShell = () => {
  const [titleNode, setTitleNode] = useState<HTMLDivElement | null>(null);
  return (
  <BaseAppShell sidebar={<AppSidebar />} header={<AppHeader titleRef={setTitleNode} />}>
    <div className="flex pb-16 sm:pb-0 min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1">
        <HeaderTitleContext.Provider value={titleNode}><Outlet /></HeaderTitleContext.Provider>
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-theme-xs text-gray-400 dark:border-gray-800">
        <span>© 2026 ST&amp;T Ltda. · ST&amp;T One es un nombre de trabajo.</span>
        <span>Datos ficticios · Sin conexión a sistemas productivos</span>
      </footer>
      <nav aria-label="Accesos rápidos" className="mobile-dock sm:hidden">
        {[
          { to: "/", label: "Inicio", Icon: ChatIcon },
          { to: "/biblioteca", label: "Biblioteca", Icon: DocsIcon },
          { to: "/carpetas", label: "Carpetas", Icon: FolderIcon },
          { to: "/integraciones", label: "Integraciones", Icon: PlugInIcon },
        ].map(({ to, label, Icon }) => (
          <NavLink key={to} to={to} end aria-label={label}>
            <Icon className="size-5" /><span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  </BaseAppShell>
  );
};

export default AppShell;
