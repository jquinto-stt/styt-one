import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { Panel } from "@/components/layout/Panel";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  getErrorMessage,
  getIntegrations,
  type IntegrationItem,
  type SourceScope,
} from "@/services/api";

const statusColor = { Conectada: "success", Disponible: "info", "Próximamente": "light" } as const;

function isSourceScope(key: string): key is Exclude<SourceScope, "all"> {
  return key === "policies" || key === "projects" || key === "profile";
}

/** Integraciones: fuentes autorizadas del MVP y conectores previstos para después. */
export function IntegrationsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Todas");
  const [params, setParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { integrations: loaded } = await getIntegrations();
      setIntegrations(loaded);
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar las integraciones."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  const fuenteParam = params.get("fuente");
  const selected = fuenteParam
    ? integrations.find((item) => item.key === fuenteParam || item.name === fuenteParam)
    : undefined;

  if (selected) {
    const scope: SourceScope = isSourceScope(selected.key) ? selected.key : "all";
    return (
      <>
        <PageHeader parent="Integraciones" title={selected.name} />
        <Link to="/integraciones" className="mb-5 inline-block text-sm text-brand-700 dark:text-brand-200">
          ← Todas las integraciones
        </Link>

        {!selected.enabled && (
          <div className="mb-5">
            <Alert
              variant="info"
              title="Fuente desactivada en tus preferencias"
              message="Actualmente esta fuente está desactivada en tus ajustes. Actívala para que el asistente pueda consultarla."
              showLink
              linkHref="/ajustes/apps"
              linkText="Administrar en Ajustes › Apps conectadas"
            />
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(16rem,1fr)_2fr]">
          <Panel title={selected.category}>
            <span className="connector-mark mb-4 grid size-12 place-items-center rounded-full text-white">
              {selected.initials}
            </span>
            <h2 className="font-medium text-gray-900 dark:text-white">{selected.name}</h2>
            <p className="my-3 text-sm text-gray-400">{selected.description}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Badge size="sm" color={statusColor[selected.status]}>{selected.status}</Badge>
              <Link to="/ajustes/apps" className="text-theme-xs text-brand-500 hover:underline dark:text-brand-300">
                Configurar acceso
              </Link>
            </div>
          </Panel>
          <div className="flex min-h-64 items-end rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <ChatComposer
              placeholder={`Pregunta sobre ${selected.name.toLowerCase()}…`}
              onSend={(question, options) =>
                navigate("/conversacion", {
                  state: {
                    initialQuestion: question,
                    sourceScope: scope,
                    sourceLabel: selected.name,
                    viaVoice: Boolean(options?.viaVoice),
                  },
                })
              }
              onStartRealtime={() =>
                navigate("/conversacion", {
                  state: {
                    startRealtime: true,
                    sourceScope: scope,
                    sourceLabel: selected.name,
                  },
                })
              }
            />
          </div>
        </div>
      </>
    );
  }

  const groups = (["Fuentes", "Herramientas"] as const).filter(
    (g) => filter === "Todas" || filter === g,
  );

  return (
    <>
      <PageHeader
        title="Integraciones"
        description="Fuentes de información que ST&T ATLAS puede consultar en tu nombre dentro de ST&T One."
      />

      {error && (
        <div className="mb-6 space-y-3">
          <Alert variant="error" title="No se pudieron cargar las integraciones" message={error} />
          <Button size="sm" variant="outline" onClick={() => void loadIntegrations()}>
            Reintentar
          </Button>
        </div>
      )}

      <WithSubNav
        nav={
          <SubNav
            title="Categorías"
            items={["Todas", "Fuentes", "Herramientas"].map((c) => ({
              label: c,
              active: c === filter,
            }))}
            onSelect={setFilter}
          />
        }
      >
        {loading ? (
          <PageLoadingState variant="cards" label="Cargando integraciones autorizadas…" />
        ) : (
          groups.map((group) => {
            const items = integrations.filter((i) => i.category === group);
            if (items.length === 0) return null;
            return (
              <section key={group} className="mb-8">
                <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">{group}</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((i) => (
                    <article
                      key={i.key}
                      className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">{i.name}</h3>
                          <p className="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">
                            {i.description}
                          </p>
                        </div>
                        <span className="connector-mark grid size-10 shrink-0 place-items-center rounded-full text-theme-xs font-semibold text-white">
                          {i.initials}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4 dark:border-gray-800">
                        <Badge size="sm" color={statusColor[i.status]}>{i.status}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setParams({ fuente: i.key })}
                          disabled={i.status === "Próximamente"}
                        >
                          {i.status === "Conectada" ? "Consultar fuente" : "Ver detalle"}
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </WithSubNav>
    </>
  );
}
