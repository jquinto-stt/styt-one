import { useCurrentUser } from "@/app/DemoSession";
import { Link } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { demoProjects } from "@/data/demo";

/** Catálogo de proyectos (MVP-05): solo se puede abrir lo que el usuario tiene autorizado. */
export function ProjectsPage() {
  const currentUser = useCurrentUser();
  return (
    <>
      <PageHeader title="Proyectos" description="Catálogo con responsable, estado y fecha documentada." />
      <Panel bodyClassName="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                {["Proyecto", "Responsable", "Estado", "Última actualización documentada", "Acceso"].map((h) => (
                  <TableCell key={h} header className="px-5 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
              {demoProjects.map((p) => {
                const allowed = p.members.includes(currentUser.name);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="px-5 py-4">
                      <p className="text-theme-sm font-medium text-gray-800 dark:text-white/90">{p.name}</p>
                      <p className="text-theme-xs text-gray-500 dark:text-gray-400">{p.description}</p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">{p.owner}</TableCell>
                    <TableCell className="whitespace-nowrap px-5 py-4"><Badge size="sm" color="primary">{p.status}</Badge></TableCell>
                    <TableCell className="px-5 py-4 text-theme-sm text-gray-600 dark:text-gray-300">
                      {p.updated ?? <span className="text-warning-500">Sin documentar</span>}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-5 py-4">
                      {allowed ? (
                        <Link to={`/proyectos/${p.id}`}><Button size="sm" variant="outline">Ver ficha</Button></Link>
                      ) : (
                        <Link to="/sin-acceso"><Button size="sm" variant="ghost">Sin acceso</Button></Link>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </>
  );
}
