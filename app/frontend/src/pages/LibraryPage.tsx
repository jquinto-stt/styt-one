import { useState } from "react";
import { Link } from "react-router";
import { Badge } from "@/elements/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { demoPolicies, policyCategories } from "@/data/demo";

/** Biblioteca: políticas y documentos autorizados, versionados y filtrables por categoría. */
export function LibraryPage() {
  const [category, setCategory] = useState("Todas");
  const items = demoPolicies.filter((p) => category === "Todas" || p.category === category);

  return (
    <>
      <PageHeader title="Biblioteca" description={`${demoPolicies.length} documentos autorizados para tu cuenta.`} />
      <WithSubNav
        nav={
          <SubNav
            title="Categorías"
            items={policyCategories.map((c) => ({ label: c, active: c === category }))}
            onSelect={setCategory}
          />
        }
      >
        <ul className="overflow-hidden rounded-xl bg-white dark:bg-gray-dark border border-gray-200 dark:border-gray-800">
          {items.map((p) => (
            <li key={p.topic} className="border-b border-gray-200 last:border-b-0 dark:border-gray-800">
              <Link to={`/politicas/${p.topic}`} className="block px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:focus-visible:bg-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-medium text-gray-800 dark:text-white">{p.title}</h2>
                  <Badge size="xs" color="light">v{p.version}</Badge>
                  {!p.current && <Badge size="xs" color="warning">Sin vigencia</Badge>}
                </div>
                <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{p.section} · {p.summary}</p>
                <p className="mt-2 text-theme-xs text-gray-400">{p.category} · Actualizado el {p.updated}</p>
              </Link>
            </li>
          ))}
        </ul>
      </WithSubNav>
    </>
  );
}
