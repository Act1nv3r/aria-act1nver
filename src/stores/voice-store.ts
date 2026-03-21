import { create } from "zustand";
import type { TranscriptLine } from "@/hooks/use-deepgram";

interface VoiceState {
  transcript: TranscriptLine[];
  isRecording: boolean;
  error: string | null;
  setTranscript: (t: TranscriptLine[]) => void;
  setIsRecording: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  transcript: [],
  isRecording: false,
  error: null,
  setTranscript: (t) => set({ transcript: t }),
  setIsRecording: (v) => set({ isRecording: v }),
  setError: (e) => set({ error: e }),
}));
