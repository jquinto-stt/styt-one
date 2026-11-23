import { useCallback, useEffect, useRef, useState } from "react";
import { Alert } from "@/elements/ui/alert";
import { Button } from "@/elements/ui/button";
import { Select } from "@/elements/form/select";
import { Switch } from "@/elements/form/switch";
import { Label } from "@/elements/form/label";
import { ProgressBar } from "@/elements/ui/progressbar";
import { Panel } from "@/components/layout/Panel";
import type { VoiceName } from "@/services/api";
import {
  stopSpeech,
  useSpeechPlayer,
  useSpeechPreferences,
} from "@/services/speech";

const BAR_COUNT = 28;
const IDLE_WAVE = [
  30, 55, 40, 70, 45, 85, 60, 35, 75, 50, 90, 40, 65, 30,
  80, 55, 45, 70, 35, 60, 50, 85, 40, 65, 30, 55, 75, 45,
];

const VOICE_OPTIONS: { value: VoiceName; label: string }[] = [
  { value: "es-CO-SalomeNeural", label: "Salomé — Colombia (Neural nativa · Femenina)" },
  { value: "es-CO-GonzaloNeural", label: "Gonzalo — Colombia (Neural nativa · Masculina)" },
  { value: "marin", label: "Marin — Voz en vivo natural (Femenina)" },
  { value: "cedar", label: "Cedar — Voz en vivo natural (Masculina)" },
  { value: "coral", label: "Coral — Expresiva" },
  { value: "sage", label: "Sage — Serena" },
];

const SPEED_OPTIONS = [
  { value: "1", label: "1.0x (Estándar)" },
  { value: "1.15", label: "1.15x (Ágil · Recomendada)" },
  { value: "1.25", label: "1.25x (Rápida)" },
  { value: "1.35", label: "1.35x (Muy rápida)" },
];

const VOICE_TEST_ID = "__voice_settings_sample__";
const VOICE_SAMPLE_TEXT =
  "Hola, soy ST&T ATLAS, tu asistente corporativo en ST&T One. Hablo en español colombiano natural y estoy listo para ayudarte.";

interface InputDeviceOption {
  value: string;
  label: string;
}

const DEFAULT_DEVICE_OPTION: InputDeviceOption = {
  value: "default",
  label: "Micrófono predeterminado",
};

function mapMicTestError(err: unknown): string {
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
  }
  return "No fue posible iniciar la prueba de micrófono. Verifica los permisos del navegador.";
}

