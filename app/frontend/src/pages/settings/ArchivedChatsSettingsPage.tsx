import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/elements/ui/button";
import { Alert } from "@/elements/ui/alert";
import { Panel } from "@/components/layout/Panel";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  deleteConversation,
  formatShortDate,
  getConversations,
  getErrorMessage,
  updateConversation,
  type ConversationSummary,
} from "@/services/api";

/** Ajustes › Chats archivados. */
export function ArchivedChatsSettingsPage() {
  const [chats, setChats] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(null);

  const loadArchived = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { conversations } = await getConversations({ archived: true });
      setChats(conversations);
    } catch (err) {
      setLoadError(getErrorMessage(err, "No fue posible cargar las conversaciones archivadas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadArchived();
  }, [loadArchived]);

  async function handleRestore(chat: ConversationSummary) {
    if (busyId) return;
    setBusyId(chat.id);
    setFeedback(null);
    try {
      await updateConversation(chat.id, { archived: false });
      setChats((prev) => prev.filter((item) => item.id !== chat.id));
      setFeedback({
        variant: "success",
        title: "Conversación restaurada",
        message: `«${chat.title}» volvió a tu historial activo en Carpetas.`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "No se pudo restaurar la conversación",
        message: getErrorMessage(err, "Intenta restaurar la conversación nuevamente."),
      });
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(chat: ConversationSummary) {
    if (busyId) return;
    setBusyId(chat.id);
    setFeedback(null);
    try {
      await deleteConversation(chat.id);
      setChats((prev) => prev.filter((item) => item.id !== chat.id));
      setFeedback({
        variant: "success",
        title: "Conversación eliminada",
        message: `Se eliminó permanentemente «${chat.title}».`,
      });
    } catch (err) {
      setFeedback({
        variant: "error",
        title: "No se pudo eliminar la conversación",
        message: getErrorMessage(err, "Intenta eliminar la conversación nuevamente."),
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Alert
        variant="info"
        title="Conversaciones archivadas"
        message="Las conversaciones archivadas se conservan en tu cuenta y puedes restaurarlas al historial o eliminarlas permanentemente."
      />

      {feedback && (
        <Alert
          variant={feedback.variant}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}

      {loadError && (
        <div className="space-y-3">
          <Alert variant="error" title="No se pudieron cargar los chats archivados" message={loadError} />
          <Button size="sm" variant="outline" onClick={() => void loadArchived()}>
            Reintentar
          </Button>
        </div>
      )}

      {loading ? (
        <PageLoadingState variant="table" label="Cargando chats archivados…" />
      ) : (
        <Panel title="Chats archivados" bodyClassName="p-0">
          {chats.length === 0 ? (
            <p className="px-5 py-6 text-theme-sm text-gray-400">
              No tienes conversaciones archivadas en este momento.
            </p>
          ) : (
            <ul>
              {chats.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 px-5 py-4 last:border-b-0 dark:border-gray-800"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/conversacion/${c.id}`}
                      className="block truncate text-theme-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white dark:hover:text-brand-300"
                    >
                      {c.title}
                    </Link>
                    <p className="text-theme-xs text-gray-400">
                      Actualizado el {formatShortDate(c.updatedAt)}
                      {c.folderName ? ` · ${c.folderName}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId !== null}
                      loading={busyId === c.id}
                      onClick={() => void handleRestore(c)}
                    >
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busyId !== null}
                      onClick={() => void handleDelete(c)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </>
  );
}
