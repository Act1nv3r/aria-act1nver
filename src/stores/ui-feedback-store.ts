import { create } from "zustand";

interface UIFeedbackStore {
  lastSavedAt: number | null;
  notifySaved: () => void;
}

export const useUIFeedbackStore = create<UIFeedbackStore>((set) => ({
  lastSavedAt: null,
  notifySaved: () => set({ lastSavedAt: Date.now() }),
}));
