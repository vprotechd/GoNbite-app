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

// Logo is in assets/images/ at the project root
const Logo = require("../../../assets/images/Logo.png");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // WEB AUTOFILL FIX
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
  // LOGIN
  // --------------------------------------------------
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Required", "Please enter your email address.");
      return;
    }

    if (!password) {
      Alert.alert("Required", "Please enter your password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token, user } = response.data;

      if (!token) {
        Alert.alert(
          "Login Failed",
          "Authentication token was not received from the server.",
        );
        return;
      }

      await AsyncStorage.setItem("token", token);

      if (user) {
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(
        "Login error:",
        error?.response?.data || error?.message || error,
      );

      Alert.alert(
        "Login Failed",
        error?.response?.data?.message ||
          "Invalid email or password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // RENDER
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
          {/* ==========================================
              HEADER
          ========================================== */}
          <View style={styles.header}>
            <Image
              source={Logo}
              style={styles.logoImage}
              resizeMode="contain"
            />

            <Text style={styles.title}>Welcome Back</Text>

            <Text style={styles.subtitle}>
              Sign in to continue your food journey
            </Text>
          </View>

          {/* ==========================================
              LOGIN FORM
          ========================================== */}
          <View style={styles.formWrapper}>
            <View style={styles.form}>
              {/* EMAIL */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email Address</Text>

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
                    returnKeyType="next"
                     showSoftInputOnFocus={true}
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
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />

                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={styles.eyeIcon}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={19}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* FORGOT PASSWORD */}
         <TouchableOpacity
  style={styles.forgotButton}
  activeOpacity={0.7}
  onPress={() => {
    router.push("/(auth)/forgot-password");
  }}
  disabled={loading}
>
  <Text style={styles.forgotText}>
    Forgot Password?
  </Text>
</TouchableOpacity>

              {/* LOGIN BUTTON */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View style={styles.loadingButtonContent}>
                    <ActivityIndicator color="#0B0F14" size="small" />

                    <Text style={styles.loadingButtonText}>Signing In...</Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Sign In</Text>

                    <Ionicons name="arrow-forward" size={19} color="#0B0F14" />
                  </>
                )}
              </TouchableOpacity>

              {/* DIVIDER */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>or continue with</Text>

                <View style={styles.dividerLine} />
              </View>

              {/* SOCIAL BUTTONS */}
              <View style={styles.socialContainer}>
                {/* GOOGLE */}
                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      "Google Login",
                      "Google login will be available soon.",
                    )
                  }
                >
                  <Ionicons name="logo-google" size={19} color="#EA4335" />

                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                {/* APPLE */}
                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      "Apple Login",
                      "Apple login will be available soon.",
                    )
                  }
                >
                  <Ionicons name="logo-apple" size={19} color="#000000" />

                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>

                {/* FACEBOOK */}
                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      "Facebook Login",
                      "Facebook login will be available soon.",
                    )
                  }
                >
                  <Ionicons name="logo-facebook" size={19} color="#1877F2" />

                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* REGISTER */}
              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>Don't have an account?</Text>

                <TouchableOpacity
                  onPress={() => router.push("/(auth)/register")}
                  activeOpacity={0.7}
                >
                  <Text style={styles.link}> Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>


          {/* PARTNER LOGIN */}
<View style={styles.partnerSection}>
  <View style={styles.partnerDivider}>
    <View style={styles.dividerLine} />
    <Text style={styles.partnerDividerText}>ARE YOU A PARTNER?</Text>
    <View style={styles.dividerLine} />
  </View>

  {/* RESTAURANT LOGIN */}
  <TouchableOpacity
    style={styles.partnerButton}
    activeOpacity={0.8}
    onPress={() => router.push("/restaurant/login")}
  >
    <View style={styles.partnerIconContainer}>
      <Ionicons name="restaurant-outline" size={22} color="#F5B82E" />
    </View>

    <View style={styles.partnerTextContainer}>
      <Text style={styles.partnerTitle}>Restaurant Partner</Text>
      <Text style={styles.partnerSubtitle}>
        Manage your restaurant and orders
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color="#64748B"
    />
  </TouchableOpacity>

  {/* DELIVERY LOGIN */}
  <TouchableOpacity
    style={styles.partnerButton}
    activeOpacity={0.8}
    onPress={() => router.push("/delivery/login")}
  >
    <View style={styles.partnerIconContainer}>
      <Ionicons name="bicycle-outline" size={22} color="#F5B82E" />
    </View>

    <View style={styles.partnerTextContainer}>
      <Text style={styles.partnerTitle}>Delivery Partner</Text>
      <Text style={styles.partnerSubtitle}>
        Sign in and start delivering orders
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color="#64748B"
    />
  </TouchableOpacity>
