import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
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

      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log("Settings load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeTheme = async (value) => {
    try {
      setDarkMode(value);
      await AsyncStorage.setItem(
        "snax_dark_mode",
        value.toString()
      );
    } catch (error) {
      console.log("Theme save error:", error);
    }
  };

  const changeLanguage = async (value) => {
    try {
      setLanguage(value);
      await AsyncStorage.setItem(
        "snax_language",
        value
      );
    } catch (error) {
      console.log("Language save error:", error);
    }
  };

  const theme = darkMode
    ? {
        safeArea: "#050B14",
        statusBar: "#0B1628",
        background: "#0B1220",
        card: "#111C2E",
        primary: "#FFFFFF",
        secondaryText: "#94A3B8",
        border: "#243247",
        divider: "#1E2A3D",
        chevron: "#64748B",
        iconBackground: "#081A33",
      }
    : {
        safeArea: "#081A33",
        statusBar: "#FFFFFF",
        background: "#F5F7FA",
        card: "#FFFFFF",
        primary: "#081A33",
        secondaryText: "#64748B",
        border: "#E2E6EB",
        divider: "#EEF1F4",
        chevron: "#94A3B8",
        iconBackground: "#081A33",
      };

  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        language,
        theme,
        loading,
        changeTheme,
        changeLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState } from "react";

const SettingsContext = createContext();

export function SettingsProvider({ children }) {
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

      if (savedLanguage) {
        setLanguage(savedLanguage);
      }
    } catch (error) {
      console.log("Settings load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const changeTheme = async (value) => {
    try {
      setDarkMode(value);
      await AsyncStorage.setItem(
        "snax_dark_mode",
        value.toString()
      );
    } catch (error) {
      console.log("Theme save error:", error);
    }
  };

  const changeLanguage = async (value) => {
    try {
      setLanguage(value);
      await AsyncStorage.setItem(
        "snax_language",
        value
      );
    } catch (error) {
      console.log("Language save error:", error);
    }
  };

  const theme = darkMode
    ? {
        safeArea: "#050B14",
        statusBar: "#0B1628",
        background: "#0B1220",
        card: "#111C2E",
        primary: "#FFFFFF",
        secondaryText: "#94A3B8",
        border: "#243247",
        divider: "#1E2A3D",
        chevron: "#64748B",
        iconBackground: "#081A33",
      }
    : {
        safeArea: "#081A33",
        statusBar: "#FFFFFF",
        background: "#F5F7FA",
        card: "#FFFFFF",
        primary: "#081A33",
        secondaryText: "#64748B",
        border: "#E2E6EB",
        divider: "#EEF1F4",
        chevron: "#94A3B8",
        iconBackground: "#081A33",
      };

  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        language,
        theme,
        loading,
        changeTheme,
        changeLanguage,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}