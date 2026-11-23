import { Link, useParams } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { demoProjects } from "@/data/demo";
import { ErrorPage } from "@/pages/ErrorPage";

/** Ficha de proyecto: documento fuente del proyecto (campos vacíos = «Sin documentar»). */
export function ProjectDetailPage() {
  const { id } = useParams();
  const project = demoProjects.find((p) => p.id === id);
  if (!project) return <ErrorPage code="404" title="Proyecto no encontrado" message="No existe una ficha con ese identificador." />;

  const fields: [string, string | null][] = [
    ["Responsable", project.owner],
    ["Estado", project.status],
    ["Última actualización documentada", project.updated],
    ["Miembros", project.members.join(", ")],
  ];

  return (
    <>
      <PageHeader
        parent="Proyectos"
        title={project.name}
        description="Ficha de proyecto · Documento fuente"
        actions={<Link to="/conversacion"><Button size="sm">Resumir con ST&amp;T One</Button></Link>}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Descripción">
          <p className="text-theme-sm text-gray-600 dark:text-gray-300">{project.description}</p>
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