/** Ajustes › Voz: configuración real de micrófono, transcripción y voz de respuesta. */
export function SpeechSettingsPage() {
  const [prefs, updatePrefs] = useSpeechPreferences();
  const speechPlayer = useSpeechPlayer();

  const [inputDevices, setInputDevices] = useState<InputDeviceOption[]>([DEFAULT_DEVICE_OPTION]);
  const [devicesVersion, setDevicesVersion] = useState(0);
  const [testingMic, setTestingMic] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [waveBars, setWaveBars] = useState<number[]>(IDLE_WAVE.map((h) => Math.round(h * 0.62)));
  const [micError, setMicError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const refreshDevices = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter(
        (d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "default",
      );
      const mapped: InputDeviceOption[] = [
        DEFAULT_DEVICE_OPTION,
        ...audioInputs.map((d, index) => ({
          value: d.deviceId,
          label: d.label.trim() || `Micrófono ${index + 1}`,
        })),
      ];
      setInputDevices(mapped);
      setDevicesVersion((v) => v + 1);
    } catch {
      // Keep default microphone option when enumerateDevices fails.
    }
  }, []);

  const stopMicTest = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      void ctx.close().catch(() => { });
    }
    setTestingMic(false);
    setInputLevel(0);
    setWaveBars(IDLE_WAVE.map((h) => Math.round(h * 0.62)));
  }, []);

  useEffect(() => {
    void refreshDevices();
    const mediaDevices = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    const handleDeviceChange = () => {
      void refreshDevices();
    };
    mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);
    return () => {
      mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
      stopMicTest();
      stopSpeech();
    };
  }, [refreshDevices, stopMicTest]);

  async function startMicTest() {
    setMicError(null);
    stopSpeech();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError("Tu navegador no admite el acceso al micrófono.");
      return;
    }

    const constraints: MediaTrackConstraints = {
      echoCancellation: prefs.echoCancellation,
      noiseSuppression: prefs.noiseSuppression,
      autoGainControl: prefs.autoGainControl,
    };
    if (prefs.inputDeviceId && prefs.inputDeviceId !== "default") {
      constraints.deviceId = { ideal: prefs.inputDeviceId };
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: constraints });
    } catch (err) {
      setMicError(mapMicTestError(err));
      return;
    }

    // Re-enumerate devices now that microphone permission has been granted so real labels load.
    void refreshDevices();

    streamRef.current = stream;
    setTestingMic(true);

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);

      const timeData = new Uint8Array(analyser.fftSize);
      const freqData = new Uint8Array(analyser.frequencyBinCount);
      let lastUpdate = 0;

      const loop = (now: number) => {
        if (!streamRef.current) return;
        if (now - lastUpdate >= 50) {
          lastUpdate = now;
          analyser.getByteTimeDomainData(timeData);
          let sumSquares = 0;
          for (let i = 0; i < timeData.length; i += 1) {
            const norm = (timeData[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / timeData.length);
          const nextLevel = Math.min(100, Math.round(rms * 380));

          analyser.getByteFrequencyData(freqData);
          const usableBins = Math.max(BAR_COUNT, Math.floor(freqData.length * 0.85));
          const step = usableBins / BAR_COUNT;
          const nextBars: number[] = [];
          for (let b = 0; b < BAR_COUNT; b += 1) {
            const idx = Math.min(freqData.length - 1, Math.floor(b * step));
            const value = freqData[idx] ?? 0;
            nextBars.push(Math.max(14, Math.min(100, Math.round((value / 255) * 100))));
          }

          setInputLevel(nextLevel);
          setWaveBars(nextBars);
        }
        rafRef.current = requestAnimationFrame(loop);
      };

      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setMicError("No se pudo analizar la señal de audio del micrófono.");
      stopMicTest();
    }
  }

  function handleMicToggle() {
    if (testingMic) {
      stopMicTest();
    } else {
      void startMicTest();
    }
  }

  const isTestingVoice =
    speechPlayer.activeId === VOICE_TEST_ID && speechPlayer.status !== "idle";

  function handleTestVoice() {
    if (isTestingVoice) {
      speechPlayer.stop();
      return;
    }
    if (testingMic) {
      stopMicTest();
    }
    void speechPlayer.speak(VOICE_TEST_ID, VOICE_SAMPLE_TEXT, {
      voice: prefs.voice,
      speed: prefs.speed,
    });
  }

  const speedValue =
    SPEED_OPTIONS.find((o) => Number(o.value) === prefs.speed)?.value ?? "1.15";

  const effectiveDeviceValue = inputDevices.some((d) => d.value === prefs.inputDeviceId)
    ? prefs.inputDeviceId
    : "default";

  return (
    <>
      <Panel title="Idioma y voz de ST&T ATLAS">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <Label>Idioma principal</Label>
            <Select
              key={`lang-${prefs.language}`}
              options={[
                { value: "es-CO", label: "Español (Colombia)" },
                { value: "auto", label: "Detección automática" },
              ]}
              defaultValue={prefs.language}
              onChange={(val) => updatePrefs({ language: val === "auto" ? "auto" : "es-CO" })}
            />
          </div>
          <div>
            <Label>Voz de ST&amp;T ATLAS</Label>
            <Select
              key={`voice-${prefs.voice}`}
              options={VOICE_OPTIONS}
              defaultValue={prefs.voice}
              onChange={(val) => updatePrefs({ voice: val as VoiceName })}
            />
          </div>
          <div>
            <Label>Velocidad</Label>
            <Select
              key={`speed-${speedValue}`}
              options={SPEED_OPTIONS}
              defaultValue={speedValue}
              onChange={(val) => updatePrefs({ speed: Number(val) })}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            loading={isTestingVoice && speechPlayer.status === "loading"}
            onClick={handleTestVoice}
          >
            {isTestingVoice ? "Detener prueba" : "Probar voz"}
          </Button>
          <span className="text-theme-xs text-gray-500 dark:text-gray-400">
            Reproduce una muestra breve con la voz y velocidad seleccionadas.
          </span>
        </div>

        {speechPlayer.error && (
          <div className="mt-4">
            <Alert
              variant="error"
              title="No se pudo reproducir la muestra de voz"
              message={speechPlayer.error}
              onClose={speechPlayer.clearError}
            />
          </div>
        )}
      </Panel>

      <Panel title="Audio y micrófono">
        {micError && (
          <div className="mb-5">
            <Alert
              variant="error"
              title="Problema con el micrófono"
              message={micError}
              onClose={() => setMicError(null)}
            />
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label>Micrófono</Label>
            <Select
              key={`mic-${devicesVersion}-${effectiveDeviceValue}`}
              options={inputDevices}
              defaultValue={effectiveDeviceValue}
              onChange={(val) => {
                updatePrefs({ inputDeviceId: val });
                if (testingMic) {
                  stopMicTest();
                }
              }}
            />
          </div>
          <div>
            <Label>Volumen de entrada</Label>
            <div className="pt-3">
              <ProgressBar progress={testingMic ? inputLevel : 0} size="sm" />
              <p className="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">
                {testingMic ? `Nivel actual: ${inputLevel}%` : "Inicia la prueba para ver el nivel real del micrófono."}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Button variant="outline" onClick={handleMicToggle}>
            {testingMic ? "Detener prueba" : "Probar micrófono"}
          </Button>
          <div className="voice-wave flex h-14 min-w-0 flex-1 items-center gap-1" aria-hidden="true">
            {waveBars.map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-full transition-[height,background-color] duration-75 ${testingMic ? "bg-brand-400" : "bg-brand-800"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel title="Comportamiento y procesamiento">
        <div className="flex flex-col gap-4">
          <Switch
            label="Responder automáticamente con voz al usar el micrófono"
            checked={prefs.autoSpeak}
            onChange={(checked) => updatePrefs({ autoSpeak: checked })}
          />
          <Switch
            label="Detener grabación automáticamente al terminar de hablar"
            checked={prefs.autoStopOnSilence}
            onChange={(checked) => updatePrefs({ autoStopOnSilence: checked })}
          />
          <Switch
            label="Ajustar la sensibilidad automáticamente"
            checked={prefs.autoGainControl}
            onChange={(checked) => updatePrefs({ autoGainControl: checked })}
          />
          <Switch
            label="Cancelación de eco"
            checked={prefs.echoCancellation}
            onChange={(checked) => updatePrefs({ echoCancellation: checked })}
          />
          <Switch
            label="Supresión de ruido"
            checked={prefs.noiseSuppression}
            onChange={(checked) => updatePrefs({ noiseSuppression: checked })}
          />
        </div>
      </Panel>
    </>
  );
}
