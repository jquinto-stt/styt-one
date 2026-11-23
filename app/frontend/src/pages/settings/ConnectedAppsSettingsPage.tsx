import { useCallback, useEffect, useState } from "react";
import { Switch } from "@/elements/form/switch";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Button } from "@/elements/ui/button";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  getErrorMessage,
  getIntegrations,
  getPreferences,
  updatePreferences,
  type ConnectedAppsConfig,
  type IntegrationItem,
} from "@/services/api";

type AppKey = keyof ConnectedAppsConfig;

const APP_SOURCES: { key: AppKey; name: string; description: string; initials: string }[] = [
  {
    key: "policies",
    name: "Políticas corporativas",
    description: "Lectura de documentos autorizados y versionados de ST&T.",
    initials: "PC",
  },
  {
    key: "projects",
    name: "Fichas de proyecto",
    description: "Lectura de proyectos en los que participas.",
    initials: "FP",
  },
  {
    key: "profile",
    name: "Perfil del colaborador",
    description: "Lectura de tus campos de perfil autorizados.",
    initials: "PE",
  },
];

/** Ajustes › Apps conectadas: fuentes activas y conectores futuros. */
export function ConnectedAppsSettingsPage() {
  const [connectedApps, setConnectedApps] = useState<ConnectedAppsConfig>({
    policies: true,
    projects: true,
    profile: true,
  });
  const [upcoming, setUpcoming] = useState<IntegrationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<AppKey | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [prefsRes, integrationsRes] = await Promise.all([
        getPreferences(),
        getIntegrations(),
      ]);
      setConnectedApps(prefsRes.preferences.connectedApps);
      setUpcoming(
        integrationsRes.integrations.filter((i) => i.status === "Próximamente"),
      );
    } catch (err) {
      setLoadError(getErrorMessage(err, "No fue posible cargar las fuentes conectadas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function handleToggle(key: AppKey, nextEnabled: boolean, label: string) {
    if (savingKey) return;
    const previous = connectedApps;
    const nextState: ConnectedAppsConfig = { ...connectedApps, [key]: nextEnabled };
    setConnectedApps(nextState);
    setSavingKey(key);
    setFeedback(null);

    try {
      const { preferences } = await updatePreferences({
        connectedApps: { [key]: nextEnabled },
      });
      setConnectedApps(preferences.connectedApps);
      setFeedback({
        variant: "success",
        title: "Fuente actualizada",
        message: `${label} ${nextEnabled ? "activada" : "desactivada"} para tus consultas.`,
      });
    } catch (err) {
      setConnectedApps(previous);
      setFeedback({
        variant: "error",
        title: "No se pudo actualizar la fuente",
        message: getErrorMessage(err, "Intenta cambiar esta configuración nuevamente."),
      });
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <PageLoadingState
        variant="table"
        label="Cargando fuentes conectadas…"
      />
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <Alert variant="error" title="No se pudieron cargar las apps conectadas" message={loadError} />
        <Button size="sm" variant="outline" onClick={() => void loadData()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <Panel title="Apps conectadas" bodyClassName="p-0">
        <ul>
          {APP_SOURCES.map((a) => (
            <li
              key={a.key}
              className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800"
            >
              <span
                aria-hidden="true"
                className="connector-mark grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white"
              >
                {a.initials}
              </span>
              <div className="flex-1">
                <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{a.name}</p>
                <p className="text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
              </div>
              <Switch
                aria-label={a.name}
                checked={connectedApps[a.key]}
                disabled={savingKey !== null}
                onChange={(checked) => void handleToggle(a.key, checked, a.name)}
              />
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Disponibles más adelante" bodyClassName="p-0">
        {upcoming.length === 0 ? (
          <p className="px-5 py-4 text-theme-sm text-gray-400">No hay conectores próximos registrados.</p>
        ) : (
          <ul>
            {upcoming.map((a) => (
              <li
                key={a.key}
                className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800"
              >
                <span
                  aria-hidden="true"
                  className="connector-mark grid size-9 shrink-0 place-items-center rounded-full text-xs font-medium text-white"
                >
                  {a.initials}
                </span>
                <div className="flex-1">
                  <p className="text-theme-sm font-medium text-gray-800 dark:text-white">{a.name}</p>
                  <p className="text-theme-xs text-gray-500 dark:text-gray-400">{a.description}</p>
                </div>
                <Badge size="sm" color="light">Próximamente</Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
