import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import { policyCategories } from "@/data/demo";
import { getErrorMessage, getPolicies, type PolicySummary } from "@/services/api";

/** Biblioteca: políticas y documentos autorizados, versionados y filtrables por categoría. */
export function LibraryPage() {
  const [category, setCategory] = useState("Todas");
  const [categories, setCategories] = useState<string[]>(policyCategories);
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = useCallback(async (activeCategory: string) => {
    setLoading(true);
    setError(null);
    try {
      const { policies: loaded } = await getPolicies(
        activeCategory === "Todas" ? undefined : activeCategory,
      );
      setPolicies(loaded);
      if (activeCategory === "Todas") {
        setTotalCount(loaded.length);
        const derived = Array.from(new Set(loaded.map((p) => p.category)));
        setCategories(["Todas", ...derived]);
      }
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar la biblioteca de políticas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPolicies(category);
  }, [category, loadPolicies]);

  const description =
    totalCount !== null
      ? `${totalCount} documentos autorizados para tu cuenta.`
      : "Documentos y políticas corporativas autorizadas.";

  return (
    <>
      <PageHeader title="Biblioteca" description={description} />
      <WithSubNav
        nav={
          <SubNav
            title="Categorías"
            items={categories.map((c) => ({ label: c, active: c === category }))}
            onSelect={setCategory}
          />
        }
      >
        {error && (
          <div className="mb-4 space-y-3">
            <Alert variant="error" title="No se pudo cargar la biblioteca" message={error} />
            <Button size="sm" variant="outline" onClick={() => void loadPolicies(category)}>
              Reintentar
            </Button>
          </div>
        )}

        {loading ? (
          <PageLoadingState variant="cards" label="Cargando biblioteca de políticas…" />
        ) : policies.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-6 text-theme-sm text-gray-400 dark:border-gray-800 dark:bg-gray-dark">
            No se encontraron documentos en esta categoría.
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
            {policies.map((p) => (
              <li key={p.topic} className="border-b border-gray-200 last:border-b-0 dark:border-gray-800">
                <Link
                  to={`/politicas/${p.topic}`}
                  className="block px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 dark:focus-visible:bg-gray-700"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-medium text-gray-800 dark:text-white">{p.title}</h2>
                    <Badge size="xs" color="light">v{p.version}</Badge>
                    {!p.current && <Badge size="xs" color="warning">Sin vigencia</Badge>}
                  </div>
                  <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                    {p.section} · {p.summary}
                  </p>
                  <p className="mt-2 text-theme-xs text-gray-400">
                    {p.category} · Actualizado el {p.updated}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WithSubNav>
    </>
  );
}
