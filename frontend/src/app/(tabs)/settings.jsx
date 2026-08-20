import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../../context/ThemeContext";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);

  const { darkMode, setDarkMode, theme, language, setLanguage } = useTheme();

  // ============================================================
  // LOAD SAVED SETTINGS
  // ============================================================

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("snax_theme");
      const savedLanguage = await AsyncStorage.getItem("snax_language");
      const savedNotifications =
        await AsyncStorage.getItem("snax_notifications");

      if (savedTheme === "dark") {
        setDarkMode(true);
      } else if (savedTheme === "light") {
        setDarkMode(false);
      }

      if (savedLanguage === "Hindi" || savedLanguage === "English") {
        setLanguage(savedLanguage);
      }

      if (savedNotifications !== null) {
        setNotifications(savedNotifications === "true");
      }
    } catch (error) {
      console.log("Load settings error:", error);
    }
  };

  // ============================================================
  // TRANSLATIONS
  // ============================================================

  const t =
    language === "Hindi"
      ? {
          settings: "सेटिंग्स",

          account: "अकाउंट",
          profile: "मेरी प्रोफ़ाइल",
          profileSub: "अपनी व्यक्तिगत जानकारी प्रबंधित करें",

          privacy: "प्राइवेसी और सिक्योरिटी",
          privacySub: "अपने अकाउंट की सुरक्षा प्रबंधित करें",

          preferences: "पसंद",

          notifications: "नोटिफिकेशन",
          notificationsSub: "ऑर्डर अपडेट और ऑफर",

          language: "भाषा",

          appearance: "दिखावट",
          lightMode: "लाइट मोड",
          darkMode: "डार्क मोड",

          support: "सहायता",

          help: "मदद और सहायता",
          helpSub: "अपने ऑर्डर से संबंधित सहायता प्राप्त करें",

          contact: "हमसे संपर्क करें",
          contactSub: "SNAX सपोर्ट टीम से बात करें",

          about: "SNAX के बारे में",
          version: "वर्जन 1.0.0",

          legal: "कानूनी",

          terms: "नियम और शर्तें",
          termsSub: "हमारे नियम और शर्तें पढ़ें",

          logout: "लॉगआउट",
          delete: "अकाउंट डिलीट करें",

          english: "अंग्रेज़ी",
          hindi: "हिंदी",

          logoutTitle: "लॉगआउट",
          logoutMessage: "क्या आप लॉगआउट करना चाहते हैं?",

          cancel: "रद्द करें",

          deleteTitle: "अकाउंट डिलीट करें",
          deleteMessage:
            "यह कार्रवाई वापस नहीं की जा सकती। क्या आप अपना अकाउंट डिलीट करना चाहते हैं?",

          appearanceTitle: "दिखावट",
          appearanceMessage: "अपनी पसंदीदा थीम चुनें",

          languageTitle: "भाषा",
          languageMessage: "अपनी पसंदीदा भाषा चुनें",

          light: "लाइट मोड",
          dark: "डार्क मोड",

          helpTitle: "मदद और सहायता",
          contactTitle: "हमसे संपर्क करें",
          aboutTitle: "SNAX के बारे में",

          supportMessage: "SNAX Support\nsupport@snax.com",

          aboutMessage: "SNAX Food Delivery App\nVersion 1.0.0",

          termsMessage: "कृपया SNAX की नियम और शर्तें पढ़ें।",
        }
      : {
          settings: "Settings",

          account: "ACCOUNT",
          profile: "My Profile",
          profileSub: "Manage your personal information",

          privacy: "Privacy & Security",
          privacySub: "Manage your account security",

          preferences: "PREFERENCES",

          notifications: "Notifications",
          notificationsSub: "Order updates and offers",

          language: "Language",

          appearance: "Appearance",
          lightMode: "Light mode",
          darkMode: "Dark mode",

          support: "SUPPORT",

          help: "Help & Support",
          helpSub: "Get help with your orders",

          contact: "Contact Us",
          contactSub: "Talk to the SNAX support team",

          about: "About SNAX",
          version: "Version 1.0.0",

          legal: "LEGAL",

          terms: "Terms & Conditions",
          termsSub: "Read our terms and conditions",

          logout: "Logout",
          delete: "Delete Account",

          english: "English",
          hindi: "Hindi",

          logoutTitle: "Logout",
          logoutMessage: "Are you sure you want to logout?",

          cancel: "Cancel",

          deleteTitle: "Delete Account",
          deleteMessage:
            "This action cannot be undone. Are you sure you want to delete your account?",

          appearanceTitle: "Appearance",
          appearanceMessage: "Choose your preferred theme",

          languageTitle: "Language",
          languageMessage: "Choose your preferred language",

          light: "Light Mode",
          dark: "Dark Mode",

          helpTitle: "Help & Support",
          contactTitle: "Contact Us",
          aboutTitle: "About SNAX",

          supportMessage: "SNAX Support\nsupport@snax.com",

          aboutMessage: "SNAX Food Delivery App\nVersion 1.0.0",

          termsMessage: "Please read the SNAX Terms & Conditions.",
        };

  // ============================================================
  // CHANGE NOTIFICATIONS
  // ============================================================

  const handleNotifications = async (value) => {
    try {
      setNotifications(value);

      await AsyncStorage.setItem("snax_notifications", String(value));
    } catch (error) {
      console.log("Notification setting error:", error);
    }
  };

  // ============================================================
  // CHANGE THEME
  // ============================================================

  const changeTheme = async (mode) => {
    try {
      const isDark = mode === "dark";

      setDarkMode(isDark);

      await AsyncStorage.setItem("snax_theme", isDark ? "dark" : "light");
    } catch (error) {
      console.log("Theme error:", error);
    }
  };

  // ============================================================
  // CHANGE LANGUAGE
  // ============================================================

  const changeLanguage = async (selectedLanguage) => {
    try {
      setLanguage(selectedLanguage);

      await AsyncStorage.setItem("snax_language", selectedLanguage);
    } catch (error) {
      console.log("Language error:", error);
    }
  };

  // ============================================================
  // LOGOUT
  // ============================================================
