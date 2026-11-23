import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { Alert } from "@/elements/ui/alert";
import { Button } from "@/elements/ui/button";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import { ErrorPage } from "@/pages/ErrorPage";
import {
  ApiError,
  formatShortDate,
  getErrorMessage,
  getPolicy,
  type PolicyDetail,
} from "@/services/api";

/** Fuente documental: la sección exacta que respalda una respuesta (se abre desde el chat o Biblioteca). */
export function PolicySourcePage() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPolicy = useCallback(async () => {
    if (!topic) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    setNotFound(false);
    setError(null);
    try {
      const { policy: loaded } = await getPolicy(topic);
      setPolicy(loaded);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(getErrorMessage(err, "No fue posible cargar el documento solicitado."));
      }
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    void loadPolicy();
  }, [loadPolicy]);

  if (notFound) {
    return (
      <ErrorPage
        code="404"
        title="Documento no encontrado"
        message="La referencia no corresponde a un documento autorizado."
      />
    );
  }

  if (loading) {
    return (
      <article className="mx-auto max-w-3xl">
        <PageLoadingState variant="detail" label="Cargando documento fuente…" />
      </article>
    );
  }

  if (error || !policy) {
    return (
      <article className="mx-auto max-w-3xl space-y-3">
        <Alert
          variant="error"
          title="No se pudo cargar el documento"
          message={error ?? "No fue posible recuperar la política solicitada."}
        />
        <Button size="sm" variant="outline" onClick={() => void loadPolicy()}>
          Reintentar
        </Button>
      </article>
    );
  }

  const paragraphs = policy.body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center gap-4 text-theme-sm">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-brand-400 hover:underline"
        >
          ← Volver
        </button>
        <Link to="/biblioteca" className="text-gray-500 hover:text-brand-400 dark:text-gray-400">
          Ir a la biblioteca
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
        <span>Políticas · {policy.category}</span>
        <Badge size="sm" color="light">v{policy.version}</Badge>
        <Badge size="sm" color={policy.current ? "success" : "warning"}>
          {policy.current ? "Vigente" : "Sin vigencia"}
        </Badge>
      </div>
      <h1 className="mt-2 text-title-sm font-medium text-gray-800 dark:text-white">{policy.title}</h1>

      {!policy.current && (
        <div className="mt-4">
          <Alert
            variant="warning"
            title="Documento sin vigencia"
            message="Este documento no está vigente. Confirma el procedimiento actual con el área responsable."
          />
        </div>
      )}

      <Panel className="mt-6" title={policy.section}>
        <div className="space-y-3 text-theme-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {paragraphs.map((block, index) => (
            <p key={index} className="whitespace-pre-line">
              {block}
            </p>
          ))}
        </div>
        <p className="mt-5 border-t border-gray-200 pt-3 text-theme-xs text-gray-400 dark:border-gray-800">
          Versión v{policy.version} · Actualizado el {policy.updated}
        </p>
      </Panel>

      {policy.versions.length > 1 && (
        <details className="mt-6 rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-theme-sm font-medium text-gray-800 dark:text-white">
            <span>Historial de versiones ({policy.versions.length})</span>
            <span className="text-theme-xs text-gray-400">Expandir</span>
          </summary>
          <ul className="divide-y divide-gray-200 border-t border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {policy.versions.map((v) => (
              <li key={v.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge size="xs" color="light">v{v.version}</Badge>
                  <Badge size="xs" color={v.current ? "success" : "warning"}>
                    {v.current ? "Vigente" : "No vigente"}
                  </Badge>
                  <span className="text-theme-sm font-medium text-gray-800 dark:text-white">
                    {v.section}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-theme-sm text-gray-600 dark:text-gray-300">
                  {v.body}
                </p>
                <p className="mt-2 text-theme-xs text-gray-400">
                  Fecha documentada: {v.updated}
                  {v.createdBy ? ` · Publicado por ${v.createdBy}` : ""}
                  {` · Registrado el ${formatShortDate(v.createdAt)}`}
                </p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}