</View>

          {/* FOOTER */}
          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <View style={styles.secureRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color="#64748B"
              />

              <Text style={styles.secureText}>Secure & private login</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==========================================
  // MAIN
  // ==========================================

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
    paddingTop: 22,
    paddingBottom: 35,
    alignItems: "center",
  },

  // ==========================================
  // HEADER
  // ==========================================

  header: {
    alignItems: "center",
    marginBottom: 26,
    width: "100%",
  },

  logoImage: {
    width: 250,
    height: 88,
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 6,
  },

  // ==========================================
  // FORM
  // ==========================================

  formWrapper: {
    width: "100%",
    maxWidth: 420,
  },

  form: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 9,
  },

  // ==========================================
  // INPUTS
  // ==========================================

  inputContainer: {
    marginBottom: 17,
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

  eyeIcon: {
    padding: 5,
    marginLeft: 5,
  },

  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 12,
    paddingVertical: 4,
  },

  forgotText: {
    color: "#F5B82E",
    fontSize: 13,
    fontWeight: "700",
  },

  // ==========================================
  // LOGIN BUTTON
  // ==========================================

  loginButton: {
    height: 52,
    backgroundColor: "#F5B82E",
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    flexDirection: "row",
    gap: 8,
  },

  disabledButton: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "800",
  },

  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  loadingButtonText: {
    color: "#0B0F14",
    fontSize: 15,
    fontWeight: "700",
  },

  // ==========================================
  // DIVIDER
  // ==========================================

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E6EB",
  },

  dividerText: {
    paddingHorizontal: 12,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "500",
  },

  // ==========================================
  // SOCIAL BUTTONS
  // ==========================================

  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 9,
  },

  socialButton: {
    flex: 1,
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    gap: 6,
  },

  socialText: {
    color: "#0B0F14",
    fontSize: 12,
    fontWeight: "600",
  },

  // ==========================================
  // REGISTER LINK
  // ==========================================

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },

  bottomText: {
    color: "#64748B",
    fontSize: 13,
  },

  link: {
    color: "#F5B82E",
    fontSize: 13,
    fontWeight: "800",
  },



  // ==========================================
// PARTNER LOGIN
// ==========================================

partnerSection: {
  marginTop: 24,
},

partnerDivider: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 14,
},

partnerDividerText: {
  paddingHorizontal: 10,
  fontSize: 10,
  fontWeight: "800",
  color: "#94A3B8",
  letterSpacing: 0.8,
},

partnerButton: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F8FAFC",
  borderWidth: 1,
  borderColor: "#E2E6EB",
  borderRadius: 14,
  padding: 12,
  marginBottom: 10,
},

partnerIconContainer: {
  width: 42,
  height: 42,
  borderRadius: 12,
  backgroundColor: "#081A33",
  justifyContent: "center",
  alignItems: "center",
  marginRight: 12,
},

partnerTextContainer: {
  flex: 1,
},

partnerTitle: {
  fontSize: 14,
  fontWeight: "800",
  color: "#0B0F14",
},

partnerSubtitle: {
  fontSize: 11,
  color: "#64748B",
  marginTop: 3,
},

  // ==========================================
  // FOOTER
  // ==========================================

  footer: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    marginTop: 22,
  },

  footerLine: {
    width: "100%",
    height: 1,
    backgroundColor: "#183050",
    marginBottom: 12,
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  secureText: {
    color: "#64748B",
    fontSize: 11,
  },
});
