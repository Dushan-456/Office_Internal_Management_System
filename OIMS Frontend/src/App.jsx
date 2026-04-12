import AppRouter from "./routes/AppRouter";
import useAuthStore from "./store/useAuthStore";
import useThemeStore from "./store/useThemeStore";
import { useEffect, useMemo } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { siteConfig } from "./config/siteConfig";

const App = () => {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  // Sync Tailwind class with store on mount/change
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Dynamic MUI Theme
  const theme = useMemo(() => createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: siteConfig.colors.primary,
      },
      secondary: {
        main: siteConfig.colors.secondary,
      },
      text: {
        primary: isDarkMode ? '#f8fafc' : '#0f172a',
        secondary: isDarkMode ? '#94a3b8' : '#475569',
      },
      background: {
        default: isDarkMode ? siteConfig.colors.dark.background : siteConfig.colors.background,
        paper: isDarkMode ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
      },
    },
    typography: {
      fontFamily: "'Outfit', sans-serif",
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 12,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  }), [isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRouter />
    </ThemeProvider>
  );
}

export default App;
