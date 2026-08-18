import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const Logo = require("../../../assets/images/Logo.png");

export default function AdminLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      setTimeout(() => {
        const inputs = document.querySelectorAll("input");

        inputs.forEach((input) => {
          input.setAttribute("autocomplete", "off");
          input.setAttribute("autocorrect", "off");
          input.setAttribute("spellcheck", "false");
          input.setAttribute("data-lpignore", "true");
          input.setAttribute("data-form-type", "other");
        });
      }, 100);
    }
  }, []);

  const handleAdminLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter admin email.");
      return;
    }

    if (!password) {
      Alert.alert("Required", "Please enter admin password.");
      return;
    }

    try {
      setLoading(true);

      console.log("Admin login request started");

      const response = await api.post("/admin/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("Admin login response:", response.data);

      const { token } = response.data;

      if (!token) {
        Alert.alert("Login Error", "Admin token was not received.");
        return;
      }

      // IMPORTANT:
      // Admin authentication is stored separately
      await AsyncStorage.setItem("adminToken", token);

      // Remove normal user authentication
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      console.log("Admin token stored");

      // Directly open admin dashboard
      router.replace("/admin");
    } catch (error) {
      console.log(
        "Admin login error:",
        error?.response?.data || error?.message,
      );

      Alert.alert(
        "Admin Login Failed",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Invalid admin email or password.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image
              source={Logo}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <View style={styles.adminIconCircle}>
              <Ionicons
                name="shield-checkmark"
                size={34}
                color="#F5B82E"
              />
            </View>

            <Text style={styles.title}>Admin Login</Text>

            <Text style={styles.subtitle}>
              Sign in to manage your SNAX platform
            </Text>
          </View>

          <View style={styles.formWrapper}>
            <View style={styles.form}>
              {/* EMAIL */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Admin Email</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin email"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter admin password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() =>
                      setShowPassword((previous) => !previous)
                    }
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

              {/* SECURITY */}
              <View style={styles.securityBox}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color="#F5B82E"
                />

                <Text style={styles.securityText}>
                  This is a secure administrator-only login.
                </Text>
              </View>

              {/* LOGIN */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleAdminLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#0B0F14"
                    size="small"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="log-in-outline"
                      size={20}
                      color="#0B0F14"
                    />

                    <Text style={styles.loginButtonText}>
                      Admin Sign In
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* USER LOGIN */}
              <TouchableOpacity
                style={styles.backToLogin}
                onPress={() => router.replace("/(auth)/login")}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-back"
                  size={16}
                  color="#64748B"
                />

                <Text style={styles.backToLoginText}>
                  Back to User Login
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.footerText}>SNAX Admin Panel</Text>
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
    paddingTop: 25,
    paddingBottom: 40,
    alignItems: "center",
  },

  header: {
    width: "100%",
    alignItems: "center",
    marginBottom: 25,
  },

  logoImage: {
    width: 240,
    height: 80,
    marginBottom: 15,
  },

  adminIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#10284A",
    borderWidth: 2,
    borderColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },

  formWrapper: {
    width: "100%",
    maxWidth: 420,
  },

  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  inputContainer: {
    marginBottom: 18,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F14",
    marginBottom: 7,
    marginLeft: 2,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: "#0B0F14",
    paddingVertical: 0,
  },

  eyeButton: {
    padding: 5,
  },

  securityBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E8",
    borderWidth: 1,
    borderColor: "#F5B82E",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
  },

  securityText: {
    flex: 1,
    fontSize: 12,
    color: "#64748B",
    marginLeft: 8,
    lineHeight: 17,
  },

  loginButton: {
    height: 52,
    backgroundColor: "#F5B82E",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "700",
  },

  backToLogin: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 5,
  },

  backToLoginText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 5,
  },

  footerText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 25,
  },
});