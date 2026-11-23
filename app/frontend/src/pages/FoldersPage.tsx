import { useState } from "react";
import { Button } from "@/elements/ui/button";
import { PlusIcon } from "@/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { demoFolders, demoHistory } from "@/data/demo";

/** Carpetas: agrupan el historial de consultas por tema, con su propia caja de consulta. */
export function FoldersPage() {
  const [folder, setFolder] = useState(demoFolders[0].name);
  const history = demoHistory.filter((h) => h.folder === folder);

  return (
    <>
      <PageHeader
        parent="Carpetas"
        title={folder}
        actions={<Button size="sm" variant="outline" startIcon={<PlusIcon className="size-4" />}>Nueva carpeta</Button>}
      />
      <WithSubNav
        nav={
          <SubNav
            title="Mis carpetas"
            items={demoFolders.map((f) => ({ label: f.name, active: f.name === folder }))}
            onSelect={setFolder}
          />
        }
      >
        <ChatComposer placeholder={`Pregunta dentro de «${folder}»…`} />
        <h2 className="mb-3 mt-8 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Historial</h2>
        <ul className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
          {history.map((h) => (
            <li key={h.question} className="border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800">
              <p className="text-base font-medium text-gray-800 dark:text-white">{h.question}</p>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{h.preview}</p>
              <p className="mt-2 text-theme-xs text-gray-400">{h.date}</p>
            </li>
          ))}
        </ul>
      </WithSubNav>
    </>
  );
}
