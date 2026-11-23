import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, transcribeAudio } from "@/services/api";
import { getSpeechPreferences, stopSpeech } from "@/services/speech";

export type VoiceRecorderState = "idle" | "recording" | "transcribing";

const MAX_RECORDING_MS = 45_000;
const VAD_RMS_THRESHOLD = 0.025;
const VAD_MIN_SPEECH_MS = 250;
const VAD_SILENCE_STOP_MS = 1400;
const BAR_COUNT = 12;
const IDLE_BARS = Array.from({ length: BAR_COUNT }, () => 16);

const PREFERRED_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function selectSupportedMimeType(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "";
  }
  for (const candidate of PREFERRED_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(candidate)) {
      return candidate;
    }
  }
  return "";
}

function mapMicrophoneError(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      return "Permiso de micrófono denegado. Habilita el acceso en tu navegador e intenta nuevamente.";
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
  return "No fue posible acceder al micrófono. Verifica los permisos del navegador.";
}

export interface UseVoiceRecorderResult {
  state: VoiceRecorderState;
  elapsedSeconds: number;
  level: number;
  bars: number[];
  error: string | null;
  startRecording: (onTranscript: (text: string) => void) => Promise<void>;
  stopAndTranscribe: () => void;
  cancelRecording: () => void;
  clearError: () => void;
}

