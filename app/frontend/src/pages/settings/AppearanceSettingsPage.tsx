import { useState } from "react";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Panel } from "@/components/layout/Panel";
import { cn } from "@/utils";

const themes = [
  { id: "oscuro", label: "Oscuro", preview: "bg-gray-950", available: true },
  { id: "claro", label: "Claro", preview: "bg-gray-100", available: false },
  { id: "sistema", label: "Sistema", preview: "bg-gradient-to-r from-gray-950 to-gray-100", available: false },
];

/** Ajustes › Apariencia. ST&T One usa el tema oscuro; las otras opciones se muestran como futuras. */
export function AppearanceSettingsPage() {
  const [theme, setTheme] = useState("oscuro");

  return (
    <>
      <Panel title="Tema">
        <div className="grid gap-4 sm:grid-cols-3">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              disabled={!t.available}
              onClick={() => setTheme(t.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                theme === t.id ? "border-brand-500 ring-2 ring-brand-500/30" : "border-gray-200 dark:border-gray-800",
              )}
            >
              <span className={cn("block h-16 rounded-lg border border-white/10", t.preview)} />
              <span className="mt-2 block text-theme-sm text-gray-800 dark:text-white">{t.label}</span>
              {!t.available && <span className="text-theme-xs text-gray-400">Próximamente</span>}
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
          <Switch label="Reducir animaciones" />
          <Switch label="Barra lateral expandida al iniciar" defaultChecked />
        </div>
      </Panel>
    </>
  );
}
