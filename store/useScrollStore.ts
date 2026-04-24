import { create } from 'zustand';

interface ScrollStore {
  isScrolled: boolean;
  setScrollY: (y: number) => void;
}

export const useScrollStore = create<ScrollStore>((set, get) => ({
  isScrolled: false,
  setScrollY: (y: number) => {
    const next = y > 60;
    if (next !== get().isScrolled) set({ isScrolled: next });
  },
}));