const handleLogout = () => {
  Alert.alert(
    t.logoutTitle,
    t.logoutMessage,
    [
      {
        text: t.cancel,
        style: "cancel",
      },
      {
        text: t.logout,
        style: "destructive",
        onPress: async () => {
          try {
            console.log("========== LOGOUT START ==========");

            // Remove all authentication/session data
            const keysToRemove = [
              "token",
              "user",
              "userToken",
              "authToken",
              "adminToken",
            ];

            await AsyncStorage.multiRemove(keysToRemove);

            // Verify
            const remainingToken = await AsyncStorage.getItem("token");
            const remainingUser = await AsyncStorage.getItem("user");
            const remainingUserToken = await AsyncStorage.getItem("userToken");
            const remainingAuthToken = await AsyncStorage.getItem("authToken");

            console.log("TOKEN:", remainingToken);
            console.log("USER:", remainingUser);
            console.log("USER TOKEN:", remainingUserToken);
            console.log("AUTH TOKEN:", remainingAuthToken);

            if (
              remainingToken ||
              remainingUser ||
              remainingUserToken ||
              remainingAuthToken
            ) {
              Alert.alert(
                "Logout Failed",
                "Login data could not be completely cleared."
              );
              return;
            }

            console.log("========== STORAGE CLEARED ==========");

            // Navigate to auth login screen
            router.replace("/(auth)/login");

          } catch (error) {
            console.error("LOGOUT ERROR:", error);

            Alert.alert(
              "Logout Failed",
              "Unable to logout. Please try again."
            );
          }
        },
      },
    ]
  );
};

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = () => {
    Alert.alert(t.deleteTitle, t.deleteMessage, [
      {
        text: t.cancel,
        style: "cancel",
      },
      {
        text: t.delete,
        style: "destructive",
        onPress: async () => {
          try {
            /*
             * TODO:
             * Call your backend delete-account API here.
             *
             * Example:
             * await axios.delete("/api/users/delete-account");
             */

            console.log("Delete account");

            Alert.alert(
              t.deleteTitle,
              language === "Hindi"
                ? "अकाउंट डिलीट API अभी कनेक्ट नहीं है।"
                : "Delete account API is not connected yet.",
            );
          } catch (error) {
            console.log("Delete account error:", error);
          }
        },
      },
    ]);
  };

  // ============================================================
  // APPEARANCE
  // ============================================================

  const handleAppearance = () => {
    Alert.alert(t.appearanceTitle, t.appearanceMessage, [
      {
        text: t.light,
        onPress: () => changeTheme("light"),
      },
      {
        text: t.dark,
        onPress: () => changeTheme("dark"),
      },
      {
        text: t.cancel,
        style: "cancel",
      },
    ]);
  };

  // ============================================================
  // LANGUAGE
  // ============================================================

  const handleLanguage = () => {
    Alert.alert(t.languageTitle, t.languageMessage, [
      {
        text: t.english,
        onPress: () => changeLanguage("English"),
      },
      {
        text: t.hindi,
        onPress: () => changeLanguage("Hindi"),
      },
      {
        text: t.cancel,
        style: "cancel",
      },
    ]);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.safeArea,
        },
      ]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.statusBar}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={theme.primary} />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            {t.settings}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* CONTENT */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ACCOUNT */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.account}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingItem
              icon="person-outline"
              title={t.profile}
              subtitle={t.profileSub}
              onPress={() => router.push("/profile")}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <SettingItem
              icon="shield-checkmark-outline"
              title={t.privacy}
              subtitle={t.privacySub}
              onPress={() => router.push("/(tabs)/privacy-security")}
              theme={theme}
            />
          </View>

          {/* PREFERENCES */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.preferences}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {/* NOTIFICATIONS */}

            <SwitchItem
              icon="notifications-outline"
              title={t.notifications}
              subtitle={t.notificationsSub}
              value={notifications}
              onValueChange={handleNotifications}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            {/* LANGUAGE */}

            <SettingItem
              icon="language-outline"
              title={t.language}
              subtitle={language}
              onPress={handleLanguage}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            {/* APPEARANCE */}

            <SettingItem
              icon={darkMode ? "moon" : "sunny-outline"}
              title={t.appearance}
              subtitle={darkMode ? t.darkMode : t.lightMode}
              onPress={handleAppearance}
              theme={theme}
            />
          </View>

          {/* SUPPORT */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.support}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingItem
              icon="help-circle-outline"
              title={t.help}
              subtitle={t.helpSub}
              onPress={() => router.push("/help-support")}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

           

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

          
          </View>

          {/* LEGAL */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.legal}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <SettingItem
  icon="document-text-outline"
  title={t.terms}
  subtitle={t.termsSub}
  onPress={() => router.push("/terms-conditions")}
  theme={theme}
