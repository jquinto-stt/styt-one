import { Switch } from "@/elements/form/switch";
import { Badge } from "@/elements/ui/badge";
import { Panel } from "@/components/layout/Panel";
import { demoConnectedApps, demoIntegrations } from "@/data/demo";

/** Ajustes › Apps conectadas: fuentes activas y conectores futuros. */
export function ConnectedAppsSettingsPage() {
  const upcoming = demoIntegrations.filter((i) => i.status === "Próximamente");

  return (
    <>
      <Panel title="Apps conectadas" bodyClassName="p-0">
        <ul>
          {demoConnectedApps.map((a) => (
            <li key={a.name} className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800">
              <span aria-hidden="true" className="connector-mark grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white">{a.name.slice(0, 1)}</span>
              <div className="flex-1">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{a.name}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
              </div>
              <Switch aria-label={a.name} defaultChecked={a.enabled} />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Disponibles más adelante" bodyClassName="p-0">
        <ul>
          {upcoming.map((a) => (
            <li key={a.name} className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800">
              <span aria-hidden="true" className="connector-mark grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white">{a.name.slice(0, 1)}</span>
              <div className="flex-1">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{a.name}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
              </div>
              <Badge size="sm" color="light">Próximamente</Badge>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
