import { Outlet, useLocation } from "react-router";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";

export const settingsSections = [
  { label: "Cuenta", to: "/ajustes/cuenta" },
  { label: "Apariencia", to: "/ajustes/apariencia" },
  { label: "Personalización", to: "/ajustes/personalizacion" },
  { label: "Voz", to: "/ajustes/voz" },
  { label: "Chats archivados", to: "/ajustes/archivados" },
  { label: "Apps conectadas", to: "/ajustes/apps" },
];

/** Ajustes: categorías a la izquierda y la sección activa a la derecha. */
export function SettingsLayout() {
  const { pathname } = useLocation();
  const current = settingsSections.find((s) => s.to === pathname)?.label ?? "Cuenta";

  return (
    <>
      <PageHeader parent="Ajustes" title={current} />
      <WithSubNav nav={<SubNav title="Categorías" items={settingsSections} />}>
        <div className="settings-content flex flex-col gap-5">
          <Outlet />
        </div>
      </WithSubNav>
    </>
  );
}
