import { useCallback, useSyncExternalStore } from "react";
import {
  getErrorMessage,
  synthesizeSpeech,
  type VoiceName,
} from "@/services/api";

const STORAGE_KEY = "stt-one-speech-preferences-v3";

const VALID_VOICES: ReadonlySet<VoiceName> = new Set([
  "es-CO-SalomeNeural",
  "es-CO-GonzaloNeural",
  "marin",
  "cedar",
  "coral",
  "sage",
  "alloy",
  "echo",
  "shimmer",
]);

export interface SpeechPreferences {
  language: "es-CO" | "auto";
  voice: VoiceName;
  speed: number;
  autoSpeak: boolean;
  autoStopOnSilence: boolean;
  inputDeviceId: string;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
}

export const DEFAULT_SPEECH_PREFERENCES: SpeechPreferences = {
  language: "es-CO",
  voice: "es-CO-SalomeNeural",
  speed: 1.15,
  autoSpeak: true,
  autoStopOnSilence: true,
  inputDeviceId: "default",
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

function sanitizePreferences(raw: unknown): SpeechPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SPEECH_PREFERENCES };
  }
  const obj = raw as Record<string, unknown>;
  const language = obj.language === "auto" ? "auto" : "es-CO";
  const voice =
    typeof obj.voice === "string" && VALID_VOICES.has(obj.voice as VoiceName)
      ? (obj.voice as VoiceName)
      : DEFAULT_SPEECH_PREFERENCES.voice;
  const speed =
    typeof obj.speed === "number" && Number.isFinite(obj.speed) && obj.speed >= 0.5 && obj.speed <= 2.0
      ? obj.speed
      : DEFAULT_SPEECH_PREFERENCES.speed;

  return {
    language,
    voice,
    speed,
    autoSpeak: typeof obj.autoSpeak === "boolean" ? obj.autoSpeak : DEFAULT_SPEECH_PREFERENCES.autoSpeak,
    autoStopOnSilence:
      typeof obj.autoStopOnSilence === "boolean"
        ? obj.autoStopOnSilence
        : DEFAULT_SPEECH_PREFERENCES.autoStopOnSilence,
    inputDeviceId:
      typeof obj.inputDeviceId === "string" && obj.inputDeviceId.trim().length > 0
        ? obj.inputDeviceId
        : DEFAULT_SPEECH_PREFERENCES.inputDeviceId,
    echoCancellation:
      typeof obj.echoCancellation === "boolean"
        ? obj.echoCancellation
        : DEFAULT_SPEECH_PREFERENCES.echoCancellation,
    noiseSuppression:
      typeof obj.noiseSuppression === "boolean"
        ? obj.noiseSuppression
        : DEFAULT_SPEECH_PREFERENCES.noiseSuppression,
    autoGainControl:
      typeof obj.autoGainControl === "boolean"
        ? obj.autoGainControl
        : DEFAULT_SPEECH_PREFERENCES.autoGainControl,
  };
}

function readStoredPreferences(): SpeechPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_SPEECH_PREFERENCES };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SPEECH_PREFERENCES };
    return sanitizePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SPEECH_PREFERENCES };
  }
}

let cachedPreferences: SpeechPreferences = readStoredPreferences();
const prefListeners = new Set<() => void>();

function notifyPreferences() {
  for (const listener of prefListeners) {
    listener();
  }
}

export function getSpeechPreferences(): SpeechPreferences {
  return cachedPreferences;
}

export function saveSpeechPreferences(patch: Partial<SpeechPreferences>): SpeechPreferences {
  const next = sanitizePreferences({ ...cachedPreferences, ...patch });
  cachedPreferences = next;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota or privacy-mode failures.
    }
  }
  notifyPreferences();
  return next;
}

function subscribePreferences(listener: () => void): () => void {
  prefListeners.add(listener);
  return () => {
    prefListeners.delete(listener);
  };
}

export function useSpeechPreferences(): [
  SpeechPreferences,
  (patch: Partial<SpeechPreferences>) => SpeechPreferences,
] {
  const preferences = useSyncExternalStore(
    subscribePreferences,
    getSpeechPreferences,
    () => DEFAULT_SPEECH_PREFERENCES,
  );
  const update = useCallback(
    (patch: Partial<SpeechPreferences>) => saveSpeechPreferences(patch),
    [],
  );
  return [preferences, update];
}

// ═══════════════════════════════════════════════════════════════════════════
// SINGLETON AUDIO PLAYBACK ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export type SpeechPlayerStatus = "idle" | "loading" | "playing";

