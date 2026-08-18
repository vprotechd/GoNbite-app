import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [location, setLocation] = useState(true);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // If you store token in AsyncStorage,
              // remove it here.

              // Example:
              // await AsyncStorage.removeItem("token");

              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);
            }
          },
        },
      ],
    );
  };

  // ============================================================
  // DELETE ACCOUNT
  // ============================================================

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. Are you sure you want to delete your account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // Connect your delete account API here.
            console.log("Delete account");
          },
        },
      ],
    );
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* ======================================================
            HEADER
        ======================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#081A33"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Settings
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* ======================================================
            CONTENT
        ======================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >

          {/* ==================================================
              ACCOUNT
          ================================================== */}

          <Text style={styles.sectionTitle}>
            Account
          </Text>

          <View style={styles.card}>

            <SettingItem
              icon="person-outline"
              title="My Profile"
              subtitle="Manage your personal information"
              onPress={() =>
                router.push("/profile")
              }
            />

            <View style={styles.divider} />

            <SettingItem
              icon="location-outline"
              title="Delivery Addresses"
              subtitle="Manage your saved addresses"
              onPress={() => {
                Alert.alert(
                  "Delivery Addresses",
                  "Address management page can be added here.",
                );
              }}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="lock-closed-outline"
              title="Privacy & Security"
              subtitle="Manage your account security"
              onPress={() => {
                Alert.alert(
                  "Privacy & Security",
                  "Security settings can be added here.",
                );
              }}
            />

          </View>

          {/* ==================================================
              PREFERENCES
          ================================================== */}

          <Text style={styles.sectionTitle}>
            Preferences
          </Text>

          <View style={styles.card}>

            {/* NOTIFICATIONS */}

            <View style={styles.settingRow}>

              <View style={styles.settingLeft}>

                <View style={styles.iconBox}>
                  <Ionicons
                    name="notifications-outline"
                    size={18}
                    color="#F5B82E"
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.settingTitle}>
                    Notifications
                  </Text>

                  <Text style={styles.settingSubtitle}>
                    Order updates and offers
                  </Text>
                </View>

              </View>

              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{
                  false: "#D1D5DB",
                  true: "#F5B82E",
                }}
                thumbColor="#FFFFFF"
              />

            </View>

            <View style={styles.divider} />

            {/* LOCATION */}

            <View style={styles.settingRow}>

              <View style={styles.settingLeft}>

                <View style={styles.iconBox}>
                  <Ionicons
                    name="navigate-outline"
                    size={18}
                    color="#F5B82E"
                  />
                </View>

                <View style={styles.textContainer}>
                  <Text style={styles.settingTitle}>
                    Location
                  </Text>

                  <Text style={styles.settingSubtitle}>
                    Use your location for nearby restaurants
                  </Text>
                </View>

              </View>

              <Switch
                value={location}
                onValueChange={setLocation}
                trackColor={{
                  false: "#D1D5DB",
                  true: "#F5B82E",
                }}
                thumbColor="#FFFFFF"
              />

            </View>

            <View style={styles.divider} />

            <SettingItem
              icon="language-outline"
              title="Language"
              subtitle="English"
              onPress={() => {
                Alert.alert(
                  "Language",
                  "Language selection can be added here.",
                );
              }}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="moon-outline"
              title="Appearance"
              subtitle="Light mode"
              onPress={() => {
                Alert.alert(
                  "Appearance",
                  "Theme selection can be added here.",
                );
              }}
            />

          </View>

          {/* ==================================================
              SUPPORT
          ================================================== */}

          <Text style={styles.sectionTitle}>
            Support
          </Text>

          <View style={styles.card}>

            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help with your orders"
              onPress={() => {
                Alert.alert(
                  "Help & Support",
                  "Support page can be added here.",
                );
              }}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="chatbubble-ellipses-outline"
              title="Contact Us"
              subtitle="Talk to the SNAX support team"
              onPress={() => {
                Alert.alert(
                  "Contact Us",
                  "Contact support can be added here.",
                );
              }}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="information-circle-outline"
              title="About SNAX"
              subtitle="Version 1.0.0"
              onPress={() => {
                Alert.alert(
                  "SNAX",
                  "SNAX Food Delivery App\nVersion 1.0.0",
                );
              }}
            />

          </View>

          {/* ==================================================
              LEGAL
          ================================================== */}

          <Text style={styles.sectionTitle}>
            Legal
          </Text>

          <View style={styles.card}>

            <SettingItem
              icon="document-text-outline"
              title="Terms & Conditions"
              subtitle="Read our terms and conditions"
              onPress={() => {
                Alert.alert(
                  "Terms & Conditions",
                  "Terms and conditions page can be added here.",
                );
              }}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Learn how we protect your data"
              onPress={() => {
                Alert.alert(
                  "Privacy Policy",
                  "Privacy policy page can be added here.",
                );
              }}
            />

          </View>

          {/* ==================================================
              LOGOUT
          ================================================== */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color="#D32F2F"
            />

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>

          {/* ==================================================
              DELETE ACCOUNT
          ================================================== */}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color="#D32F2F"
            />

            <Text style={styles.deleteText}>
              Delete Account
            </Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>
            SNAX
          </Text>

          <Text style={styles.versionNumber}>
            Version 1.0.0
          </Text>

          <View style={{ height: 30 }} />

        </ScrollView>

      </View>
    </SafeAreaView>
  );
}

// ============================================================
// SETTING ITEM COMPONENT
// ============================================================

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
    >

      <View style={styles.settingLeft}>

        <View style={styles.iconBox}>
          <Ionicons
            name={icon}
            size={18}
            color="#F5B82E"
          />
        </View>

        <View style={styles.textContainer}>

          <Text style={styles.settingTitle}>
            {title}
          </Text>

          <Text style={styles.settingSubtitle}>
            {subtitle}
          </Text>

        </View>

      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color="#94A3B8"
      />

    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
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
    color: "#081A33",
  },

  headerSpacer: {
    width: 30,
  },

  // ==========================================================
  // SCROLL
  // ==========================================================

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 15,
    paddingBottom: 25,
  },

  // ==========================================================
  // SECTION
  // ==========================================================

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 7,
    marginTop: 8,
    marginLeft: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // ==========================================================
  // CARD
  // ==========================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    overflow: "hidden",
    marginBottom: 13,
  },

  // ==========================================================
  // ROW
  // ==========================================================

  settingRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 9,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  // ==========================================================
  // ICON
  // ==========================================================

  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  // ==========================================================
  // TEXT
  // ==========================================================

  textContainer: {
    flex: 1,
  },

  settingTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#081A33",
  },

  settingSubtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 13,
  },

  // ==========================================================
  // DIVIDER
  // ==========================================================

  divider: {
    height: 1,
    backgroundColor: "#EEF1F4",
    marginLeft: 59,
  },

  // ==========================================================
  // LOGOUT
  // ==========================================================

  logoutButton: {
    height: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3C4C4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 5,
  },

  logoutText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#D32F2F",
  },

  // ==========================================================
  // DELETE
  // ==========================================================

  deleteButton: {
    height: 42,
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

  // ==========================================================
  // VERSION
  // ==========================================================

  versionText: {
    textAlign: "center",
    color: "#081A33",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 5,
  },

  versionNumber: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 9,
    marginTop: 2,
  },

});