export function useVoiceRecorder(): UseVoiceRecorderResult {
  const [state, setState] = useState<VoiceRecorderState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [level, setLevel] = useState(0);
  const [bars, setBars] = useState<number[]>(IDLE_BARS);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const shouldTranscribeRef = useRef(false);
  const onTranscriptRef = useRef<((text: string) => void) | null>(null);
  const transcribeAbortRef = useRef<AbortController | null>(null);
  const recordedMimeTypeRef = useRef<string>("audio/webm");
  const languageRef = useRef<string>("es-CO");

  const teardownAudioGraph = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      const ctx = audioContextRef.current;
      audioContextRef.current = null;
      void ctx.close().catch(() => {});
    }
  }, []);

  const stopRecorderInternal = useCallback((shouldTranscribe: boolean) => {
    shouldTranscribeRef.current = shouldTranscribe;
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        teardownAudioGraph();
        if (mountedRef.current) {
          setState("idle");
          setLevel(0);
          setBars(IDLE_BARS);
        }
      }
      return;
    }
    teardownAudioGraph();
    if (!shouldTranscribe && transcribeAbortRef.current) {
      transcribeAbortRef.current.abort();
      transcribeAbortRef.current = null;
    }
    if (mountedRef.current) {
      setState("idle");
      setLevel(0);
      setBars(IDLE_BARS);
      setElapsedSeconds(0);
    }
  }, [teardownAudioGraph]);

  const stopAndTranscribe = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      stopRecorderInternal(true);
    }
  }, [stopRecorderInternal]);

  const cancelRecording = useCallback(() => {
    if (transcribeAbortRef.current) {
      transcribeAbortRef.current.abort();
      transcribeAbortRef.current = null;
    }
    stopRecorderInternal(false);
    if (mountedRef.current) {
      setError(null);
      setElapsedSeconds(0);
      setLevel(0);
      setBars(IDLE_BARS);
      setState("idle");
    }
  }, [stopRecorderInternal]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      shouldTranscribeRef.current = false;
      if (transcribeAbortRef.current) {
        transcribeAbortRef.current.abort();
        transcribeAbortRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Ignore teardown errors.
        }
      }
      mediaRecorderRef.current = null;
      teardownAudioGraph();
    };
  }, [teardownAudioGraph]);

  const startRecording = useCallback(
    async (onTranscript: (text: string) => void) => {
      if (state !== "idle") return;

      // Never allow AI playback to bleed into the microphone recording.
      stopSpeech();
      setError(null);

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia ||
        typeof MediaRecorder === "undefined"
      ) {
        setError("Tu navegador no admite la grabación de audio desde el micrófono.");
        return;
      }

      const prefs = getSpeechPreferences();
      onTranscriptRef.current = onTranscript;
      languageRef.current = prefs.language;

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
        if (mountedRef.current) {
          setError(mapMicrophoneError(err));
        }
        return;
      }

      if (!mountedRef.current) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      streamRef.current = stream;
      chunksRef.current = [];
      shouldTranscribeRef.current = true;

      const mimeType = selectSupportedMimeType();
      let recorder: MediaRecorder;
      try {
        const options: MediaRecorderOptions = { audioBitsPerSecond: 32_000 };
        if (mimeType) options.mimeType = mimeType;
        recorder = new MediaRecorder(stream, options);
      } catch {
        recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      }

      recordedMimeTypeRef.current = recorder.mimeType || mimeType || "audio/webm";
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        teardownAudioGraph();
        mediaRecorderRef.current = null;
        if (mountedRef.current) {
          setState("idle");
          setLevel(0);
          setBars(IDLE_BARS);
          setError("Ocurrió un problema durante la grabación de audio.");
        }
      };

      recorder.onstop = async () => {
        const shouldSend = shouldTranscribeRef.current;
        const chunks = chunksRef.current;
        chunksRef.current = [];
        mediaRecorderRef.current = null;
        teardownAudioGraph();

        if (!mountedRef.current) return;

        setLevel(0);
        setBars(IDLE_BARS);

        if (!shouldSend) {
          setState("idle");
          setElapsedSeconds(0);
          return;
        }

        const audioBlob = new Blob(chunks, {
          type: recordedMimeTypeRef.current || "audio/webm",
        });

        if (audioBlob.size < 250) {
          setState("idle");
          setElapsedSeconds(0);
          setError("No se detectó audio suficiente. Intenta hablar más cerca del micrófono.");
          return;
        }

        setState("transcribing");
        const controller = new AbortController();
        transcribeAbortRef.current = controller;

        try {
          const { text } = await transcribeAudio(
            audioBlob,
            languageRef.current,
            controller.signal,
          );
          if (!mountedRef.current) return;
          transcribeAbortRef.current = null;

          const cleanText = text.trim();
          setState("idle");
          setElapsedSeconds(0);

          if (!cleanText) {
            setError("No se detectó voz en la grabación. Intenta hablar nuevamente.");
            return;
          }

          onTranscriptRef.current?.(cleanText);
        } catch (err) {
          if (!mountedRef.current) return;
          transcribeAbortRef.current = null;
          setState("idle");
          setElapsedSeconds(0);

          if (err instanceof DOMException && err.name === "AbortError") {
            return;
          }
          setError(
            getErrorMessage(err, "No fue posible transcribir el audio. Intenta nuevamente."),
          );
        }
      };

      // Set up Web Audio analyser for live bars + optional silence auto-stop (VAD).
      const startedAt = performance.now();
      let speechAccumulatedMs = 0;
      let hasDetectedSpeech = false;
      let silenceStartedAt: number | null = null;
      let lastFrameTime = startedAt;
      let lastUiUpdateAt = 0;

      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioContext = new AudioCtx();
        audioContextRef.current = audioContext;
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.7;
        source.connect(analyser);

        const timeData = new Uint8Array(analyser.fftSize);
        const freqData = new Uint8Array(analyser.frequencyBinCount);

        const sampleLoop = (now: number) => {
          if (!mountedRef.current || mediaRecorderRef.current !== recorder) return;

          const dt = Math.max(0, now - lastFrameTime);
          lastFrameTime = now;

          analyser.getByteTimeDomainData(timeData);
          let sumSquares = 0;
          for (let i = 0; i < timeData.length; i += 1) {
            const normalized = (timeData[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);
          const scaledLevel = Math.min(100, Math.round(rms * 380));

          if (prefs.autoStopOnSilence) {
            if (rms >= VAD_RMS_THRESHOLD) {
              speechAccumulatedMs += dt;
              if (speechAccumulatedMs >= VAD_MIN_SPEECH_MS) {
                hasDetectedSpeech = true;
              }
              silenceStartedAt = null;
            } else if (hasDetectedSpeech) {
              if (silenceStartedAt === null) {
                silenceStartedAt = now;
              } else if (now - silenceStartedAt >= VAD_SILENCE_STOP_MS) {
                stopRecorderInternal(true);
                return;
              }
            }
          }

          if (now - startedAt >= MAX_RECORDING_MS) {
            stopRecorderInternal(true);
            return;
          }

          if (now - lastUiUpdateAt >= 60) {
            lastUiUpdateAt = now;
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

          rafRef.current = requestAnimationFrame(sampleLoop);
        };

        rafRef.current = requestAnimationFrame(sampleLoop);
      } catch {
        // Fallback safety timeout even if AudioContext is unavailable.
      }

      const startWallClock = Date.now();
      setElapsedSeconds(0);
      timerRef.current = window.setInterval(() => {
        const secs = Math.floor((Date.now() - startWallClock) / 1000);
        if (mountedRef.current) {
          setElapsedSeconds(secs);
        }
        if (secs * 1000 >= MAX_RECORDING_MS) {
          stopRecorderInternal(true);
        }
      }, 250);

      recorder.start(250);
      setState("recording");
    },
    [state, stopRecorderInternal, teardownAudioGraph],
  );

  return {
    state,
    elapsedSeconds,
    level,
    bars,
    error,
    startRecording,
    stopAndTranscribe,
    cancelRecording,
    clearError,
  };
}
