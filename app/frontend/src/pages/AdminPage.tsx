import { useCallback, useEffect, useState } from "react";
import { Button } from "@/elements/ui/button";
import { Input } from "@/elements/form/input";
import { Label } from "@/elements/form/label";
import { Switch } from "@/elements/form/switch";
import { Textarea } from "@/elements/form/textarea";
import { Alert } from "@/elements/ui/alert";
import { Badge } from "@/elements/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/elements/ui/table";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import { ErrorPage } from "@/pages/ErrorPage";
import {
  ApiError,
  formatDateTime,
  getAdminAudit,
  getAdminOverview,
  getErrorMessage,
  publishPolicyVersion,
  updateAdminProject,
  type AdminOverviewStats,
  type AuditLogRecord,
  type PolicySummary,
  type ProjectRecord,
} from "@/services/api";

function Disclosure({
  title,
  meta,
  badgeColor = "light",
  children,
}: {
  title: string;
  meta?: string;
  badgeColor?: "light" | "success" | "warning";
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-2xl border border-gray-200 bg-white open:pb-5 dark:border-gray-800 dark:bg-white/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="font-medium text-gray-800 dark:text-white">{title}</span>
        {meta && <Badge size="sm" color={badgeColor}>{meta}</Badge>}
      </summary>
      <div className="space-y-4 px-5">{children}</div>
    </details>
  );
}

function PolicyEditor({
  policy,
  onPublished,
  onError,
}: {
  policy: PolicySummary;
  onPublished: (updated: PolicySummary) => void;
  onError: (message: string) => void;
}) {
  const [section, setSection] = useState(policy.section);
  const [body, setBody] = useState(policy.body);
  const [current, setCurrent] = useState(policy.current);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSection(policy.section);
    setBody(policy.body);
    setCurrent(policy.current);
  }, [policy.version, policy.section, policy.body, policy.current]);

  async function handlePublish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !section.trim() || !body.trim()) return;
    setSaving(true);
    try {
      const { policy: published } = await publishPolicyVersion(policy.topic, {
        section: section.trim(),
        body: body.trim(),
        current,
      });
      onPublished(published);
    } catch (err) {
      onError(getErrorMessage(err, `No se pudo publicar la nueva versión de ${policy.title}.`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Disclosure
      title={policy.title}
      meta={`v${policy.version} · ${policy.current ? "Vigente" : "Sin vigencia"}`}
      badgeColor={policy.current ? "success" : "warning"}
    >
      <form className="space-y-4" onSubmit={handlePublish}>
        <div>
          <Label>Sección</Label>
          <Input
            value={section}
            required
            maxLength={200}
            disabled={saving}
            onChange={(e) => setSection(e.target.value)}
          />
        </div>
        <div>
          <Label>Procedimiento</Label>
          <Textarea
            rows={5}
            value={body}
            required
            maxLength={10000}
            disabled={saving}
            onChange={setBody}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Switch
            label="Marcar como versión vigente"
            checked={current}
            disabled={saving}
            onChange={setCurrent}
          />
          <Button
            size="sm"
            type="submit"
            loading={saving}
            disabled={!section.trim() || !body.trim()}
          >
            {saving ? "Publicando…" : `Publicar versión ${policy.version + 1}`}
          </Button>
        </div>
      </form>
    </Disclosure>
  );
}

function ProjectEditor({
  project,
  onSaved,
  onError,
}: {
  project: ProjectRecord;
  onSaved: (updated: ProjectRecord) => void;
  onError: (message: string) => void;
}) {
  const [description, setDescription] = useState(project.description);
  const [owner, setOwner] = useState(project.owner);
  const [status, setStatus] = useState(project.status);
  const [updated, setUpdated] = useState(project.updated ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDescription(project.description);
    setOwner(project.owner);
    setStatus(project.status);
    setUpdated(project.updated ?? "");
  }, [project.description, project.owner, project.status, project.updated]);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !description.trim() || !owner.trim() || !status.trim()) return;
    setSaving(true);
    try {
      const { project: saved } = await updateAdminProject(project.id, {
        description: description.trim(),
        owner: owner.trim(),
        status: status.trim(),
        updated: updated.trim() === "" ? null : updated.trim(),
      });
      onSaved(saved);
    } catch (err) {
      onError(getErrorMessage(err, `No se pudo actualizar la ficha de ${project.name}.`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Disclosure
      title={project.name}
      meta={project.updated ? `${project.status} · ${project.updated}` : `${project.status} · Sin documentar`}
    >
      <form className="space-y-4" onSubmit={handleSave}>
        <div>
          <Label>Descripción</Label>
          <Textarea
            rows={3}
            value={description}
            required
            maxLength={2000}
            disabled={saving}
            onChange={setDescription}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Responsable</Label>
            <Input
              value={owner}
              required
              maxLength={120}
              disabled={saving}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          <div>
            <Label>Estado</Label>
            <Input
              value={status}
              required
              maxLength={120}
              disabled={saving}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
          <div>
            <Label>Fecha documentada</Label>
            <Input
              type="date"
              value={updated}
              disabled={saving}
              onChange={(e) => setUpdated(e.target.value)}
              hint="Vacío se guarda como «Sin documentar»."
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            type="submit"
            loading={saving}
            disabled={!description.trim() || !owner.trim() || !status.trim()}
          >
            {saving ? "Guardando…" : "Guardar ficha"}
          </Button>
          {updated && (
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => setUpdated("")}
            >
              Dejar sin documentar
            </Button>
          )}
        </div>
      </form>
    </Disclosure>
  );
}

