import { useRef, useState } from "react";
import { Button } from "@/elements/ui/button";
import { PlusIcon } from "@/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { demoFolders, demoHistory } from "@/data/demo";

/** Carpetas: agrupan el historial de consultas por tema, con su propia caja de consulta. */
export function FoldersPage() {
  const [folder, setFolder] = useState(demoFolders[0].name);
  const dialog = useRef<HTMLDialogElement>(null);
  const [folders, setFolders] = useState(demoFolders.map((item) => item.name));
  const [name, setName] = useState("");
  const duplicate = folders.some((item) => item.toLocaleLowerCase() === name.trim().toLocaleLowerCase());
  const history = demoHistory.filter((h) => h.folder === folder);

  return (
    <>
      <PageHeader
        parent="Carpetas"
        title={folder}
        actions={<Button size="sm" variant="outline" onClick={() => { setName(""); dialog.current?.showModal(); }} startIcon={<PlusIcon className="size-4" />}>Nueva carpeta</Button>}
      />
      <WithSubNav
        nav={
          <SubNav
            title="Mis carpetas"
            items={folders.map((label) => ({ label, active: label === folder }))}
            onSelect={setFolder}
          />
        }
      >
        <ChatComposer placeholder={`Pregunta dentro de «${folder}»…`} />
        <h2 className="mb-3 mt-8 text-theme-sm font-medium text-gray-700 dark:text-gray-300">Historial</h2>
        {history.length === 0 && <p className="text-sm text-gray-400">Esta carpeta aún no tiene consultas.</p>}
        <ul className="overflow-hidden rounded-xl bg-white dark:bg-gray-dark">
          {history.map((h) => (
            <li key={h.question} className="border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800">
              <p className="text-base font-medium text-gray-800 dark:text-white">{h.question}</p>
              <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{h.preview}</p>
              <p className="mt-2 text-theme-xs text-gray-400">{h.date}</p>
            </li>
          ))}
        </ul>
      </WithSubNav>
      <dialog ref={dialog} className="styt-dialog" aria-labelledby="folder-title">
        <form onSubmit={(event) => {
          event.preventDefault();
          const next = name.trim();
          if (!next || duplicate) return;
          setFolders([...folders, next]);
          setFolder(next);
          dialog.current?.close();
        }}>
          <h2 id="folder-title" className="mb-5 text-lg font-medium">Nueva carpeta</h2>
          <label htmlFor="folder-name" className="text-sm">Nombre de la carpeta</label>
          <input id="folder-name" autoFocus required maxLength={60} value={name} onChange={(event) => setName(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900 px-3 py-2" />
          {duplicate && <p role="status" className="mt-2 text-sm text-brand-700 dark:text-brand-200">Ya existe una carpeta con ese nombre.</p>}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => dialog.current?.close()}>Cancelar</Button>
            <Button type="submit" disabled={!name.trim() || duplicate}>Crear carpeta</Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
