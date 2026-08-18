import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import Toast from "react-native-toast-message";

import api from "../../services/api";
import { useFacebookLogin, useGoogleLogin } from "../../services/oauthService";

// Logo
const Logo = require("../../../assets/images/Logo.png");

const { width } = Dimensions.get("window");

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const googleLogin = useGoogleLogin();
  const facebookLogin = useFacebookLogin();

  // --------------------------------------------------
  // WEB AUTOFILL CONTROL
  // --------------------------------------------------

  useEffect(() => {
    if (Platform.OS === "web") {
      const timer = setTimeout(() => {
        const inputs = document.querySelectorAll("input");

        inputs.forEach((input) => {
          input.setAttribute("autocomplete", "off");
          input.setAttribute("autocorrect", "off");
          input.setAttribute("spellcheck", "false");
          input.setAttribute("data-lpignore", "true");
          input.setAttribute("data-form-type", "other");
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // --------------------------------------------------
  // TOAST HELPERS
  // --------------------------------------------------

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "top",
      visibilityTime: 2000,
      autoHide: true,
      topOffset: 50,
    });
  };

  const showErrorToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: message,
      position: "top",
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 50,
    });
  };

  // --------------------------------------------------
  // REGISTER
  // --------------------------------------------------

  const handleRegister = async () => {
    if (!name.trim()) {
      showErrorToast("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      showErrorToast("Please enter your email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      showErrorToast("Please enter a valid email address.");
      return;
    }

    if (!phone.trim()) {
      showErrorToast("Please enter your phone number.");
      return;
    }

    if (!password) {
      showErrorToast("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      showErrorToast("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showErrorToast("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
      });

      const { token, user } = response.data;

      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("user", JSON.stringify(user));

      // SUCCESS TOAST
      showSuccessToast("Registration Successful!");

      // Delay navigation so user can see toast
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1500);
    } catch (error: any) {
      console.log(
        "Registration error:",
        error?.response?.data || error?.message,
      );

      const errorMessage =
        error?.response?.data?.message ||
        "Unable to create account. Please try again.";

      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGooglePress = async () => {
    try {
      const result = await googleLogin.promptAsync();

      if (result?.success) {
        showSuccessToast("Login Successful!");

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        showErrorToast("Google login failed or was cancelled.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      showErrorToast("Google login failed.");
    }
  };

  // --------------------------------------------------
  // FACEBOOK LOGIN
  // --------------------------------------------------

  const handleFacebookPress = async () => {
    try {
      const result = await facebookLogin.promptAsync();

      if (result?.success) {
        showSuccessToast("Login Successful!");

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1500);
      } else {
        showErrorToast("Facebook login failed or was cancelled.");
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      showErrorToast("Facebook login failed.");
    }
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

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
          {/* HEADER */}
          <View style={styles.header}>
            <Image
              source={Logo}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Join us and start your food journey
            </Text>
          </View>

          {/* FORM */}
          <View style={styles.formWrapper}>
            <View style={styles.form}>
              {/* FULL NAME */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#64748B"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* EMAIL */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#64748B"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* PHONE */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#64748B"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* PASSWORD */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#64748B"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        showPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CONFIRM PASSWORD */}
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={18}
                    color="#64748B"
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor="#64748B"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* REGISTER BUTTON */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator
                    color="#0B0F14"
                    size="small"
                  />
                ) : (
                  <Text style={styles.registerButtonText}>
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* DIVIDER */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>
                  or continue with
                </Text>

                <View style={styles.dividerLine} />
              </View>

              {/* SOCIAL LOGIN */}
              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGooglePress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="logo-google"
                    size={18}
                    color="#EA4335"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleFacebookPress}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="logo-facebook"
                    size={18}
                    color="#1877F2"
                  />
                </TouchableOpacity>
              </View>

              {/* LOGIN LINK */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?
                </Text>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/login")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}> Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* TOAST CONTAINER */}
      <Toast />
    </SafeAreaView>
  );
}

// --------------------------------------------------
// STYLES
// --------------------------------------------------

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

  // HEADER
  header: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },

  logoImage: {
    width: 260,
    height: 90,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },

  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },

  // FORM
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
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },

  // INPUTS
  inputContainer: {
    marginBottom: 12,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
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

  eyeIcon: {
    padding: 4,
  },

  // REGISTER BUTTON
  registerButton: {
    height: 50,
    backgroundColor: "#F5B82E",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "700",
  },

  // DIVIDER
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E6EB",
  },

  dividerText: {
    paddingHorizontal: 14,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },

  // SOCIAL BUTTONS
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },

  socialButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  // LOGIN
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },

  loginText: {
    color: "#64748B",
    fontSize: 13,
  },

  loginLink: {
    color: "#F5B82E",
    fontSize: 13,
    fontWeight: "700",
  },
});