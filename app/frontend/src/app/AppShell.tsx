import { Link, Outlet } from "react-router";
import { BaseAppShell, BaseAppHeader, ToggleAppSidebar } from "@/shell";
import { AppSidebar } from "@/app/AppSidebar";
import { LogoMark } from "@/components/brand/Logo";
import { UserMenu } from "@/components/layout/UserMenu";
import { DemoNotice } from "@/components/layout/DemoNotice";
import { PlusIcon } from "@/icons";

// ═══════════════════════════════════════════════════════════════════════════
// HEADER
// ═══════════════════════════════════════════════════════════════════════════

const AppHeader = () => (
  <BaseAppHeader
    leftContent={
      <div className="flex flex-1 items-center gap-4">
        <ToggleAppSidebar />
        <label className="relative hidden max-w-md flex-1 lg:block">
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            placeholder="Buscar políticas, proyectos o conversaciones…"
            className="h-11 w-full rounded-full border border-gray-200 bg-transparent px-5 text-theme-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-400 focus:outline-hidden dark:border-gray-800 dark:text-white/90"
          />
        </label>
      </div>
    }
    mobileLogo={<LogoMark />}
  >
    <div className="flex items-center gap-4">
      <DemoNotice className="hidden md:inline-flex" />
      <Link
        to="/"
        className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 text-theme-sm font-medium text-gray-900 shadow-theme-xs transition-colors hover:bg-gray-100"
      >
        <PlusIcon className="size-4" />
        Nueva consulta
      </Link>
      <UserMenu />
    </div>
  </BaseAppHeader>
);

// ═══════════════════════════════════════════════════════════════════════════
// SHELL
// ═══════════════════════════════════════════════════════════════════════════

/** Shell autenticado: barra lateral + header + página activa + pie. */
export const AppShell = () => (
  <BaseAppShell sidebar={<AppSidebar />} header={<AppHeader />}>
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-4 text-theme-xs text-gray-400 dark:border-gray-800">
        <span>© 2026 ST&amp;T Ltda. · ST&amp;T One es un nombre de trabajo.</span>
        <span>Datos ficticios · Sin conexión a sistemas productivos</span>
      </footer>
    </div>
  </BaseAppShell>
);

export default AppShell;
