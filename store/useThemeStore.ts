import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeMode } from '@/theme';

interface ThemeStore {
  themeMode: ThemeMode | 'system';
  setThemeMode: (mode: ThemeMode | 'system') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

