import React, { ReactNode } from "react";
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { useAppStore } from "../store/useAppStore";

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { themeMode } = useAppStore();

  const theme = React.useMemo(() => {
    return createTheme({
      palette: {
        mode: themeMode,
        primary: {
          main: "#6366f1", // Indigo-500
          light: "#818cf8",
          dark: "#4f46e5",
          contrastText: "#ffffff",
        },
        secondary: {
          main: "#10b981", // Emerald-500
          light: "#34d399",
          dark: "#059669",
          contrastText: "#ffffff",
        },
        background: {
          default: themeMode === "dark" ? "#020617" : "#f8fafc",
          paper: themeMode === "dark" ? "#0f172a" : "#ffffff",
        },
        text: {
          primary: themeMode === "dark" ? "#f8fafc" : "#0f172a",
          secondary: themeMode === "dark" ? "#94a3b8" : "#475569",
        },
        divider: themeMode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
      },
      typography: {
        fontFamily: '"Inter", "Space Grotesk", sans-serif',
        fontSize: 13,
        h1: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
        },
        h2: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
        },
        h3: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
        },
        h4: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
        },
        h5: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
        },
        h6: {
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
        },
        button: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiButton: {
          styleOverrides: {
            root: {
              boxShadow: "none",
              "&:hover": {
                boxShadow: "none",
              },
            },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: {
              backgroundImage: "none",
              boxShadow: "none",
              border: "1px solid",
              borderColor: themeMode === "dark" ? "rgba(255, 255, 255, 0.06)" : "rgba(0, 0, 0, 0.06)",
            },
          },
        },
      },
    });
  }, [themeMode]);

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
};
