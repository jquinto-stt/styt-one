import { Link, useParams } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { Alert } from "@/elements/ui/alert";
import { Panel } from "@/components/layout/Panel";
import { demoPolicies } from "@/data/demo";
import { ErrorPage } from "@/pages/ErrorPage";

/** Fuente documental: la sección exacta que respalda una respuesta (se abre desde el chat). */
export function PolicySourcePage() {
  const { topic } = useParams();
  const policy = demoPolicies.find((p) => p.topic === topic);
  if (!policy) return <ErrorPage code="404" title="Documento no encontrado" message="La referencia no corresponde a un documento autorizado." />;

  return (
    <article className="mx-auto max-w-3xl">
      <Link to="/conversacion" className="text-theme-sm text-brand-400 hover:underline">← Volver al asistente</Link>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
        <span>Políticas · {policy.category}</span>
        <Badge size="sm" color="light">Versión {policy.version}</Badge>
        <Badge size="sm" color={policy.current ? "success" : "warning"}>{policy.current ? "Vigente" : "Sin vigencia"}</Badge>
      </div>
      <h1 className="mt-2 text-title-sm font-medium text-gray-800 dark:text-white">{policy.title}</h1>

      {!policy.current && (
        <div className="mt-4"><Alert variant="warning" title="Documento sin vigencia" message="Este documento no está vigente. Confirma el procedimiento actual con el área responsable." /></div>
      )}

      <Panel className="mt-6" title={policy.section}>
        <p className="text-theme-sm leading-relaxed text-gray-600 dark:text-gray-300">{policy.summary}</p>
        <p className="mt-4 text-theme-xs text-gray-400">Actualizado el {policy.updated} · Contenido ficticio de demostración.</p>
      </Panel>
    </article>
  );
}
