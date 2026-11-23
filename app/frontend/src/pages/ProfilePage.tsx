import { Link } from "react-router";
import { Avatar } from "@/elements/ui/avatar";
import { Badge } from "@/elements/ui/badge";
import { Alert } from "@/elements/ui/alert";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { currentUser, demoProjects } from "@/data/demo";

/** Mi perfil: campos mínimos autorizados del usuario autenticado (MVP-04). */
export function ProfilePage() {
  const fields = [
    ["Nombre", currentUser.name],
    ["Correo corporativo", currentUser.email],
    ["Rol", currentUser.role],
    ["Área", currentUser.area],
  ];
  const myProjects = demoProjects.filter((p) => p.members.includes(currentUser.name));

  return (
    <>
      <PageHeader title="Mi perfil" description="Solo ves tus propios datos autorizados." />
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Información personal">
          <div className="mb-6 flex items-center gap-4">
            <Avatar src="" initials={currentUser.initials} size="xxlarge" />
            <div>
              <p className="text-lg font-medium text-gray-800 dark:text-white">{currentUser.name}</p>
              <p className="text-theme-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
            </div>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-800">
                <dt className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-0.5 text-theme-sm text-gray-800 dark:text-white/90">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Mis proyectos">
            <ul className="flex flex-col gap-3">
              {myProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between">
                  <Link to={`/proyectos/${p.id}`} className="text-theme-sm text-gray-800 hover:text-brand-400 dark:text-white/90">{p.name}</Link>
                  <Badge size="sm" color="primary">{p.status}</Badge>
                </li>
              ))}
            </ul>
          </Panel>
          <Alert
            variant="info"
            title="Datos mínimos"
            message="El prototipo no muestra datos sensibles innecesarios. Qué campos se permiten está pendiente de validar con ST&T."
          />
        </div>
      </div>
    </>
  );
}
