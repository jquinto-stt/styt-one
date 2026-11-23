import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Textarea } from "@/elements/form/textarea";
import { Label } from "@/elements/form/label";
import { Panel } from "@/components/layout/Panel";

/** Ajustes › Personalización: cómo quiere el usuario que le responda el asistente. */
export function PersonalizationSettingsPage() {
  return (
    <>
      <Panel title="Respuestas del asistente">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Nivel de detalle</Label>
            <Select
              options={[
                { value: "breve", label: "Breve" },
                { value: "normal", label: "Normal" },
                { value: "detallado", label: "Detallado" },
              ]}
              defaultValue="normal"
              onChange={() => {}}
            />
          </div>
          <div>
            <Label>Tono</Label>
            <Select
              options={[
                { value: "cercano", label: "Cercano" },
                { value: "formal", label: "Formal" },
              ]}
              defaultValue="cercano"
              onChange={() => {}}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <Switch label="Mostrar siempre la fuente de cada respuesta" defaultChecked disabled />
          <Switch label="Sugerir preguntas relacionadas" defaultChecked />
        </div>
      </Panel>

      <Panel title="Contexto adicional">
        <Label>¿Qué debería saber ST&amp;T One sobre tu trabajo?</Label>
        <Textarea rows={4} placeholder="Ejemplo: trabajo en el equipo de desarrollo del proyecto Atlas." />
        <p className="mt-2 text-theme-xs text-gray-400">No escribas datos personales sensibles ni contraseñas.</p>
      </Panel>
    </>
  );
}