/>
          </View>

          {/* LOGOUT */}

    <TouchableOpacity
  style={[
    styles.logoutButton,
    {
      backgroundColor: theme.card,
      borderColor: theme.dangerBorder,
    },
  ]}
  onPress={handleLogout}
  activeOpacity={0.7}
>
  <Ionicons
    name="log-out-outline"
    size={18}
    color="#D32F2F"
  />

  <Text style={styles.logoutText}>
    {t.logout}
  </Text>
</TouchableOpacity>

          {/* FOOTER */}

          <Text
            style={[
              styles.versionText,
              {
                color: theme.primary,
              },
            ]}
          >
            SNAX
          </Text>

          <Text
            style={[
              styles.versionNumber,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            Version 1.0.0
          </Text>

          <View style={{ height: 25 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// SETTING ITEM
// ============================================================

function SettingItem({ icon, title, subtitle, onPress, theme }) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color="#F5B82E" />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.settingTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.settingSubtitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={17} color={theme.chevron} />
    </TouchableOpacity>
  );
}

// ============================================================
// SWITCH ITEM
// ============================================================

function SwitchItem({ icon, title, subtitle, value, onValueChange, theme }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingLeft}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: theme.primary,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color="#F5B82E" />
        </View>

        <View style={styles.textContainer}>
          <Text
            style={[
              styles.settingTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            {title}
          </Text>

          <Text
            style={[
              styles.settingSubtitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: "#D1D5DB",
          true: "#F5B82E",
        }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 30,
  },

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 13,
    paddingBottom: 25,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 9,
    marginLeft: 3,
    letterSpacing: 0.5,
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },

  settingRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  textContainer: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  settingSubtitle: {
    fontSize: 9,
    marginTop: 3,
    lineHeight: 12,
  },

  divider: {
    height: 1,
    marginLeft: 57,
  },

  logoutButton: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 4,
  },

  logoutText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D32F2F",
  },

  deleteButton: {
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  deleteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#D32F2F",
  },

  versionText: {
    textAlign: "center",
    fontSize: 10,
    fontWeight: "800",
    marginTop: 3,
  },

  versionNumber: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 2,
  },
});