function outcomeBadgeColor(outcome: string): "success" | "warning" | "error" | "light" {
  if (outcome === "success" || outcome === "found") return "success";
  if (outcome === "denied" || outcome === "blocked" || outcome === "outdated") return "warning";
  if (outcome === "error") return "error";
  return "light";
}

/** Administración mínima (MVP-06): publicar revisiones de políticas, editar fichas y auditar eventos. */
export function AdminPage() {
  const [policies, setPolicies] = useState<PolicySummary[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshingAudit, setRefreshingAudit] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setForbidden(false);
    try {
      const [overviewRes, auditRes] = await Promise.all([
        getAdminOverview(),
        getAdminAudit(30),
      ]);
      setPolicies(overviewRes.policies);
      setProjects(overviewRes.projects);
      setStats(overviewRes.stats);
      setAuditLogs(auditRes.logs);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true);
      } else {
        setLoadError(getErrorMessage(err, "No fue posible cargar el panel de administración."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAuditAndOverview = useCallback(async () => {
    setRefreshingAudit(true);
    try {
      const [overviewRes, auditRes] = await Promise.all([
        getAdminOverview(),
        getAdminAudit(30),
      ]);
      setPolicies(overviewRes.policies);
      setProjects(overviewRes.projects);
      setStats(overviewRes.stats);
      setAuditLogs(auditRes.logs);
    } catch {
      // Non-blocking refresh failure; current state remains visible.
    } finally {
      setRefreshingAudit(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  if (forbidden) {
    return (
      <ErrorPage
        code="403"
        title="Acceso restringido"
        message="La sección de administración está disponible únicamente para administradores autorizados."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Administración"
        description="Disponible solo para administradores autorizados."
      />

      {feedback && (
        <div className="mb-6">
          <Alert
            variant={feedback.variant}
            title={feedback.title}
            message={feedback.message}
            onClose={() => setFeedback(null)}
          />
        </div>
      )}

      {loadError && (
        <div className="mb-6 space-y-3">
          <Alert variant="error" title="No se pudo cargar la administración" message={loadError} />
          <Button size="sm" variant="outline" onClick={() => void loadAll()}>
            Reintentar
          </Button>
        </div>
      )}

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            ["Usuarios", stats.usersCount],
            ["Políticas", stats.policiesCount],
            ["Proyectos", stats.projectsCount],
            ["Consultas", stats.conversationsCount],
            ["Eventos", stats.auditCount],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <p className="text-theme-xs text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-1 text-lg font-semibold text-gray-800 dark:text-white">{value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <PageLoadingState variant="form" label="Cargando panel de administración…" />
      ) : (
        <>
          <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">
            Publicar una política
          </h2>
          <div className="mb-8 flex flex-col gap-3">
            {policies.map((p) => (
              <PolicyEditor
                key={p.topic}
                policy={p}
                onPublished={(published) => {
                  setFeedback({
                    variant: "success",
                    title: "Política publicada",
                    message: `Se publicó la versión v${published.version} de «${published.title}» (${published.current ? "vigente" : "sin vigencia"}).`,
                  });
                  void refreshAuditAndOverview();
                }}
                onError={(message) =>
                  setFeedback({
                    variant: "error",
                    title: "No se pudo publicar la política",
                    message,
                  })
                }
              />
            ))}
          </div>

          <h2 className="mb-3 text-theme-xs uppercase tracking-wide text-gray-400">
            Actualizar un proyecto
          </h2>
          <div className="mb-10 flex flex-col gap-3">
            {projects.map((p) => (
              <ProjectEditor
                key={p.id}
                project={p}
                onSaved={(saved) => {
                  setFeedback({
                    variant: "success",
                    title: "Ficha actualizada",
                    message: `Se guardaron los cambios del proyecto «${saved.name}»${saved.updated ? ` (fecha documentada: ${saved.updated})` : " (fecha: Sin documentar)"}.`,
                  });
                  void refreshAuditAndOverview();
                }}
                onError={(message) =>
                  setFeedback({
                    variant: "error",
                    title: "No se pudo actualizar el proyecto",
                    message,
                  })
                }
              />
            ))}
          </div>

          <Panel
            title="Registro operativo reciente"
            bodyClassName="p-0"
            actions={
              <Button
                size="sm"
                variant="outline"
                loading={refreshingAudit}
                onClick={() => void refreshAuditAndOverview()}
              >
                Actualizar
              </Button>
            }
          >
            {auditLogs.length === 0 ? (
              <p className="px-5 py-6 text-theme-sm text-gray-400">
                Aún no hay eventos registrados.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-b border-gray-200 dark:border-gray-800">
                    <TableRow>
                      {["Fecha y hora", "Evento", "Actor", "Recurso", "Resultado"].map((h) => (
                        <TableCell
                          key={h}
                          header
                          className="px-5 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                        >
                          {h}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-3 font-mono text-theme-xs text-gray-800 dark:text-white/90">
                          {log.eventType}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-600 dark:text-gray-300">
                          {log.actorLogin ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-600 dark:text-gray-300">
                          {log.resource ?? "—"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap px-5 py-3">
                          <Badge size="xs" color={outcomeBadgeColor(log.outcome)}>
                            {log.outcome}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
