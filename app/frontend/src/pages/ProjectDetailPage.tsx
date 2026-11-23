import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import { ErrorPage } from "@/pages/ErrorPage";
import { ApiError, getErrorMessage, getProject, type ProjectRecord } from "@/services/api";

/** Ficha de proyecto: documento fuente del proyecto (campos vacíos = «Sin documentar»). */
export function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [httpStatus, setHttpStatus] = useState<403 | 404 | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) {
      setHttpStatus(404);
      setLoading(false);
      return;
    }
    setLoading(true);
    setHttpStatus(null);
    setError(null);
    try {
      const { project: loaded } = await getProject(id);
      setProject(loaded);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setHttpStatus(403);
      } else if (err instanceof ApiError && err.status === 404) {
        setHttpStatus(404);
      } else {
        setError(getErrorMessage(err, "No fue posible cargar la ficha del proyecto."));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  if (httpStatus === 403) {
    return (
      <ErrorPage
        code="403"
        title="No tienes acceso a este recurso"
        message="El proyecto solicitado solo está disponible para sus miembros."
      />
    );
  }

  if (httpStatus === 404) {
    return (
      <ErrorPage
        code="404"
        title="Proyecto no encontrado"
        message="No existe una ficha con ese identificador."
      />
    );
  }

  if (loading) {
    return (
      <>
        <PageHeader parent="Proyectos" title="Ficha de proyecto" />
        <PageLoadingState variant="detail" label="Cargando ficha del proyecto…" />
      </>
    );
  }

  if (error || !project) {
    return (
      <>
        <PageHeader parent="Proyectos" title="Ficha de proyecto" />
        <div className="space-y-3">
          <Alert
            variant="error"
            title="No se pudo cargar el proyecto"
            message={error ?? "No fue posible obtener la información del proyecto."}
          />
          <Button size="sm" variant="outline" onClick={() => void loadProject()}>
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  const fields: [string, string | null][] = [
    ["Responsable", project.owner],
    ["Estado", project.status],
    ["Última actualización documentada", project.updated],
    ["Miembros", project.members.length > 0 ? project.members.join(", ") : null],
  ];

  return (
    <>
      <PageHeader
        parent="Proyectos"
        title={project.name}
        description="Ficha de proyecto · Documento fuente"
        actions={
          <Button
            size="sm"
            onClick={() =>
              navigate("/conversacion", {
                state: {
                  initialQuestion: `Resume el estado documentado del proyecto ${project.name}`,
                  sourceScope: "projects",
                  sourceLabel: "Fichas de proyecto",
                },
              })
            }
          >
            Resumir con ST&amp;T ATLAS
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Descripción">
          <p className="whitespace-pre-line text-theme-sm text-gray-600 dark:text-gray-300">
            {project.description}
          </p>
        </Panel>
        <Panel title="Datos documentados">
          <dl className="flex flex-col gap-4">
            {fields.map(([label, value]) => (
              <div key={label}>
                <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">
                  {value ?? <Badge size="sm" color="warning">Sin documentar</Badge>}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
