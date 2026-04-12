import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      toggleDarkMode: () => set((state) => {
        const nextMode = !state.isDarkMode;
        // Sync with HTML class for tailwind
        if (nextMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: nextMode };
      }),
      setDarkMode: (val) => set(() => {
        if (val) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return { isDarkMode: val };
      }),
    }),
    {
      name: 'oims-theme-storage',
    }
  )
);

export default useThemeStore;
