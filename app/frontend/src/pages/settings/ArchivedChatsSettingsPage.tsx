import { Button } from "@/elements/ui/button";
import { Alert } from "@/elements/ui/alert";
import { Panel } from "@/components/layout/Panel";
import { demoArchivedChats } from "@/data/demo";

/** Ajustes › Chats archivados. */
export function ArchivedChatsSettingsPage() {
  return (
    <>
      <Alert
        variant="info"
        title="Conversaciones de la sesión"
        message="En el MVP los mensajes solo duran mientras la pestaña está abierta. Esta lista muestra cómo se verían los chats archivados."
      />
      <Panel title="Chats archivados" bodyClassName="p-0">
        <ul>
          {demoArchivedChats.map((c) => (
            <li key={c.title} className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800">
              <div>
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{c.title}</p>
                <p className="text-theme-xs text-gray-400">Archivado el {c.date}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Restaurar</Button>
                <Button size="sm" variant="ghost">Eliminar</Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
