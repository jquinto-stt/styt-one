import { observer } from "mobx-react-lite";
import { uiStore } from "@/stores";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/utils";

const themes = [
  { id: "dark", label: "Oscuro", preview: "bg-gray-950" },
  { id: "light", label: "Claro", preview: "bg-gray-100" },
] as const;

/** Selección de tema compartida con la cabecera. */
export const AppearanceSettingsPage = observer(function AppearanceSettingsPage() {
  return (
    <>
      <Panel title="Tema">
        <div className="grid gap-4 sm:grid-cols-2">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={uiStore.theme === t.id}
              onClick={() => uiStore.setTheme(t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                uiStore.theme === t.id ? "border-brand-500 ring-2 ring-brand-500/30" : "border-gray-200 dark:border-gray-800",
              )}
            >
              <span aria-hidden="true" className={cn("flex h-20 flex-col justify-between rounded-lg border border-gray-500/30 p-3", t.preview, t.id === "light" ? "text-gray-800" : "text-gray-300")}><span className="h-1 w-2/3 rounded bg-current opacity-40" /><span className="text-lg tracking-wide">Aa</span></span>
              <span className="mt-2 block text-theme-sm text-gray-800 dark:text-white">{t.label}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Preferencias">
        <div className="flex flex-col gap-5">
          <div className="max-w-xs">
            <p className="mb-1.5 text-theme-sm text-gray-700 dark:text-gray-400">Idioma de la interfaz</p>
            <Select options={[{ value: "es", label: "Español" }]} defaultValue="es" onChange={() => {}} />
          </div>
          <Switch
            label="Reducir animaciones"
            checked={uiStore.reduceMotion}
            onChange={(value) => uiStore.setReduceMotion(value)}
          />
          <Switch
            label="Barra lateral expandida al iniciar"
            checked={uiStore.sidebarExpanded}
            onChange={(value) => uiStore.setSidebarExpanded(value)}
          />
        </div>
      </Panel>
    </>
  );
});
