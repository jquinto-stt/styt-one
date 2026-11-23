import { useState } from "react";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { demoIntegrations } from "@/data/demo";

const statusColor = { Conectada: "success", Disponible: "info", "Próximamente": "light" } as const;

/** Integraciones: fuentes autorizadas del MVP y conectores previstos para después. */
export function IntegrationsPage() {
  const [filter, setFilter] = useState("Todas");
  const groups = (["Fuentes", "Herramientas"] as const).filter((g) => filter === "Todas" || filter === g);

  return (
    <>
      <PageHeader title="Integraciones" description="Fuentes de información a las que ST&T One puede acceder en tu nombre." />
      <WithSubNav
        nav={
          <SubNav
            title="Categorías"
            items={["Todas", "Fuentes", "Herramientas"].map((c) => ({ label: c, active: c === filter }))}
            onSelect={setFilter}
          />
        }
      >
        {groups.map((group) => (
          <section key={group} className="mb-8">
            <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">{group}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {demoIntegrations
                .filter((i) => i.category === group)
                .map((i) => (
                  <article key={i.name} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-gray-800 dark:text-white">{i.name}</h3>
                        <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{i.description}</p>
                      </div>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-theme-xs font-semibold text-white">
                        {i.initials}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                      <Badge size="sm" color={statusColor[i.status]}>{i.status}</Badge>
                      <Button size="sm" variant="outline" disabled={i.status === "Próximamente"}>
                        {i.status === "Conectada" ? "Ver permisos" : "Conectar"}
                      </Button>
                    </div>
                  </article>
                ))}
            </div>
          </section>
        ))}
      </WithSubNav>
    </>
  );
}
