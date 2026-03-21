"use client";

import { useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useDeepgram } from "@/hooks/use-deepgram";
import { useVoiceStore } from "@/stores/voice-store";
import { TranscriptionPanel } from "./transcription-panel";

interface VoiceButtonProps {
  onStart?: () => void;
  onStop?: () => void;
}

export function VoiceButton({ onStart, onStop }: VoiceButtonProps) {
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consent, setConsent] = useState(false);
  const {
    isRecording,
    transcript,
    startRecording: startDeepgram,
    stopRecording: stopDeepgram,
    error,
  } = useDeepgram();
  const setTranscript = useVoiceStore((s) => s.setTranscript);
  const setIsRecording = useVoiceStore((s) => s.setIsRecording);
  const setError = useVoiceStore((s) => s.setError);

  useEffect(() => {
    setTranscript(transcript);
  }, [transcript, setTranscript]);
  useEffect(() => {
    setIsRecording(isRecording);
  }, [isRecording, setIsRecording]);
  useEffect(() => {
    setError(error);
  }, [error, setError]);

  const hasConsent =
    typeof window !== "undefined" &&
    sessionStorage.getItem("voice_consent") === "true";

  const handleStart = async () => {
    await startDeepgram();
    onStart?.();
  };

  const handleStop = () => {
    stopDeepgram();
    onStop?.();
  };

  const handleClick = () => {
    if (isRecording) {
      handleStop();
    } else {
      if (!hasConsent) {
        setConsentModalOpen(true);
      } else {
        handleStart();
      }
    }
  };

  const handleConsentActivate = () => {
    if (consent) {
      sessionStorage.setItem("voice_consent", "true");
      handleStart();
      setConsentModalOpen(false);
    }
  };

  return (
    <>
      <TranscriptionPanel transcript={transcript} isRecording={isRecording} error={error} />
      <button
        type="button"
        onClick={handleClick}
        disabled={!!error}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all
          ${error ? "bg-[#5A6A85]/20 cursor-not-allowed" : ""}
          ${isRecording ? "bg-[#8B3A3A] text-white animate-pulse" : "bg-[#5A6A85]/20 text-[#5A6A85] hover:bg-[#5A6A85]/30"}
        `}
        title={error ? "Error de voz" : isRecording ? "Detener captura" : "Activar captura por voz"}
      >
        {error ? (
          <MicOff className="h-5 w-5 text-[#8B3A3A]" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>

      <Modal
        open={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        title="Captura por voz"
      >
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-[#E6C78A]/20 flex items-center justify-center">
              <Mic className="h-12 w-12 text-[#E6C78A]" />
            </div>
          </div>
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-white">
            Para agilizar la captura, esta sesión se procesa por voz. El audio
            no se almacena.
          </p>
          <p className="font-[family-name:var(--font-open-sans)] text-xs text-[#5A6A85]">
            El audio se procesa en tiempo real y no se guarda.
          </p>
          <div className="flex justify-center">
            <Toggle
              label="Acepto el procesamiento de voz para esta sesión"
              checked={consent}
              onChange={setConsent}
            />
          </div>
          <div className="flex gap-4 justify-center">
            <Button variant="ghost" onClick={() => setConsentModalOpen(false)}>
              No gracias
            </Button>
            <Button
              variant="primary"
              onClick={handleConsentActivate}
              disabled={!consent}
            >
              Activar voz
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
