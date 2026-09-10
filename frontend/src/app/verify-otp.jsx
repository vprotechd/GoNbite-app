import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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

import api from "../services/api";

export default function VerifyOTP() {
  // =====================================================
  // GET EMAIL FROM FORGOT PASSWORD SCREEN
  // =====================================================

  const params = useLocalSearchParams();

  const email = Array.isArray(params.email)
    ? params.email[0]
    : params.email;

  // =====================================================
  // STATES
  // =====================================================

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async () => {
     if (loading) return;
    if (!email) {
      Alert.alert(
        "Invalid Request",
        "Email address is missing. Please go back and try again."
      );
      return;
    }

    if (!otp) {
      Alert.alert(
        "OTP Required",
        "Please enter the OTP sent to your email."
      );
      return;
    }

    if (otp.length !== 6) {
      Alert.alert(
        "Invalid OTP",
        "Please enter the complete 6-digit OTP."
      );
      return;
    }

    try {
      setLoading(true);

      console.log("========== VERIFY OTP ==========");
      console.log("EMAIL:", email);
      console.log("OTP LENGTH:", otp.length);

      const response = await api.post(
        "/auth/verify-reset-otp",
        {
          email: String(email),
          otp: String(otp),
        }
      );

      console.log(
        "VERIFY OTP RESPONSE:",
        response.data
      );

      const resetToken =
        response.data?.resetToken;

      if (!resetToken) {
        Alert.alert(
          "Verification Failed",
          "Reset token was not received from the server."
        );
        return;
      }

      router.replace({
  pathname: "/reset-password",
  params: {
    token: String(resetToken),
  },
});

      

    } catch (error) {
      console.error(
        "VERIFY OTP ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Verification Failed",
        error?.response?.data?.message ||
          "Invalid or expired OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              disabled={loading}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#F5B82E"
              />

              <Text style={styles.headerTitle}>
                Verify OTP
              </Text>
            </View>

            <View style={styles.headerSide} />
          </View>

          {/* =================================================
              CONTENT
          ================================================= */}

          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="mail-outline"
                size={38}
                color="#F5B82E"
              />
            </View>

            <Text style={styles.title}>
              Check Your Email
            </Text>

            <Text style={styles.description}>
              We have sent a 6-digit verification code
              to:
            </Text>

            <Text style={styles.email}>
              {email || "your email"}
            </Text>

            {/* =================================================
                OTP INPUT
            ================================================= */}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Enter OTP
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="keypad-outline"
                  size={20}
                  color="#64748B"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP"
                  placeholderTextColor="#94A3B8"
                  value={otp}
                  onChangeText={(value) => {
                    const numbersOnly =
                      value.replace(/[^0-9]/g, "");

                    setOtp(
                      numbersOnly.slice(0, 6)
                    );
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleVerifyOTP
                  }
                />
              </View>
            </View>

            {/* =================================================
                VERIFY BUTTON
            ================================================= */}

            <TouchableOpacity
              style={[
                styles.button,
                loading && styles.buttonDisabled,
              ]}
              onPress={handleVerifyOTP}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator
                  size="small"
                  color="#081A33"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#081A33"
                  />

                  <Text style={styles.buttonText}>
                    Verify OTP
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* =================================================
                INFO
            ================================================= */}

            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={19}
                color="#F5B82E"
              />

              <Text style={styles.infoText}>
                The OTP is valid for 5 minutes.
                Check your spam or junk folder if
                you don't see the email.
              </Text>
            </View>

            {/* =================================================
                BACK TO LOGIN
            ================================================= */}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                router.replace(
                  "/(auth)/login"
                )
              }
              disabled={loading}
            >
              <Text style={styles.loginText}>
                Back to Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

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
    paddingBottom: 40,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 65,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#163052",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  headerSide: {
    width: 40,
  },

  // ===================================================
  // CONTENT
  // ===================================================

  content: {
    paddingHorizontal: 24,
    paddingTop: 45,
  },

  iconContainer: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#13294A",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },

  description: {
    color: "#AAB8CA",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },

  email: {
    color: "#F5B82E",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 35,
  },

  // ===================================================
  // INPUT
  // ===================================================

  inputContainer: {
    marginBottom: 22,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 9,
  },

  inputWrapper: {
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EA",
  },

  inputIcon: {
    marginLeft: 16,
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#081A33",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 5,
    paddingHorizontal: 5,
  },

  // ===================================================
  // BUTTON
  // ===================================================

  button: {
    height: 55,
    borderRadius: 12,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  buttonText: {
    color: "#081A33",
    fontSize: 16,
    fontWeight: "800",
  },

  // ===================================================
  // INFO
  // ===================================================

  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#102443",
    borderRadius: 12,
    padding: 14,
    marginTop: 22,
    gap: 10,
  },

  infoText: {
    flex: 1,
    color: "#AAB8CA",
    fontSize: 13,
    lineHeight: 19,
  },

  // ===================================================
  // LOGIN
  // ===================================================

  loginButton: {
    alignItems: "center",
    marginTop: 28,
    paddingVertical: 10,
  },

  loginText: {
    color: "#F5B82E",
    fontSize: 14,
    fontWeight: "700",
  },
});