import { useLocation } from "react-router";
import { BaseAppSidebar, MenuSectionHeader, MenuItem } from "@/shell";
import { useDemoSession } from "@/app/DemoSession";
import {
  ChatIcon,
  UserCircleIcon,
  FolderIcon,
  DocsIcon,
  BoxCubeIcon,
  PlugInIcon,
  InfoIcon,
  ListIcon,
  LockIcon,
} from "@/icons";
import { Logo, LogoMark } from "@/components/brand/Logo";

// ═══════════════════════════════════════════════════════════════════════════
// MENÚ DE NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════

const mainItems = [
  { name: "Inicio", path: "/", icon: <ChatIcon /> },
  { name: "Mi perfil", path: "/perfil", icon: <UserCircleIcon /> },
  { name: "Proyectos", path: "/proyectos", icon: <FolderIcon /> },
  { name: "Biblioteca", path: "/biblioteca", icon: <DocsIcon /> },
  { name: "Carpetas", path: "/carpetas", icon: <BoxCubeIcon /> },
  { name: "Integraciones", path: "/integraciones", icon: <PlugInIcon /> },
];

const supportItems = [
  { name: "Ayuda", path: "/ayuda", icon: <InfoIcon /> },
  { name: "Ajustes", path: "/ajustes/cuenta", icon: <ListIcon /> },
];

const SidebarContent = () => {
  // useLocation hace que el menú se re-renderice al navegar y marque el ítem activo.
  const { pathname } = useLocation();
  const { user } = useDemoSession();
  const isAdmin = user?.role === "Administrador";

  const isActive = (path: string) =>
    path === "/"
      ? pathname === "/" || pathname.startsWith("/conversacion")
      : pathname.startsWith(path.replace(/\/cuenta$/, ""));

  return (
    <nav className="mb-6">
      <div className="flex flex-col gap-6">
        <div>
          <MenuSectionHeader title="ST&T ATLAS" />
          <ul className="flex flex-col gap-1">
            {mainItems.map((i) => (
              <MenuItem key={i.path} icon={i.icon} name={i.name} path={i.path} isActive={isActive} />
            ))}
          </ul>
        </div>
        <div>
          <MenuSectionHeader title="Soporte" />
          <ul className="flex flex-col gap-1">
            {supportItems.map((i) => (
              <MenuItem key={i.path} icon={i.icon} name={i.name} path={i.path} isActive={isActive} />
            ))}
            {isAdmin && (
              <MenuItem icon={<LockIcon />} name="Administración" path="/admin" isActive={isActive} />
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

/** Barra lateral de ST&T One. */
export const AppSidebar = () => (
  <BaseAppSidebar logo={<Logo />} logoCollapsed={<LogoMark />}>
    <SidebarContent />
  </BaseAppSidebar>
);

export default AppSidebar;
