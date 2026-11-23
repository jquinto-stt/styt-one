import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectRealtimeVoice,
  getErrorMessage,
  type SourceScope,
} from "@/services/api";
import { getSpeechPreferences, stopSpeech } from "@/services/speech";

export type RealtimeVoiceStatus =
  | "idle"
  | "connecting"
  | "ready"
  | "listening"
  | "thinking"
  | "speaking"
  | "error";

export interface RealtimeTurnPayload {
  userText: string;
  assistantText: string;
}

export interface UseRealtimeVoiceOptions {
  onTurnComplete?: (turn: RealtimeTurnPayload) => void;
}

export interface ConnectRealtimeOptions {
  sourceScope?: SourceScope;
}

const BAR_COUNT = 12;
const IDLE_BARS = Array.from({ length: BAR_COUNT }, () => 16);
const ICE_GATHER_TIMEOUT_MS = 250;
const PENDING_USER_TRANSCRIPT_FALLBACK_MS = 2500;

function mapRealtimeMicError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Permiso de micrófono denegado. Habilita el acceso al micrófono en tu navegador e intenta nuevamente.";
    }
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      return "No se encontró ningún micrófono disponible en este dispositivo.";
    }
    if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      return "El micrófono está siendo utilizado por otra aplicación.";
    }
    if (err.name === "OverconstrainedError") {
      return "El micrófono seleccionado no está disponible. Cambia el dispositivo en Ajustes › Voz.";
    }
  }
  return "No fue posible acceder al micrófono para iniciar la conversación en tiempo real.";
}

function waitForIceGathering(pc: RTCPeerConnection, timeoutMs: number): Promise<void> {
  if (pc.iceGatheringState === "complete") {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      pc.removeEventListener("icegatheringstatechange", onStateChange);
      window.clearTimeout(timer);
      resolve();
    };
    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        finish();
      }
    };
    const timer = window.setTimeout(finish, timeoutMs);
    pc.addEventListener("icegatheringstatechange", onStateChange);
  });
}

function extractResponseTranscript(event: Record<string, unknown>): string {
  const response = event.response as Record<string, unknown> | undefined;
  if (!response || !Array.isArray(response.output)) return "";
  const parts: string[] = [];
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || typeof part !== "object") continue;
      const rec = part as Record<string, unknown>;
      if (typeof rec.transcript === "string" && rec.transcript.trim()) {
        parts.push(rec.transcript.trim());
      } else if (typeof rec.text === "string" && rec.text.trim()) {
        parts.push(rec.text.trim());
      }
    }
  }
  return parts.join(" ").trim();
}

export interface UseRealtimeVoiceResult {
  status: RealtimeVoiceStatus;
  isActive: boolean;
  muted: boolean;
  level: number;
  bars: number[];
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  model: string | null;
  error: string | null;
  connect: (options?: ConnectRealtimeOptions) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  interrupt: () => void;
  clearError: () => void;
}

