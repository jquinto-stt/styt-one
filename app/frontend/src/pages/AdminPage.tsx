import { useState } from "react";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Textarea } from "@/elements/form/textarea";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { demoPolicies, demoProjects } from "@/data/demo";

function Disclosure({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-gray-200 bg-white open:pb-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4">
        <span className="font-medium text-gray-800 dark:text-white">{title}</span>
        {meta && <Badge size="sm" color="light">{meta}</Badge>}
      </summary>
      <div className="space-y-4 px-5">{children}</div>
    </details>
  );
}

/** Administración mínima (MVP-06): publicar revisiones de políticas y editar fichas. Solo visual. */
export function AdminPage() {
  const [saved, setSaved] = useState(false);

  return (
    <>
      <PageHeader title="Administración" description="Disponible solo para administradores autorizados." />
      {saved && <div className="mb-6"><Alert variant="success" title="Cambios guardados" message="Vista previa: en la demo visual no se guarda nada." onClose={() => setSaved(false)} /></div>}

      <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">Publicar una política</h2>
      <div className="mb-8 flex flex-col gap-3">
        {demoPolicies.map((p) => (
          <Disclosure key={p.topic} title={p.title} meta={`v${p.version}`}>
            <div>
              <Label>Sección</Label>
              <Input value={p.section} readOnly />
            </div>
            <div>
              <Label>Procedimiento</Label>
              <Textarea rows={4} value={p.summary} readOnly />
            </div>
            <Button size="sm" onClick={() => setSaved(true)}>Publicar versión {p.version + 1}</Button>
          </Disclosure>
        ))}
      </div>

      <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">Actualizar un proyecto</h2>
      <div className="flex flex-col gap-3">
        {demoProjects.map((p) => (
          <Disclosure key={p.id} title={p.name}>
            <div>
              <Label>Descripción</Label>
              <Textarea rows={3} value={p.description} readOnly />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label>Responsable</Label><Input value={p.owner} readOnly /></div>
              <div><Label>Estado</Label><Input value={p.status} readOnly /></div>
              <div><Label>Fecha documentada</Label><Input type="date" value={p.updated ?? ""} readOnly /></div>
            </div>
            <Button size="sm" onClick={() => setSaved(true)}>Guardar ficha</Button>
          </Disclosure>
        ))}
      </div>
    </>
  );
}
