import { useCurrentUser } from "@/app/DemoSession";
import { Avatar } from "@/elements/ui/avatar";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Select } from "@/elements/form/select";
import { PencilIcon } from "@/icons";
import { Panel } from "@/components/layout/Panel";




/** Ajustes › Cuenta: datos de la cuenta (solo lectura en la demo). */
export function AccountSettingsPage() {
  const currentUser = useCurrentUser();
  const [firstName, ...rest] = currentUser.name.split(" ");
  return (
    <>
      <Panel
        title="Información personal"
        actions={<Button size="sm" variant="outline" startIcon={<PencilIcon className="size-4" />} disabled>Editar</Button>}
      >
        <div className="mb-6 flex items-center gap-4">
          <Avatar src="" initials={currentUser.initials} size="xlarge" />
          <div>
            <p className="text-lg font-medium text-gray-800 dark:text-white">{currentUser.name}</p>
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">{currentUser.email}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Nombre</Label><Input value={firstName} readOnly /></div>
          <div><Label>Apellido</Label><Input value={rest.join(" ")} readOnly /></div>
          <div><Label>Correo corporativo</Label><Input type="email" value={currentUser.email} readOnly /></div>
          <div>
            <Label>Área</Label>
            <Select options={[{ value: currentUser.area, label: currentUser.area }]} defaultValue={currentUser.area} onChange={() => {}} disabled />
          </div>
        </div>
      </Panel>

      <Panel title="Rol y acceso">
        <p className="text-theme-sm text-gray-600 dark:text-gray-300">
          Rol actual: <b className="text-gray-800 dark:text-white">{currentUser.role}</b>. Los permisos los gestiona un
          administrador autorizado y se aplican en el servidor en cada consulta.
        </p>
      </Panel>
    </>
  );
}