export function useRealtimeVoice(
  options: UseRealtimeVoiceOptions = {},
): UseRealtimeVoiceResult {
  const [status, setStatus] = useState<RealtimeVoiceStatus>("idle");
  const [muted, setMuted] = useState(false);
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(IDLE_BARS);
  const [liveUserTranscript, setLiveUserTranscript] = useState("");
  const [liveAssistantTranscript, setLiveAssistantTranscript] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onTurnCompleteRef = useRef(options.onTurnComplete);
  useEffect(() => {
    onTurnCompleteRef.current = options.onTurnComplete;
  }, [options.onTurnComplete]);

  const mountedRef = useRef(true);
  const connectionSeqRef = useRef(0);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const connectAbortRef = useRef<AbortController | null>(null);
  const mutedRef = useRef(false);
  const statusRef = useRef<RealtimeVoiceStatus>("idle");

  // Turn transcript assembly & deduplication refs
  const liveUserTextRef = useRef("");
  const liveAssistantTextRef = useRef("");
  const pendingUserTranscriptRef = useRef("");
  const pendingAssistantTurnRef = useRef<{
    key: string;
    assistantText: string;
    timerId: number | null;
  } | null>(null);
  const flushedTurnKeysRef = useRef<Set<string>>(new Set());
  const anonymousTurnCounterRef = useRef(0);

  const updateStatus = useCallback((next: RealtimeVoiceStatus) => {
    statusRef.current = next;
    if (mountedRef.current) {
      setStatus(next);
    }
  }, []);

  const clearPendingAssistantTimer = useCallback(() => {
    if (pendingAssistantTurnRef.current?.timerId !== null && pendingAssistantTurnRef.current?.timerId !== undefined) {
      window.clearTimeout(pendingAssistantTurnRef.current.timerId);
    }
    pendingAssistantTurnRef.current = null;
  }, []);

  const teardownMediaAndPeer = useCallback(() => {
    if (connectAbortRef.current) {
      connectAbortRef.current.abort();
      connectAbortRef.current = null;
    }
    clearPendingAssistantTimer();
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (dcRef.current) {
      try {
        dcRef.current.onmessage = null;
        dcRef.current.onopen = null;
        dcRef.current.onclose = null;
        dcRef.current.onerror = null;
        dcRef.current.close();
      } catch {
        // Ignore teardown errors.
      }
      dcRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {
        // Ignore teardown errors.
      }
      pcRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch {
        // Ignore teardown errors.
      }
      remoteAudioRef.current = null;
    }
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      void ctx.close().catch(() => {});
    }
  }, [clearPendingAssistantTimer]);

  const resetTranscriptState = useCallback(() => {
    clearPendingAssistantTimer();
    liveUserTextRef.current = "";
    liveAssistantTextRef.current = "";
    pendingUserTranscriptRef.current = "";
    if (mountedRef.current) {
      setLiveUserTranscript("");
      setLiveAssistantTranscript("");
    }
  }, [clearPendingAssistantTimer]);

  const emitCompletedTurn = useCallback(
    (turnKey: string, userText: string, assistantText: string) => {
      if (flushedTurnKeysRef.current.has(turnKey)) return;
      const cleanUser = userText.trim();
      const cleanAssistant = assistantText.trim();
      if (!cleanUser || !cleanAssistant) return;

      flushedTurnKeysRef.current.add(turnKey);
      clearPendingAssistantTimer();
      pendingUserTranscriptRef.current = "";
      liveUserTextRef.current = "";
      liveAssistantTextRef.current = "";

      if (mountedRef.current) {
        setLiveUserTranscript("");
        setLiveAssistantTranscript("");
      }

      onTurnCompleteRef.current?.({
        userText: cleanUser,
        assistantText: cleanAssistant,
      });
    },
    [clearPendingAssistantTimer],
  );

  const scheduleOrFlushAssistantTurn = useCallback(
    (rawKey: string | undefined, assistantText: string) => {
      const cleanAssistant = assistantText.trim();
      if (!cleanAssistant) return;

      const turnKey =
        rawKey && rawKey.trim().length > 0
          ? rawKey.trim()
          : `turn-${++anonymousTurnCounterRef.current}`;

      if (flushedTurnKeysRef.current.has(turnKey)) return;

      const availableUserText = (
        pendingUserTranscriptRef.current || liveUserTextRef.current
      ).trim();

      if (availableUserText) {
        emitCompletedTurn(turnKey, availableUserText, cleanAssistant);
        return;
      }

      // Input audio transcription sometimes completes 100-300ms after response audio finishes.
      clearPendingAssistantTimer();
      const timerId = window.setTimeout(() => {
        const pending = pendingAssistantTurnRef.current;
        if (!pending || pending.key !== turnKey) return;
        const fallbackUser = (
          pendingUserTranscriptRef.current ||
          liveUserTextRef.current ||
          "Consulta por voz"
        ).trim();
        emitCompletedTurn(pending.key, fallbackUser, pending.assistantText);
      }, PENDING_USER_TRANSCRIPT_FALLBACK_MS);

      pendingAssistantTurnRef.current = {
        key: turnKey,
        assistantText: cleanAssistant,
        timerId,
      };
    },
    [clearPendingAssistantTimer, emitCompletedTurn],
  );

  const handleDataChannelEvent = useCallback(
    (rawData: string) => {
      let event: Record<string, unknown>;
      try {
        event = JSON.parse(rawData) as Record<string, unknown>;
      } catch {
        return;
      }

      const type = typeof event.type === "string" ? event.type : "";
      if (!type) return;

      switch (type) {
        case "input_audio_buffer.speech_started": {
          // User started speaking (or barged in): clear stale user partial caption.
          liveUserTextRef.current = "";
          pendingUserTranscriptRef.current = "";
          if (mountedRef.current) {
            setLiveUserTranscript("");
          }
          updateStatus("listening");
          break;
        }

        case "input_audio_buffer.speech_stopped": {
          updateStatus("thinking");
          break;
        }

        case "conversation.item.input_audio_transcription.delta": {
          const delta = typeof event.delta === "string" ? event.delta : "";
          if (delta) {
            liveUserTextRef.current += delta;
            if (mountedRef.current) {
              setLiveUserTranscript(liveUserTextRef.current);
            }
          }
          break;
        }

        case "conversation.item.input_audio_transcription.completed": {
          const transcript =
            typeof event.transcript === "string" ? event.transcript.trim() : "";
          if (transcript) {
            pendingUserTranscriptRef.current = transcript;
            liveUserTextRef.current = transcript;
            if (mountedRef.current) {
              setLiveUserTranscript(transcript);
            }
            if (pendingAssistantTurnRef.current) {
              const { key, assistantText } = pendingAssistantTurnRef.current;
              emitCompletedTurn(key, transcript, assistantText);
            }
          }
          break;
        }

        case "response.created": {
          liveAssistantTextRef.current = "";
          if (mountedRef.current) {
            setLiveAssistantTranscript("");
          }
          break;
        }

        case "response.output_audio_transcript.delta":
        case "response.audio_transcript.delta": {
          const delta = typeof event.delta === "string" ? event.delta : "";
          if (delta) {
            liveAssistantTextRef.current += delta;
            if (mountedRef.current) {
              setLiveAssistantTranscript(liveAssistantTextRef.current);
            }
          }
          if (statusRef.current !== "speaking") {
            updateStatus("speaking");
          }
          break;
        }

        case "response.output_audio_transcript.done":
        case "response.audio_transcript.done": {
          const transcript =
            typeof event.transcript === "string" && event.transcript.trim()
              ? event.transcript.trim()
              : liveAssistantTextRef.current.trim();
          const key =
            (typeof event.response_id === "string" && event.response_id) ||
            (typeof event.item_id === "string" && event.item_id) ||
            undefined;
          if (transcript) {
            liveAssistantTextRef.current = transcript;
            if (mountedRef.current) {
              setLiveAssistantTranscript(transcript);
            }
            scheduleOrFlushAssistantTurn(key, transcript);
          }
          break;
        }

        case "output_audio_buffer.started": {
          updateStatus("speaking");
          break;
        }

        case "output_audio_buffer.stopped": {
          if (statusRef.current !== "idle" && statusRef.current !== "error") {
            updateStatus("ready");
          }
          break;
        }

        case "response.done": {
          const responseObj = event.response as Record<string, unknown> | undefined;
          const responseId =
            (responseObj && typeof responseObj.id === "string" && responseObj.id) ||
            (typeof event.response_id === "string" && event.response_id) ||
            undefined;
          const fallbackTranscript =
            extractResponseTranscript(event) || liveAssistantTextRef.current.trim();
          if (fallbackTranscript) {
            scheduleOrFlushAssistantTurn(responseId, fallbackTranscript);
          }
          if (statusRef.current !== "idle" && statusRef.current !== "error") {
            updateStatus("ready");
          }
          break;
        }

        case "error": {
          const errPayload = event.error as Record<string, unknown> | undefined;
          const rawCode = typeof errPayload?.code === "string" ? errPayload.code : "";
          // Benign cancellation race when user interrupts right as response finishes.
          if (rawCode === "response_cancel_not_active") {
            break;
          }
          if (mountedRef.current) {
            setError(
              "Ocurrió una interrupción momentánea en el canal de voz. Puedes seguir hablando o reconectar.",
            );
          }
          break;
        }

        default:
          break;
      }
    },
    [emitCompletedTurn, scheduleOrFlushAssistantTurn, updateStatus],
  );

  const disconnect = useCallback(() => {
    connectionSeqRef.current += 1;
    teardownMediaAndPeer();
    resetTranscriptState();
    mutedRef.current = false;
    if (mountedRef.current) {
      setMuted(false);
      setLevel(0);
      setBars(IDLE_BARS);
      setModel(null);
      setError(null);
      updateStatus("idle");
    }
  }, [resetTranscriptState, teardownMediaAndPeer, updateStatus]);

  const connect = useCallback(
    async (connectOptions?: ConnectRealtimeOptions) => {
      connectionSeqRef.current += 1;
      const mySeq = connectionSeqRef.current;

      teardownMediaAndPeer();
      resetTranscriptState();
      flushedTurnKeysRef.current.clear();
      stopSpeech();

      mutedRef.current = false;
      if (mountedRef.current) {
        setMuted(false);
        setLevel(0);
        setBars(IDLE_BARS);
        setError(null);
      }
      updateStatus("connecting");

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof RTCPeerConnection === "undefined"
      ) {
        if (mountedRef.current && mySeq === connectionSeqRef.current) {
          setError("Tu navegador no admite llamadas de voz en tiempo real (WebRTC).");
          updateStatus("error");
        }
        return;
      }

      const prefs = getSpeechPreferences();
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: prefs.echoCancellation,
        noiseSuppression: prefs.noiseSuppression,
        autoGainControl: prefs.autoGainControl,
      };
      if (prefs.inputDeviceId && prefs.inputDeviceId !== "default") {
        audioConstraints.deviceId = { ideal: prefs.inputDeviceId };
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      } catch (err) {
        if (mountedRef.current && mySeq === connectionSeqRef.current) {
          setError(mapRealtimeMicError(err));
          updateStatus("error");
        }
        return;
      }

      if (!mountedRef.current || mySeq !== connectionSeqRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      streamRef.current = stream;

      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      const remoteAudio = document.createElement("audio");
      remoteAudio.autoplay = true;
      remoteAudio.setAttribute("playsinline", "true");
      remoteAudioRef.current = remoteAudio;

      pc.ontrack = (event) => {
        if (mySeq !== connectionSeqRef.current) return;
        const [remoteStream] = event.streams;
        if (remoteStream) {
          remoteAudio.srcObject = remoteStream;
          void remoteAudio.play().catch(() => {
            if (mountedRef.current && mySeq === connectionSeqRef.current) {
              setError(
                "El navegador bloqueó el audio entrante. Haz clic en la pantalla o reconecta para escuchar a ST&T ATLAS.",
              );
            }
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (mySeq !== connectionSeqRef.current || !mountedRef.current) return;
        if (pc.connectionState === "connected") {
          if (statusRef.current === "connecting") {
            updateStatus("ready");
          }
        } else if (pc.connectionState === "failed") {
          teardownMediaAndPeer();
          setLevel(0);
          setBars(IDLE_BARS);
          setError(
            "Se perdió la conexión de voz en tiempo real. Puedes reconectar en cualquier momento.",
          );
          updateStatus("error");
        }
      };

      for (const track of stream.getAudioTracks()) {
        pc.addTrack(track, stream);
      }

      const dc = pc.createDataChannel("oai-events");
      dcRef.current = dc;

      dc.onopen = () => {
        if (mySeq !== connectionSeqRef.current || !mountedRef.current) return;
        if (statusRef.current === "connecting") {
          updateStatus("ready");
        }
      };

      dc.onmessage = (event) => {
        if (mySeq !== connectionSeqRef.current) return;
        if (typeof event.data === "string") {
          handleDataChannelEvent(event.data);
        }
      };

      dc.onerror = () => {
        if (mySeq !== connectionSeqRef.current || !mountedRef.current) return;
        setError("Ocurrió un error en el canal de eventos de voz en tiempo real.");
      };

      // Live microphone analyser for visual bars.
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);

        const timeData = new Uint8Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);
        let lastUiUpdateAt = 0;

        const sampleLoop = (now: number) => {
          if (!mountedRef.current || mySeq !== connectionSeqRef.current) return;
          if (now - lastUiUpdateAt >= 60) {
            lastUiUpdateAt = now;
            if (mutedRef.current) {
              setLevel(0);
              setBars(IDLE_BARS);
            } else {
              analyser.getByteTimeDomainData(timeData);
              let sumSquares = 0;
              for (let i = 0; i < timeData.length; i += 1) {
                const norm = (timeData[i] - 128) / 128;
                sumSquares += norm * norm;
              }
              const rms = Math.sqrt(sumSquares / timeData.length);
              const scaledLevel = Math.min(100, Math.round(rms * 380));

              analyser.getByteFrequencyData(freqData);
              const binStep = Math.max(1, Math.floor((freqData.length * 0.6) / BAR_COUNT));
              const nextBars: number[] = [];
              for (let b = 0; b < BAR_COUNT; b += 1) {
                const startBin = b * binStep;
                let sum = 0;
                for (let j = 0; j < binStep && startBin + j < freqData.length; j += 1) {
                  sum += freqData[startBin + j];
                }
                const avg = sum / binStep;
                nextBars.push(Math.max(16, Math.min(100, Math.round((avg / 255) * 100))));
              }
              setLevel(scaledLevel);
              setBars(nextBars);
            }
          }
          rafRef.current = requestAnimationFrame(sampleLoop);
        };

        rafRef.current = requestAnimationFrame(sampleLoop);
      } catch {
        // Non-blocking: WebRTC audio still works without visual analyser.
      }

      const abortController = new AbortController();
      connectAbortRef.current = abortController;

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await waitForIceGathering(pc, ICE_GATHER_TIMEOUT_MS);

        if (!mountedRef.current || mySeq !== connectionSeqRef.current) {
          teardownMediaAndPeer();
          return;
        }

        const localSdp = pc.localDescription?.sdp ?? offer.sdp ?? "";
        if (!localSdp) {
          throw new Error("No se pudo generar la oferta de audio WebRTC.");
        }

        const answer = await connectRealtimeVoice(
          {
            sdp: localSdp,
            voice: prefs.voice,
            speed: prefs.speed,
            language: prefs.language,
            sourceScope: connectOptions?.sourceScope,
          },
          abortController.signal,
        );

        if (!mountedRef.current || mySeq !== connectionSeqRef.current) {
          teardownMediaAndPeer();
          return;
        }

        connectAbortRef.current = null;
        const normalizedRemoteSdp = `${answer.sdp.replace(/\r?\n/g, "\r\n").trim()}\r\n`;
        await pc.setRemoteDescription({
          type: "answer",
          sdp: normalizedRemoteSdp,
        });

        if (!mountedRef.current || mySeq !== connectionSeqRef.current) {
          teardownMediaAndPeer();
          return;
        }

        setModel(answer.model);
        if (dc.readyState === "open" || pc.connectionState === "connected") {
          updateStatus("ready");
        }
      } catch (err) {
        if (!mountedRef.current || mySeq !== connectionSeqRef.current) {
          return;
        }
        teardownMediaAndPeer();
        setLevel(0);
        setBars(IDLE_BARS);

        if (err instanceof DOMException && err.name === "AbortError") {
          updateStatus("idle");
          return;
        }

        setError(
          getErrorMessage(
            err,
            "No fue posible iniciar la conversación de voz en tiempo real. Intenta nuevamente.",
          ),
        );
        updateStatus("error");
      }
    },
    [handleDataChannelEvent, resetTranscriptState, teardownMediaAndPeer, updateStatus],
  );

  const toggleMute = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const nextMuted = !mutedRef.current;
    mutedRef.current = nextMuted;
    for (const track of stream.getAudioTracks()) {
      track.enabled = !nextMuted;
    }
    if (mountedRef.current) {
      setMuted(nextMuted);
      if (nextMuted) {
        setLevel(0);
        setBars(IDLE_BARS);
      }
    }
  }, []);

  const interrupt = useCallback(() => {
    const dc = dcRef.current;
    if (dc && dc.readyState === "open") {
      try {
        dc.send(JSON.stringify({ type: "response.cancel" }));
      } catch {
        // Ignore send race if channel just closed.
      }
    }
    if (statusRef.current === "speaking" || statusRef.current === "thinking") {
      updateStatus("ready");
    }
  }, [updateStatus]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      connectionSeqRef.current += 1;
      teardownMediaAndPeer();
    };
  }, [teardownMediaAndPeer]);

  const isActive =
    status === "connecting" ||
    status === "ready" ||
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  return {
    status,
    isActive,
    muted,
    level,
    bars,
    liveUserTranscript,
    liveAssistantTranscript,
    model,
    error,
    connect,
    disconnect,
    toggleMute,
    interrupt,
    clearError,
  };
}
