import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

import api from "../../services/api";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [target, setTarget] = useState("all");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);

  // =================================================
  // RESPONSIVE SCREEN SIZE
  // =================================================

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  // =================================================
  // BACK BUTTON
  // =================================================

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/admin");
    }
  };

  // =================================================
  // SEND NOTIFICATION
  // =================================================

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter title and message.",
      );
      return;
    }

    if (target === "user" && !userId.trim()) {
      Alert.alert(
        "User ID Required",
        "Please enter the user's ID.",
      );
      return;
    }

    try {
      setSending(true);

      const response = await api.post("/admin/notifications", {
        title: title.trim(),
        message: message.trim(),
        type,
        target,
        ...(target === "user"
          ? { userId: userId.trim() }
          : {}),
      });

      Alert.alert(
        "Success",
        response.data?.message ||
          "Notification sent successfully.",
      );

      setTitle("");
      setMessage("");
      setUserId("");
    } catch (error) {
      console.error(
        "SEND NOTIFICATION ERROR:",
        error?.response?.data || error.message,
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to send notification.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <View
        style={[
          styles.topHeader,
          isTablet && styles.topHeaderTablet,
          isDesktop && styles.topHeaderDesktop,
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#081A33"
          />
        </TouchableOpacity>

        <View style={styles.topHeaderText}>
          <Text
            style={[
              styles.topHeaderTitle,
              isMobile && styles.topHeaderTitleMobile,
            ]}
            numberOfLines={1}
          >
            Notifications
          </Text>

          <Text
            style={styles.topHeaderSubtitle}
            numberOfLines={1}
          >
            Admin notification center
          </Text>
        </View>
      </View>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
          isDesktop && styles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.formContainer,
            isTablet && styles.formContainerTablet,
            isDesktop && styles.formContainerDesktop,
          ]}
        >
          {/* HEADER */}

          <View style={styles.headerSection}>
            <View style={styles.headerIcon}>
              <Ionicons
                name="notifications-outline"
                size={26}
                color="#FF6B35"
              />
            </View>

            <View style={styles.headerTextContainer}>
              <Text
                style={[
                  styles.heading,
                  isMobile && styles.headingMobile,
                ]}
              >
                Create Notification
              </Text>

              <Text style={styles.subheading}>
                Send a notification to Snaxx users
              </Text>
            </View>
          </View>

          {/* FORM CARD */}

          <View style={styles.formCard}>
            {/* TITLE */}

            <Text style={styles.label}>
              Notification Title
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Enter notification title"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            {/* MESSAGE */}

            <Text style={styles.label}>
              Message
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.messageInput,
              ]}
              placeholder="Enter notification message"
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              multiline
              textAlignVertical="top"
            />

            {/* TYPE */}

            <Text style={styles.label}>
              Notification Type
            </Text>

            <View style={styles.optionsRow}>
              {[
                ["system", "System"],
                ["offer", "Offer"],
                ["order", "Order"],
              ].map(([value, label]) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.option,
                    isMobile &&
                      styles.optionMobile,
                    type === value &&
                      styles.selectedOption,
                  ]}
                  onPress={() => setType(value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.optionText,
                      type === value &&
                        styles.selectedOptionText,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* TARGET */}

            <Text style={styles.label}>
              Send To
            </Text>

            <View style={styles.optionsRow}>
              <TouchableOpacity
                style={[
                  styles.option,
                  isMobile &&
                    styles.optionMobile,
                  target === "all" &&
                    styles.selectedOption,
                ]}
                onPress={() => setTarget("all")}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.optionText,
                    target === "all" &&
                      styles.selectedOptionText,
                  ]}
                >
                  All Users
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.option,
                  isMobile &&
                    styles.optionMobile,
                  target === "user" &&
                    styles.selectedOption,
                ]}
                onPress={() => setTarget("user")}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.optionText,
                    target === "user" &&
                      styles.selectedOptionText,
                  ]}
                >
                  Specific User
                </Text>
              </TouchableOpacity>
            </View>

            {/* USER ID */}

            {target === "user" && (
              <>
                <Text style={styles.label}>
                  User ID
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter user ID"
                  placeholderTextColor="#94A3B8"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="none"
                />
              </>
            )}

            {/* SEND */}

            <TouchableOpacity
              style={[
                styles.sendButton,
                sending &&
                  styles.disabledButton,
              ]}
              onPress={sendNotification}
              disabled={sending}
              activeOpacity={0.8}
            >
              <Ionicons
                name={
                  sending
                    ? "time-outline"
                    : "notifications-outline"
                }
                size={19}
                color="#081A33"
              />

              <Text style={styles.sendButtonText}>
                {sending
                  ? "Sending..."
                  : "SEND NOTIFICATION"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// =================================================
// STYLES
// =================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // =================================================
  // TOP HEADER
  // =================================================

  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  topHeaderTablet: {
    paddingHorizontal: 28,
    paddingVertical: 16,
  },

  topHeaderDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 18,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  topHeaderText: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  topHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#081A33",
  },

  topHeaderTitleMobile: {
    fontSize: 18,
  },

  topHeaderSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // =================================================
  // CONTENT
  // =================================================

  content: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 40,
  },

  contentTablet: {
    paddingHorizontal: 35,
    paddingTop: 40,
    paddingBottom: 50,
  },

  contentDesktop: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 45,
    paddingTop: 45,
    paddingBottom: 60,
  },

  // =================================================
  // FORM CONTAINER
  // =================================================

  formContainer: {
    width: "100%",
  },

  formContainerTablet: {
    maxWidth: 800,
    alignSelf: "center",
  },

  formContainerDesktop: {
    maxWidth: 850,
    alignSelf: "center",
  },

  // =================================================
  // HEADER SECTION
  // =================================================

  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFF1EB",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    flexShrink: 0,
  },

  headerTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#081A33",
  },

  headingMobile: {
    fontSize: 23,
  },

  subheading: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
  },

  // =================================================
  // FORM CARD
  // =================================================

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 3,
  },

  // =================================================
  // LABELS
  // =================================================

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#081A33",
    marginBottom: 8,
    marginTop: 18,
  },

  // =================================================
  // INPUT
  // =================================================

  input: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
  },

  messageInput: {
    height: 120,
    paddingTop: 13,
  },

  // =================================================
  // OPTIONS
  // =================================================

  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
  },

  option: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
    marginRight: 10,
    marginBottom: 8,
  },

  optionMobile: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
  },

  selectedOption: {
    backgroundColor: "#081A33",
    borderColor: "#FF6B35",
  },

  optionText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: 14,
  },

  selectedOptionText: {
    color: "#FF6B35",
  },

  // =================================================
  // SEND BUTTON
  // =================================================

  sendButton: {
    width: "100%",
    backgroundColor: "#FF6B35",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 35,
    flexDirection: "row",
  },

  disabledButton: {
    opacity: 0.6,
  },

  sendButtonText: {
    color: "#081A33",
    fontSize: 15,
    fontWeight: "800",
    marginLeft: 8,
  },
});