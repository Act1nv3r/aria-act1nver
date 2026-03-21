"use client";

import { useVoiceStore } from "@/stores/voice-store";

function AudioBars() {
  return (
    <div className="flex items-center gap-1 h-6" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-1 bg-[#E6C78A] rounded-full origin-bottom animate-[listening_0.6s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.1}s`, height: "12px" }}
        />
      ))}
    </div>
  );
}

export function ListeningIndicator() {
  const isRecording = useVoiceStore((s) => s.isRecording);
  const transcript = useVoiceStore((s) => s.transcript);

  if (!isRecording) return null;

  const lastLine = transcript.length > 0 ? transcript[transcript.length - 1] : null;

  return (
    <div
      className="z-40 px-4 py-3 flex items-center gap-4"
      style={{
        background: "linear-gradient(180deg, rgba(139,58,58,0.25) 0%, rgba(139,58,58,0.08) 100%)",
        borderBottom: "1px solid rgba(139,58,58,0.3)",
      }}
    >
      <div className="flex items-center gap-3 shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#8B3A3A] animate-pulse" />
        <span className="font-bold font-[family-name:var(--font-poppins)] text-sm text-[#E6C78A]">
          Escuchando...
        </span>
        <AudioBars />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        {lastLine ? (
          <p
            className="font-[family-name:var(--font-open-sans)] text-sm text-white truncate"
            title={lastLine.text}
          >
            <span className="text-[#5A6A85] mr-2">
              {lastLine.speaker === 0 ? "Asesor:" : "Cliente:"}
            </span>
            {lastLine.text}
            {!lastLine.isFinal && (
              <span className="inline-block w-2 h-4 ml-1 bg-[#E6C78A] animate-pulse" />
            )}
          </p>
        ) : (
          <p className="font-[family-name:var(--font-open-sans)] text-sm text-[#5A6A85]">
            Habla para ver la transcripción en vivo
          </p>
        )}
      </div>
    </div>
  );
}
