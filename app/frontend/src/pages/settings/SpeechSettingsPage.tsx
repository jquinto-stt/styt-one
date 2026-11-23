import { useState } from "react";
import { Button } from "@/elements/ui/button";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Label } from "@/elements/form/label";
import { ProgressBar } from "@/elements/ui/progressbar";
import { Panel } from "@/components/layout/Panel";

// Barras fijas para simular la onda del micrófono (solo visual).
const wave = [30, 55, 40, 70, 45, 85, 60, 35, 75, 50, 90, 40, 65, 30, 80, 55, 45, 70, 35, 60, 50, 85, 40, 65, 30, 55, 75, 45];

/** Ajustes › Voz (evolución posterior al MVP; pantalla conceptual). */
export function SpeechSettingsPage() {
  const [testing, setTesting] = useState(false);

  return (
    <>
      <Panel title="Idioma">
        <div className="max-w-xs">
          <Label>Idioma principal</Label>
          <Select
            options={[
              { value: "auto", label: "Detección automática" },
              { value: "es-CO", label: "Español (Colombia)" },
            ]}
            defaultValue="es-CO"
            onChange={() => {}}
          />
        </div>
      </Panel>

      <Panel title="Audio">
        <div className="grid gap-5 sm:grid-cols-2">
          <div><Label>Micrófono</Label><Select options={[{ value: "default", label: "Micrófono predeterminado" }]} defaultValue="default" onChange={() => {}} /></div>
          <div><Label>Salida</Label><Select options={[{ value: "default", label: "Altavoz predeterminado" }]} defaultValue="default" onChange={() => {}} /></div>
          <div><Label>Volumen de entrada</Label><ProgressBar progress={65} size="sm" /></div>
          <div><Label>Volumen de salida</Label><ProgressBar progress={80} size="sm" /></div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={() => setTesting(!testing)}>{testing ? "Detener prueba" : "Probar micrófono"}</Button>
          <div className="voice-wave flex h-14 min-w-0 flex-1 items-center gap-1" data-testing={testing} aria-hidden="true">
            {wave.map((h, i) => (
              <span
                key={i}
                className={`flex-1 transition-transform rounded-full ${testing ? "bg-brand-400" : "bg-brand-800"}`}
                style={{ height: `${testing ? h : h * 0.62}%`, animationDelay: `${-i * 0.13}s` }}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Procesamiento">
        <div className="flex flex-col gap-4">
          <Switch label="Ajustar la sensibilidad automáticamente" defaultChecked />
          <Switch label="Cancelación de eco" defaultChecked />
          <Switch label="Supresión de ruido" defaultChecked />
        </div>
      </Panel>
    </>
  );
}
