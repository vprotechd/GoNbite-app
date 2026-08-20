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

export default function PrivacySecurityScreen() {
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [personalizedData, setPersonalizedData] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Your account and associated information will be permanently deleted. This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log("Delete account");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* HEADER */}
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
            Privacy & Security
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >



          {/* ACCOUNT SECURITY */}

          <Text style={styles.sectionTitle}>
            ACCOUNT SECURITY
          </Text>

          <View style={styles.card}>

            <SettingItem
              icon="key-outline"
              title="Change Password"
              subtitle="Update your password"
              onPress={() => router.push("/change-password")}
            />

          </View>

          {/* PRIVACY */}

          <Text style={styles.sectionTitle}>
            PRIVACY
          </Text>

          <View style={styles.card}>

            <SwitchItem
              icon="notifications-outline"
              title="Login Alerts"
              subtitle="Get notified about new logins"
              value={loginAlerts}
              onValueChange={setLoginAlerts}
            />

            <View style={styles.divider} />

            <SwitchItem
              icon="sparkles-outline"
              title="Personalized Recommendations"
              subtitle="Use activity to improve recommendations"
              value={personalizedData}
              onValueChange={setPersonalizedData}
            />

            <View style={styles.divider} />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy Policy"
              subtitle="Learn how we use your information"
              onPress={() => router.push("/privacy-policy")}
            />

          </View>

          {/* DELETE ACCOUNT */}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color="#D32F2F"
            />

            <Text style={styles.deleteText}>
              Delete Account
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            SNAX • Version 1.0.0
          </Text>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ============================================================
   SETTING ITEM
============================================================ */

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
      <View style={styles.leftContent}>

        <View style={styles.iconBox}>
          <Ionicons
            name={icon}
            size={18}
            color="#F5B82E"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
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

/* ============================================================
   SWITCH ITEM
============================================================ */

function SwitchItem({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}) {
  return (
    <View style={styles.settingRow}>

      <View style={styles.leftContent}>

        <View style={styles.iconBox}>
          <Ionicons
            name={icon}
            size={18}
            color="#F5B82E"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {title}
          </Text>

          <Text style={styles.subtitle}>
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

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  /* HEADER */

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
    fontSize: 17,
    fontWeight: "800",
    color: "#081A33",
  },

  headerSpacer: {
    width: 30,
  },

  /* CONTENT */

  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 25,
  },

  /* SECURITY INFO */

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    padding: 11,
    marginBottom: 16,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#081A33",
  },

  infoSubtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 3,
  },

  /* SECTION */

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    marginBottom: 7,
    marginLeft: 3,
    letterSpacing: 0.5,
  },

  /* CARD */

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    overflow: "hidden",
    marginBottom: 15,
  },

  /* ROW */

  settingRow: {
    minHeight: 61,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  /* ICON */

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  /* TEXT */

  textContainer: {
    flex: 1,
  },

  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#081A33",
  },

  subtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 3,
  },

  /* DIVIDER */

  divider: {
    height: 1,
    backgroundColor: "#EEF1F4",
    marginLeft: 57,
  },

  /* DELETE */

  deleteButton: {
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F3C4C4",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 3,
  },

  deleteText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#D32F2F",
  },

  /* FOOTER */

  footerText: {
    textAlign: "center",
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 14,
  },

});