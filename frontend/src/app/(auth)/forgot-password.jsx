import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleForgotPassword = async () => {
    if (loading) return;

    const cleanEmail = email.trim().toLowerCase();

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!cleanEmail) {
      Alert.alert(
        "Required",
        "Please enter your email address."
      );
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address."
      );
      return;
    }

    try {
      setLoading(true);

      console.log(
        "Requesting password reset for:",
        cleanEmail
      );

      const response = await api.post(
        "/auth/forgot-password",
        {
          email: cleanEmail,
        }
      );

      console.log(
        "Forgot password response:",
        response?.data
      );

      const resetToken =
        response?.data?.resetToken;

      // ==========================================
      // DEVELOPMENT FLOW
      // Backend currently returns resetToken
      // ==========================================

      if (resetToken) {
        console.log(
          "Reset token received:",
          resetToken
        );

        setLoading(false);

        router.push({
          pathname: "/(auth)/reset-password",
          params: {
            token: String(resetToken),
          },
        });

        return;
      }

      // ==========================================
      // PRODUCTION FLOW
      // ==========================================

      setLoading(false);

      Alert.alert(
        "Reset Link Sent",
        "Password reset instructions have been sent to your email address.",
        [
          {
            text: "OK",
            onPress: () => {
              router.replace("/(auth)/login");
            },
          },
        ]
      );
    } catch (error) {
      console.log(
        "Forgot password error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setLoading(false);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to process your request. Please try again.";

      Alert.alert(
        "Unable to Reset Password",
        message
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ======================================
              HEADER
          ====================================== */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-open-outline"
                size={34}
                color="#F5B82E"
              />
            </View>

            <Text style={styles.title}>
              Forgot Password?
            </Text>

            <Text style={styles.subtitle}>
              Enter your registered email address to
              reset your password.
            </Text>
          </View>

          {/* ======================================
              FORM
          ====================================== */}

          <View style={styles.form}>
            <Text style={styles.label}>
              Email Address
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={19}
                color="#64748B"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                returnKeyType="done"
                onSubmitEditing={
                  handleForgotPassword
                }
              />
            </View>

            {/* ==================================
                CONTINUE
            ================================== */}

            <TouchableOpacity
              style={[
                styles.submitButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={handleForgotPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View
                  style={styles.loadingContent}
                >
                  <ActivityIndicator
                    size="small"
                    color="#0B0F14"
                  />

                  <Text
                    style={styles.submitText}
                  >
                    Processing...
                  </Text>
                </View>
              ) : (
                <>
                  <Text
                    style={styles.submitText}
                  >
                    Continue
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color="#0B0F14"
                  />
                </>
              )}
            </TouchableOpacity>

            {/* ==================================
                BACK TO LOGIN
            ================================== */}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                router.replace(
                  "/(auth)/login"
                )
              }
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back-outline"
                size={17}
                color="#F5B82E"
              />

              <Text style={styles.loginText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>

          {/* ======================================
              NOTE
          ====================================== */}

          <Text style={styles.note}>
            Enter the email address associated with
            your Snax account.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },

  header: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
  },

  backButton: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0D2A4A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },

  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#102B49",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    maxWidth: 350,
  },

  form: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
  },

  label: {
    color: "#0B0F14",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },

  inputWrapper: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#0B0F14",
    fontSize: 14,
    paddingVertical: 0,
  },

  submitButton: {
    height: 52,
    backgroundColor: "#F5B82E",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.65,
  },

  submitText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "800",
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  loginButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 12,
  },

  loginText: {
    color: "#F5B82E",
    fontSize: 14,
    fontWeight: "700",
  },

  note: {
    color: "#64748B",
    fontSize: 11,
    textAlign: "center",
    marginTop: 18,
    maxWidth: 340,
  },
});