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

import api from "../../services/api";

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();

  const token = Array.isArray(params.token)
    ? params.token[0]
    : params.token;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!token) {
      Alert.alert(
        "Invalid Reset Link",
        "The password reset token is missing or invalid.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/(auth)/forgot-password"),
          },
        ]
      );

      return;
    }

    if (!password) {
      Alert.alert(
        "Required",
        "Please enter your new password."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (!confirmPassword) {
      Alert.alert(
        "Required",
        "Please confirm your new password."
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Passwords Don't Match",
        "Password and confirm password must be the same."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/reset-password",
        {
          token: String(token),
          password,
          confirmPassword,
        }
      );

      console.log(
        "Reset password response:",
        response.data
      );

     Alert.alert(
  "Password Reset Successful",
  "Your password has been changed successfully. Please login with your new password.",
);

setTimeout(() => {
  router.replace("/(auth)/login");
}, 1500);
    } catch (error) {
      console.log(
        "Reset password error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Reset Failed",
        error?.response?.data?.message ||
          "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
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
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

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

            <View style={styles.iconCircle}>
              <Ionicons
                name="lock-closed-outline"
                size={34}
                color="#F5B82E"
              />
            </View>

            <Text style={styles.title}>
              Reset Password
            </Text>

            <Text style={styles.subtitle}>
              Create a new password for your Snax account.
            </Text>
          </View>

          {/* FORM */}

          <View style={styles.form}>
            {/* NEW PASSWORD */}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                New Password
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color="#64748B"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={19}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Confirm Password
              </Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color="#64748B"
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm new password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={
                    handleResetPassword
                  }
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() =>
                    setShowConfirmPassword(
                      (previous) => !previous
                    )
                  }
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={19}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* PASSWORD RULE */}

            <View style={styles.passwordRule}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#64748B"
              />

              <Text style={styles.passwordRuleText}>
                Password must contain at least 6 characters.
              </Text>
            </View>

            {/* RESET BUTTON */}

            <TouchableOpacity
              style={[
                styles.resetButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator
                    size="small"
                    color="#0B0F14"
                  />

                  <Text style={styles.resetButtonText}>
                    Resetting...
                  </Text>
                </View>
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#0B0F14"
                  />

                  <Text style={styles.resetButtonText}>
                    Reset Password
                  </Text>
                </>
              )}
            </TouchableOpacity>

            {/* BACK TO LOGIN */}

            <TouchableOpacity
              style={styles.loginButton}
              onPress={() =>
                router.replace("/(auth)/login")
              }
              disabled={loading}
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

  inputContainer: {
    marginBottom: 17,
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

  eyeButton: {
    padding: 5,
    marginLeft: 5,
  },

  passwordRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -4,
    marginBottom: 4,
  },

  passwordRuleText: {
    color: "#64748B",
    fontSize: 11,
  },

  resetButton: {
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

  resetButtonText: {
    color: "#0B0F14",
    fontSize: 15,
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
});