"use client";

const BAR_COUNT = 48;

interface AudioWaveformProps {
  isRecording: boolean;
}

export function AudioWaveform({ isRecording }: AudioWaveformProps) {
  return (
    <div className="w-full flex items-center justify-center gap-[3px] px-6 h-[6px] overflow-hidden shrink-0">
      {Array.from({ length: BAR_COUNT }).map((_, i) => {
        const period = 0.4 + (i % 5) * 0.15;
        const delay = (i % 7) * 0.05;
        return (
          <span
            key={i}
            className="flex-1 min-w-[2px] max-w-[4px] rounded-full transition-colors duration-300"
            style={{
              height: isRecording ? undefined : "2px",
              backgroundColor: isRecording ? "#C9A84C" : "#1A3154",
              opacity: isRecording ? undefined : 0.5,
              animation: isRecording
                ? `waveBar ${period}s ease-in-out ${delay}s infinite alternate`
                : "none",
            }}
          />
        );
      })}
    </div>
  );
}