export interface SpeechPlayerSnapshot {
  activeId: string | null;
  status: SpeechPlayerStatus;
  error: string | null;
}

let playerSnapshot: SpeechPlayerSnapshot = {
  activeId: null,
  status: "idle",
  error: null,
};

let activeAbortController: AbortController | null = null;
let activeAudio: HTMLAudioElement | null = null;
let activeObjectUrl: string | null = null;
let playbackSequence = 0;

const playerListeners = new Set<() => void>();

function setPlayerSnapshot(next: SpeechPlayerSnapshot) {
  playerSnapshot = next;
  for (const listener of playerListeners) {
    listener();
  }
}

function cleanupActiveMedia() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeAudio) {
    activeAudio.onended = null;
    activeAudio.onerror = null;
    try {
      activeAudio.pause();
      activeAudio.removeAttribute("src");
      activeAudio.load();
    } catch {
      // Ignore teardown errors on detached elements.
    }
    activeAudio = null;
  }
  if (activeObjectUrl) {
    URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }
}

export function stopSpeech(): void {
  playbackSequence += 1;
  cleanupActiveMedia();
  if (
    playerSnapshot.activeId !== null ||
    playerSnapshot.status !== "idle" ||
    playerSnapshot.error !== null
  ) {
    setPlayerSnapshot({ activeId: null, status: "idle", error: null });
  }
}

export function clearSpeechError(): void {
  if (playerSnapshot.error !== null) {
    setPlayerSnapshot({ ...playerSnapshot, error: null });
  }
}

export async function speakMessage(
  id: string,
  text: string,
  override?: Partial<{ voice: VoiceName; speed: number }>,
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  playbackSequence += 1;
  const currentSeq = playbackSequence;
  cleanupActiveMedia();

  const controller = new AbortController();
  activeAbortController = controller;

  const prefs = getSpeechPreferences();
  const voice = override?.voice ?? prefs.voice;
  const speed = override?.speed ?? prefs.speed;

  setPlayerSnapshot({ activeId: id, status: "loading", error: null });

  try {
    const audioBlob = await synthesizeSpeech(
      { text: trimmed, voice, speed },
      controller.signal,
    );

    if (currentSeq !== playbackSequence) {
      return;
    }

    if (!audioBlob || audioBlob.size === 0) {
      setPlayerSnapshot({
        activeId: null,
        status: "idle",
        error: "El servicio de voz devolvió un audio vacío.",
      });
      return;
    }

    const objectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(objectUrl);
    activeObjectUrl = objectUrl;
    activeAudio = audio;
    activeAbortController = null;

    audio.onended = () => {
      if (currentSeq !== playbackSequence) return;
      cleanupActiveMedia();
      setPlayerSnapshot({ activeId: null, status: "idle", error: null });
    };

    audio.onerror = () => {
      if (currentSeq !== playbackSequence) return;
      cleanupActiveMedia();
      setPlayerSnapshot({
        activeId: null,
        status: "idle",
        error: "No se pudo reproducir el audio de la respuesta.",
      });
    };

    await audio.play();

    if (currentSeq !== playbackSequence) {
      cleanupActiveMedia();
      return;
    }

    setPlayerSnapshot({ activeId: id, status: "playing", error: null });
  } catch (err) {
    if (currentSeq !== playbackSequence) {
      return;
    }
    cleanupActiveMedia();

    if (err instanceof DOMException && err.name === "AbortError") {
      setPlayerSnapshot({ activeId: null, status: "idle", error: null });
      return;
    }

    if (err instanceof DOMException && err.name === "NotAllowedError") {
      setPlayerSnapshot({
        activeId: null,
        status: "idle",
        error:
          "El navegador bloqueó la reproducción automática. Pulsa «Escuchar» para oír la respuesta.",
      });
      return;
    }

    setPlayerSnapshot({
      activeId: null,
      status: "idle",
      error: getErrorMessage(err, "No fue posible reproducir la respuesta por voz."),
    });
  }
}

function getPlayerSnapshot(): SpeechPlayerSnapshot {
  return playerSnapshot;
}

function subscribePlayer(listener: () => void): () => void {
  playerListeners.add(listener);
  return () => {
    playerListeners.delete(listener);
  };
}

export function useSpeechPlayer() {
  const snapshot = useSyncExternalStore(
    subscribePlayer,
    getPlayerSnapshot,
    getPlayerSnapshot,
  );
  return {
    activeId: snapshot.activeId,
    status: snapshot.status,
    error: snapshot.error,
    speak: speakMessage,
    stop: stopSpeech,
    clearError: clearSpeechError,
  };
}
