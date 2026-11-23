import { useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { PlusIcon, GroupIcon, ChevronDownIcon } from "@/icons";
import { ToggleAppSidebar } from "@/shell";
import { UserMenu } from "@/components/layout/UserMenu";

const control = "bar-control";
const newChat = <Link to="/" className="bar-new"><PlusIcon className="size-4" />Nueva consulta</Link>;

function ShareButton({ labeled }: { labeled: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  return <>
    <button className={control} type="button" aria-label="Compartir" onClick={() => { setCopied(false); dialog.current?.showModal(); }}>
      {labeled && "Compartir"}
      <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="m8 11 8-5m-8 7 8 5"/><circle cx="5" cy="12" r="3"/><circle cx="19" cy="5" r="3"/><circle cx="19" cy="19" r="3"/>
      </svg>
    </button>
    <dialog ref={dialog} className="styt-dialog" aria-label="Compartir enlace">
      <form method="dialog">
        <label htmlFor="share-url" className="font-medium">Compartir enlace</label>
        <input ref={input} id="share-url" readOnly value={window.location.href} className="my-4 w-full rounded-lg border border-gray-400 bg-transparent p-2" />
        <div className="flex justify-end gap-2">
          <button type="button" className={control} onClick={async () => {
            try { await navigator.clipboard.writeText(window.location.href); setCopied(true); }
            catch { input.current?.select(); }
          }}>{copied ? "Copiado" : "Copiar enlace"}</button>
          <button className={control}>Cerrar</button>
        </div>
      </form>
    </dialog>
  </>;
}

export function AppHeader({ titleRef }: { titleRef: (node: HTMLDivElement | null) => void }) {
  const { pathname } = useLocation();
  const home = pathname === "/";
  const invite = <a className={control} aria-label="Invitar" href={`mailto:?subject=ST%26T%20One&body=${encodeURIComponent(window.location.origin + "/bienvenida")}`}>
    {home && "Invitar"}<GroupIcon className="size-4" />
  </a>;
  return <header className="stt-topbar">
    <div className="flex w-full items-center justify-between lg:hidden">
      <UserMenu compact alignLeft />
      <div className="flex items-center gap-2"><Link to="/" aria-label="Nueva consulta" className={control}><PlusIcon className="size-4" /></Link><ToggleAppSidebar /></div>
    </div>
    <div className="hidden w-full min-w-0 items-center gap-3 lg:flex">
      {home ? newChat : <div ref={titleRef} className="bar-title min-w-0 truncate">
        {/* Los encabezados de cada sección insertan aquí el título activo. */}
      </div>}
      {!home && <span className="bar-fallback truncate">{pathname === "/ayuda" ? "Ayuda" : "Conversación"}</span>}
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {home ? <>{invite}<ShareButton labeled /><Link to="/ajustes/apariencia" className={control} aria-label="Idioma y apariencia">Español <ChevronDownIcon className="size-4" /></Link></> : <>
          <input type="search" aria-label="Buscar" placeholder="Buscar…" className="h-9 w-40 rounded-full border border-gray-200 bg-gray-50 px-4 text-sm dark:border-gray-700 dark:bg-gray-dark" />
          <ShareButton labeled={false} />{invite}
          <details className="relative"><summary className="bar-control cursor-pointer list-none" aria-label="Notificaciones">
            <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 17h16l-2-3V9a6 6 0 0 0-12 0v5l-2 3Zm6 3a2 2 0 0 0 4 0"/></svg>
          </summary><div className="bar-notices bg-white dark:bg-gray-dark">No tienes notificaciones.</div></details>
          <span className="ml-1 border-l border-gray-300 pl-3 dark:border-gray-700">{newChat}</span>
        </>}
      </div>
    </div>
  </header>;
}
