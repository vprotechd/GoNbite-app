import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const lightTheme = {
  safeArea: "#081A33",
  statusBar: "#FFFFFF",
  background: "#F5F7FA",
  card: "#FFFFFF",
  primary: "#081A33",
  secondaryText: "#64748B",
  border: "#E2E6EB",
  divider: "#EEF1F4",
  chevron: "#94A3B8",
  dangerBorder: "#F3C4C4",
};

export const darkTheme = {
  safeArea: "#050B14",
  statusBar: "#0B1628",
  background: "#0B1220",
  card: "#111C2E",
  primary: "#FFFFFF",
  secondaryText: "#94A3B8",
  border: "#243247",
  divider: "#1E2A3D",
  chevron: "#64748B",
  dangerBorder: "#5A2929",
};

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("snax_dark_mode");
      const savedLanguage = await AsyncStorage.getItem("snax_language");

      if (savedTheme !== null) {
        setDarkMode(savedTheme === "true");
      }

      if (savedLanguage !== null) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = async (value) => {
    try {
      setDarkMode(value);

      await AsyncStorage.setItem(
        "snax_dark_mode",
        String(value)
      );
    } catch (error) {
      console.log("Error saving theme:", error);
    }
  };

  const changeLanguage = async (newLanguage) => {
    try {
      setLanguage(newLanguage);

      await AsyncStorage.setItem(
        "snax_language",
        newLanguage
      );
    } catch (error) {
      console.log("Error saving language:", error);
    }
  };

  const theme = darkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider
      value={{
        darkMode,
        setDarkMode: toggleDarkMode,
        theme,
        language,
        setLanguage: changeLanguage,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}