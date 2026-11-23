import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Alert } from "@/elements/ui/alert";
import { Button } from "@/elements/ui/button";
import { PlusIcon } from "@/icons";
import { PageHeader } from "@/components/layout/PageHeader";
import { SubNav, WithSubNav } from "@/components/layout/SubNav";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { PageLoadingState } from "@/components/feedback/BrandLoader";
import {
  ApiError,
  createFolder,
  formatShortDate,
  getConversations,
  getErrorMessage,
  getFolders,
  type ConversationSummary,
  type FolderRecord,
} from "@/services/api";

const ALL_LABEL = "Todas las consultas";

/** Carpetas: agrupan el historial de consultas por tema, con su propia caja de consulta. */
export function FoldersPage() {
  const navigate = useNavigate();
  const dialog = useRef<HTMLDialogElement>(null);

  const [folders, setFolders] = useState<FolderRecord[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [foldersRes, convRes] = await Promise.all([
        getFolders(),
        getConversations({ archived: false }),
      ]);
      setFolders(foldersRes.folders);
      setConversations(convRes.conversations);
      setSelectedFolderId((prev) => {
        if (prev && foldersRes.folders.some((f) => f.id === prev)) return prev;
        return foldersRes.folders[0]?.id ?? null;
      });
    } catch (err) {
      setError(getErrorMessage(err, "No fue posible cargar tus carpetas e historial."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const selectedFolder = folders.find((f) => f.id === selectedFolderId) ?? null;
  const localDuplicate = folders.some(
    (item) => item.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase(),
  );

  const visibleConversations = selectedFolder
    ? conversations.filter((c) => c.folderId === selectedFolder.id)
    : conversations;

  const navItems = [
    ...folders.map((f) => ({
      label: f.name,
      active: selectedFolder?.id === f.id,
    })),
    {
      label: ALL_LABEL,
      active: selectedFolder === null,
    },
  ];

  function handleSelectNav(label: string) {
    const match = folders.find((f) => f.name === label);
    if (match) {
      setSelectedFolderId(match.id);
    } else if (label === ALL_LABEL) {
      setSelectedFolderId(null);
    }
  }

  async function handleCreateFolder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || localDuplicate || creating) return;

    setCreating(true);
    setCreateError(null);
    try {
      const { folder: created } = await createFolder(trimmed);
      setFolders((prev) => [...prev, created]);
      setSelectedFolderId(created.id);
      setName("");
      dialog.current?.close();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setCreateError(err.message);
      } else {
        setCreateError(getErrorMessage(err, "No se pudo crear la carpeta."));
      }
    } finally {
      setCreating(false);
    }
  }

  function handleSendInFolder(question: string, options?: { viaVoice?: boolean }) {
    navigate("/conversacion", {
      state: {
        initialQuestion: question,
        folderId: selectedFolder?.id,
        viaVoice: Boolean(options?.viaVoice),
      },
    });
  }

  function handleStartRealtimeInFolder() {
    navigate("/conversacion", {
      state: {
        startRealtime: true,
        folderId: selectedFolder?.id,
      },
    });
  }

  return (
    <>
      <PageHeader
        parent="Carpetas"
        title={selectedFolder?.name ?? ALL_LABEL}
        actions={
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setName("");
              setCreateError(null);
              dialog.current?.showModal();
            }}
            startIcon={<PlusIcon className="size-4" />}
          >
            Nueva carpeta
          </Button>
        }
      />

      {error && (
        <div className="mb-6 space-y-3">
          <Alert variant="error" title="No se pudieron cargar las carpetas" message={error} />
          <Button size="sm" variant="outline" onClick={() => void loadData()}>
            Reintentar
          </Button>
        </div>
      )}

      <WithSubNav
        nav={
          <SubNav
            title="Mis carpetas"
            items={navItems}
            onSelect={handleSelectNav}
          />
        }
      >
        <ChatComposer
          placeholder={
            selectedFolder
              ? `Pregunta dentro de «${selectedFolder.name}»…`
              : "Escribe una consulta nueva…"
          }
          onSend={handleSendInFolder}
          onStartRealtime={handleStartRealtimeInFolder}
        />
        <h2 className="mb-3 mt-8 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
          Historial
        </h2>
        {loading ? (
          <PageLoadingState variant="table" label="Cargando carpetas y conversaciones…" />
        ) : visibleConversations.length === 0 ? (
          <p className="text-sm text-gray-400">
            {selectedFolder
              ? "Esta carpeta aún no tiene consultas."
              : "Aún no tienes consultas registradas."}
          </p>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-dark">
            {visibleConversations.map((conv) => (
              <li
                key={conv.id}
                className="border-b border-gray-200 last:border-b-0 dark:border-gray-800"
              >
                <Link
                  to={`/conversacion/${conv.id}`}
                  className="block px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                >
                  <p className="text-base font-medium text-gray-800 dark:text-white">
                    {conv.title}
                  </p>
                  {conv.preview && (
                    <p className="mt-1 line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
                      {conv.preview}
                    </p>
                  )}
                  <p className="mt-2 text-theme-xs text-gray-400">
                    {formatShortDate(conv.updatedAt)}
                    {!selectedFolder && conv.folderName ? ` · ${conv.folderName}` : ""}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </WithSubNav>

      <dialog ref={dialog} className="styt-dialog" aria-labelledby="folder-title">
        <form onSubmit={handleCreateFolder}>
          <h2 id="folder-title" className="mb-5 text-lg font-medium">Nueva carpeta</h2>
          <label htmlFor="folder-name" className="text-sm">Nombre de la carpeta</label>
          <input
            id="folder-name"
            autoFocus
            required
            maxLength={60}
            value={name}
            disabled={creating}
            onChange={(event) => {
              setName(event.target.value);
              if (createError) setCreateError(null);
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
          />
          {(localDuplicate || createError) && (
            <p role="status" className="mt-2 text-sm text-error-500 dark:text-error-400">
              {createError ?? "Ya existe una carpeta con ese nombre."}
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              variant="outline"
              disabled={creating}
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={creating}
              disabled={!name.trim() || localDuplicate}
            >
              Crear carpeta
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
