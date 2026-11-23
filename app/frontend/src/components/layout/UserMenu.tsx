import { useCurrentUser, useDemoSession } from "@/app/DemoSession";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Avatar } from "@/elements/ui/avatar";
import { ChevronDownIcon, UserCircleIcon, LockIcon } from "@/icons";

import { DemoNotice } from "@/components/layout/DemoNotice";

const item =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5";

/** Menú de cuenta del header: nombre, rol, accesos y «Cerrar sesión» (solo visual). */
export function UserMenu() {
  const currentUser = useCurrentUser();
  const { signOut } = useDemoSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={`Cuenta de ${currentUser.name}`}
        className="flex items-center gap-3 text-gray-700 dark:text-gray-300"
      >
        <Avatar src="" initials={currentUser.initials} size="medium" />
        <span className="hidden text-left sm:block">
          <span className="block text-theme-sm font-medium">{currentUser.name}</span>
          <span className="block text-theme-xs text-gray-500 dark:text-gray-400">{currentUser.role}</span>
        </span>
        <ChevronDownIcon className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-64 rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark">
          <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{currentUser.name}</p>
          <p className="text-theme-xs text-gray-500 dark:text-gray-400">{currentUser.email}</p>
          <DemoNotice className="mt-2" />
          <ul className="mt-3 flex flex-col gap-1 border-y border-gray-200 py-2 dark:border-gray-800">
            <li><Link to="/perfil" className={item} onClick={() => setOpen(false)}><UserCircleIcon className="size-5" />Mi perfil</Link></li>
            <li><Link to="/ajustes/cuenta" className={item} onClick={() => setOpen(false)}><LockIcon className="size-5" />Ajustes</Link></li>
          </ul>
          <Link replace to="/bienvenida" className={`${item} mt-2`} onClick={signOut}>
            Cerrar sesión
          </Link>
        </div>
      )}
    </div>
  );
}
