import { useCallback, useEffect, useState } from "react";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Textarea } from "@/elements/form/textarea";
import { Label } from "@/elements/form/label";
import { Alert } from "@/elements/ui/alert";
import { Button } from "@/elements/ui/button";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  getErrorMessage,
  getPreferences,
  updatePreferences,
} from "@/services/api";

const DETAIL_OPTIONS = [
  { value: "Breve", label: "Breve" },
  { value: "Equilibrado", label: "Equilibrado" },
  { value: "Detallado", label: "Detallado" },
];

const TONE_OPTIONS = [
  { value: "Cercano", label: "Cercano" },
  { value: "Profesional y claro", label: "Profesional y claro" },
  { value: "Formal", label: "Formal" },
];

function ensureOption(options: { value: string; label: string }[], current: string) {
  if (!current || options.some((o) => o.value === current)) return options;
  return [{ value: current, label: current }, ...options];
}

/** Ajustes › Personalización: cómo quiere el usuario que le responda el asistente. */
export function PersonalizationSettingsPage() {
  const [detailLevel, setDetailLevel] = useState("Equilibrado");
  const [tone, setTone] = useState("Profesional y claro");
  const [suggestRelated, setSuggestRelated] = useState(true);
  const [additionalContext, setAdditionalContext] = useState("");
  const [loadedVersion, setLoadedVersion] = useState(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { preferences } = await getPreferences();
      setDetailLevel(preferences.detailLevel);
      setTone(preferences.tone);
      setSuggestRelated(preferences.suggestRelated);
      setAdditionalContext(preferences.additionalContext);
      setLoadedVersion((v) => v + 1);
    } catch (err) {
      setLoadError(getErrorMessage(err, "No fue posible cargar tus preferencias."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPreferences();
  }, [loadPreferences]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      const { preferences } = await updatePreferences({
        detailLevel,
        tone,
        alwaysShowSource: true,
        suggestRelated,
        additionalContext,
      });
      setDetailLevel(preferences.detailLevel);
      setTone(preferences.tone);
      setSuggestRelated(preferences.suggestRelated);
      setAdditionalContext(preferences.additionalContext);
      setFeedback({
        variant: "success",
        title: "Preferencias guardadas",
        message: "ST&T ATLAS aplicará estas preferencias en tus próximas consultas.",
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "No se pudieron guardar los cambios",
        message: getErrorMessage(err, "Intenta guardar tus preferencias nuevamente."),
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <PageLoadingState
        variant="form"
        label="Cargando preferencias de ST&T ATLAS…"
      />
    );
  }

  if (loadError) {
    return (
      <div className="space-y-3">
        <Alert variant="error" title="No se pudieron cargar las preferencias" message={loadError} />
        <Button size="sm" variant="outline" onClick={() => void loadPreferences()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSave}>
      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      <Panel title="Respuestas de ST&T ATLAS">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Nivel de detalle</Label>
            <Select
              key={`detail-${loadedVersion}`}
              options={ensureOption(DETAIL_OPTIONS, detailLevel)}
              defaultValue={detailLevel}
              disabled={saving}
              onChange={setDetailLevel}
            />
          </div>
          <div>
            <Label>Tono</Label>
            <Select
              key={`tone-${loadedVersion}`}
              options={ensureOption(TONE_OPTIONS, tone)}
              defaultValue={tone}
              disabled={saving}
              onChange={setTone}
            />
          </div>
        </div>
        <div className="mt-5 flex flex-col gap-4">
          <Switch
            label="Mostrar siempre la fuente de cada respuesta"
            checked
            disabled
          />
          <Switch
            label="Sugerir preguntas relacionadas"
            checked={suggestRelated}
            disabled={saving}
            onChange={setSuggestRelated}
          />
        </div>
      </Panel>

      <Panel title="Contexto adicional">
        <Label>¿Qué debería saber ST&amp;T One sobre tu trabajo?</Label>
        <Textarea
          rows={4}
          maxLength={1000}
          value={additionalContext}
          disabled={saving}
          onChange={setAdditionalContext}
          placeholder="Ejemplo: trabajo en el equipo de desarrollo del proyecto Atlas."
        />
        <p className="mt-2 text-theme-xs text-gray-400">
          No escribas datos personales sensibles ni contraseñas.
        </p>
        <div className="mt-5 flex justify-end">
          <Button type="submit" size="sm" loading={saving}>
            {saving ? "Guardando…" : "Guardar preferencias"}
          </Button>
        </div>
      </Panel>
    </form>
  );
}
