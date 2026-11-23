import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useCurrentUser } from "@/app/DemoSession";
import { Avatar } from "@/elements/ui/avatar";
import { Badge } from "@/elements/ui/badge";
import { Alert } from "@/elements/ui/alert";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  getErrorMessage,
  getProfile,
  getProjects,
  type DemoUser,
  type ProjectRecord,
} from "@/services/api";

/** Mi perfil: campos mínimos autorizados del usuario autenticado (MVP-04). */
export function ProfilePage() {
  const sessionUser = useCurrentUser();
  const [profile, setProfile] = useState<DemoUser>(sessionUser);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, projectsRes] = await Promise.all([
        getProfile(),
        getProjects(),
      ]);
      setProfile(profileRes.profile);
      setProjects(projectsRes.projects);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar la información de tu perfil."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const fields = [
    ["Nombre", profile.name],
    ["Correo corporativo", profile.email],
    ["Rol", profile.role],
    ["Área", profile.area],
  ];

  return (
    <>
      <PageHeader title="Mi perfil" description="Solo ves tus propios datos autorizados." />

      {error && (
        <div className="mb-6 space-y-3">
          <Alert variant="error" title="No se pudo cargar tu perfil" message={error} />
          <Button size="sm" variant="outline" onClick={() => void loadData()}>
            Reintentar
          </Button>
        </div>
      )}

      {loading ? (
        <PageLoadingState variant="detail" label="Cargando tu perfil corporativo…" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <Panel className="lg:col-span-2" title="Información personal">
            <div className="mb-6 flex items-center gap-4">
              <Avatar src="" initials={profile.initials} size="xxlarge" />
              <div>
                <p className="text-lg font-medium text-gray-800 dark:text-white">{profile.name}</p>
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
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
              {projects.length === 0 ? (
                <p className="text-theme-sm text-gray-400">No tienes proyectos asignados actualmente.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {projects.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-2">
                      <Link
                        to={`/proyectos/${p.id}`}
                        className="text-theme-sm text-gray-800 hover:text-brand-400 dark:text-white/90"
                      >
                        {p.name}
                      </Link>
                      <Badge size="sm" color="primary">{p.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Alert
              variant="info"
              title="Datos mínimos"
              message="El prototipo no muestra datos sensibles innecesarios. Qué campos se permiten está pendiente de validar con ST&T."
            />
          </div>
        </div>
      )}
    </>
  );
}
