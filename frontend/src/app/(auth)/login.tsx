import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  useFacebookLogin,
  useGoogleLogin,
} from "../../services/oauthService";

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

// Logo
const Logo = require("../../../assets/images/Logo.png");

export default function LoginScreen() {
  const googleLogin = useGoogleLogin();
  const facebookLogin = useFacebookLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --------------------------------------------------
  // WEB AUTOFILL / INPUT OUTLINE FIX
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

          input.style.outline = "none";
          input.style.boxShadow = "none";
          input.style.border = "none";
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // --------------------------------------------------
  // NORMAL LOGIN
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
          "Authentication token was not received from the server."
        );
        return;
      }

      await AsyncStorage.setItem("token", token);

      if (user) {
        await AsyncStorage.setItem("user", JSON.stringify(user));
      }

      console.log("NORMAL LOGIN SUCCESS");
      console.log("USER:", user);
      console.log("TOKEN SAVED:", true);

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(
        "Login error:",
        error?.response?.data || error?.message || error
      );

      Alert.alert(
        "Login Failed",
        error?.response?.data?.message ||
          "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // GOOGLE LOGIN
  // --------------------------------------------------

  const handleGooglePress = async () => {
    if (loading) return;

    try {
      setLoading(true);

      console.log("=================================");
      console.log("GOOGLE LOGIN START");
      console.log("=================================");

     const result = await googleLogin.promptAsync();

if (!(result as any)?.type || (result as any).type !== "success") {
  Alert.alert("Google Login", "Google login failed or was cancelled.");
  return;
}

console.log("GOOGLE LOGIN SUCCESS");

      // Give the OAuth service a moment to finish
      // saving the backend session.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      console.log("GOOGLE TOKEN EXISTS:", !!token);
      console.log("GOOGLE USER:", userString);

      if (!token || !userString) {
        console.error(
          "GOOGLE LOGIN ERROR: token or user was not saved."
        );

        Alert.alert(
          "Google Login",
          "Google authentication succeeded, but your GoNbite session could not be created."
        );

        return;
      }

      let user;

      try {
        user = JSON.parse(userString);
      } catch (parseError) {
        console.error("GOOGLE USER JSON ERROR:", parseError);

        Alert.alert(
          "Google Login",
          "Invalid user session received."
        );

        return;
      }

      console.log("GOOGLE USER ROLE:", user?.role);

      // Social users are customers in GoNbite.
      if (!user?.role) {
        user.role = "customer";

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        console.log("GOOGLE ROLE SET TO CUSTOMER");
      }

      if (user.role !== "customer") {
        console.error(
          "GOOGLE LOGIN UNEXPECTED ROLE:",
          user.role
        );

        Alert.alert(
          "Google Login",
          "This account does not have customer access."
        );

        return;
      }

      console.log("GOOGLE LOGIN COMPLETE");
      console.log("NAVIGATING TO CUSTOMER HOME");

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "Google Login Error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Google Login",
        "Something went wrong while logging in with Google."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // FACEBOOK LOGIN
  // --------------------------------------------------

  const handleFacebookPress = async () => {
    if (loading) return;

    try {
      setLoading(true);

      console.log("=================================");
      console.log("FACEBOOK LOGIN START");
      console.log("=================================");

      const result = await facebookLogin.promptAsync();

if (!(result as any)?.type || (result as any).type !== "success") {
  Alert.alert("Facebook Login", "Facebook login failed or was cancelled.");
  return;
}

console.log("FACEBOOK LOGIN SUCCESS");

      // Give the OAuth service a moment to finish
      // saving the backend session.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      console.log("FACEBOOK TOKEN EXISTS:", !!token);
      console.log("FACEBOOK USER:", userString);

      if (!token || !userString) {
        console.error(
          "FACEBOOK LOGIN ERROR: token or user was not saved."
        );

        Alert.alert(
          "Facebook Login",
          "Facebook authentication succeeded, but your GoNbite session could not be created."
        );

        return;
      }

      let user;

      try {
        user = JSON.parse(userString);
      } catch (parseError) {
        console.error("FACEBOOK USER JSON ERROR:", parseError);

        Alert.alert(
          "Facebook Login",
          "Invalid user session received."
        );

        return;
      }

      console.log("FACEBOOK USER ROLE:", user?.role);

      // Social users are customers in GoNbite.
      if (!user?.role) {
        user.role = "customer";

        await AsyncStorage.setItem(
          "user",
          JSON.stringify(user)
        );

        console.log("FACEBOOK ROLE SET TO CUSTOMER");
      }

      if (user.role !== "customer") {
        console.error(
          "FACEBOOK LOGIN UNEXPECTED ROLE:",
          user.role
        );

        Alert.alert(
          "Facebook Login",
          "This account does not have customer access."
        );

        return;
      }

      console.log("FACEBOOK LOGIN COMPLETE");
      console.log("NAVIGATING TO CUSTOMER HOME");

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error(
        "Facebook Login Error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Facebook Login",
        "Something went wrong while logging in with Facebook."
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
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.navy}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : 20
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ==================================================
              HEADER
          ================================================== */}

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

          {/* ==================================================
              LOGIN CARD
          ================================================== */}

          <View style={styles.formWrapper}>
            <View style={styles.form}>
              {/* EMAIL */}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  Email Address
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={COLORS.icon}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor={COLORS.placeholder}
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
                <Text style={styles.inputLabel}>
                  Password
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={COLORS.icon}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.placeholder}
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
                    onPress={() =>
                      setShowPassword((prev) => !prev)
                    }
                    style={styles.eyeIcon}
                    disabled={loading}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={19}
                      color={COLORS.icon}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* FORGOT PASSWORD */}

              <TouchableOpacity
                style={styles.forgotButton}
                activeOpacity={0.7}
                onPress={() =>
                  router.push(
                    "/(auth)/forgot-password"
                  )
                }
                disabled={loading}
              >
                <Text style={styles.forgotText}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* LOGIN BUTTON */}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <View
                    style={styles.loadingButtonContent}
                  >
                    <ActivityIndicator
                      color={COLORS.navy}
                      size="small"
                    />

                    <Text
                      style={styles.loadingButtonText}
                    >
                      Signing In...
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>
                      Sign In
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color={COLORS.navy}
                    />
                  </>
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
                {/* GOOGLE */}

                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={handleGooglePress}
                  disabled={loading}
                >
                  <Image
                    source={require("../../../assets/images/google-logo.png")}
                    style={styles.googleLogo}
                  />

                  <Text style={styles.socialText}>
                    Google
                  </Text>
                </TouchableOpacity>

                {/* APPLE */}

                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={() =>
                    Alert.alert(
                      "Apple Login",
                      "Apple login will be available soon."
                    )
                  }
                  disabled={loading}
                >
                  <Ionicons
                    name="logo-apple"
                    size={19}
                    color="#000000"
                  />

                  <Text style={styles.socialText}>
                    Apple
                  </Text>
                </TouchableOpacity>

                {/* FACEBOOK */}

                <TouchableOpacity
                  style={styles.socialButton}
                  activeOpacity={0.7}
                  onPress={handleFacebookPress}
                  disabled={loading}
                >
                  <Ionicons
                    name="logo-facebook"
                    size={19}
                    color="#1877F2"
                  />

                  <Text style={styles.socialText}>
                    Facebook
                  </Text>
                </TouchableOpacity>
              </View>

              {/* REGISTER */}

              <View style={styles.bottomRow}>
                <Text style={styles.bottomText}>
                  Don't have an account?
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/(auth)/register"
                    )
                  }
                  activeOpacity={0.7}
                  disabled={loading}
                >
                  <Text style={styles.link}>
                    {" "}
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ==================================================
              PARTNER LOGIN
          ================================================== */}

          <View style={styles.partnerSection}>
            <View style={styles.partnerDivider}>
              <View style={styles.dividerLine} />

              <Text
                style={styles.partnerDividerText}
              >
                ARE YOU A PARTNER?
              </Text>

              <View style={styles.dividerLine} />
            </View>

            {/* RESTAURANT */}

            <TouchableOpacity
              style={styles.partnerButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/restaurant/login")
              }
              disabled={loading}
            >
              <View style={styles.partnerTextContainer}>
                <Text style={styles.partnerTitle}>
                  Restaurant Partner
                </Text>

                <Text style={styles.partnerSubtitle}>
                  Manage your restaurant and orders
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.icon}
              />
            </TouchableOpacity>

            {/* DELIVERY */}

            <TouchableOpacity
              style={styles.partnerButton}
              activeOpacity={0.8}
              onPress={() =>
                router.push("/delivery/login")
              }
              disabled={loading}
            >
              <View style={styles.partnerTextContainer}>
                <Text style={styles.partnerTitle}>
                  Delivery Partner
                </Text>

                <Text style={styles.partnerSubtitle}>
                  Sign in and start delivering orders
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.icon}
              />
            </TouchableOpacity>
          </View>

          {/* ==================================================
              FOOTER
          ================================================== */}

          <View style={styles.footer}>
            <View style={styles.footerLine} />

            <View style={styles.secureRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={COLORS.icon}
              />

              <Text style={styles.secureText}>
                Secure & private login
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ==========================================================
// COLORS
// ==========================================================

const COLORS = {
  navy: "#081A33",
  navyLight: "#183050",

  orange: "#FF8500",

  white: "#FFFFFF",
  black: "#0B0F14",

  inputBackground: "#F8FAFC",
  inputBorder: "#E2E8F0",

  icon: "#64748B",
  placeholder: "#94A3B8",

  divider: "#E2E6EB",
};

// ==========================================================
// STYLES
// ==========================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  scrollContent: {
    flexGrow: 1,
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 35,
    alignItems: "center",
  },

  header: {
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    marginBottom: 26,
  },

  logoImage: {
    width: 250,
    height: 88,
    marginBottom: 14,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: 0.2,
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.placeholder,
    textAlign: "center",
    marginTop: 6,
  },

  formWrapper: {
    width: "100%",
    maxWidth: 420,
  },

  form: {
    width: "100%",
    backgroundColor: COLORS.white,
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

  inputContainer: {
    marginBottom: 17,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.black,
    marginBottom: 7,
    marginLeft: 2,
  },

  inputWrapper: {
    height: 50,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.inputBackground,

    borderWidth: 1,
    borderColor: COLORS.inputBorder,

    borderRadius: 12,

    paddingHorizontal: 14,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,

    height: "100%",

    fontSize: 14,
    color: COLORS.black,

    paddingVertical: 0,

    outlineStyle: "none" as any,

    borderWidth: 0,
    borderColor: "transparent",

    backgroundColor: "transparent",
  },

  eyeIcon: {
    padding: 5,
    marginLeft: 5,
  },

  forgotButton: {
    alignSelf: "flex-end",

    marginTop: -4,
    marginBottom: 12,

    paddingVertical: 4,
  },

  forgotText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: "700",
  },

  loginButton: {
    height: 52,

    backgroundColor: COLORS.orange,

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
    color: COLORS.navy,
    fontSize: 16,
    fontWeight: "800",
  },

  loadingButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  loadingButtonText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: "700",
  },

  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.divider,
  },

  dividerText: {
    paddingHorizontal: 12,
    color: COLORS.icon,
    fontSize: 12,
    fontWeight: "500",
  },

  socialContainer: {
    width: "100%",
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

    backgroundColor: COLORS.inputBackground,

    borderWidth: 1,
    borderColor: COLORS.inputBorder,

    gap: 6,
  },

  socialText: {
    color: COLORS.black,
    fontSize: 12,
    fontWeight: "600",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    marginTop: 20,
  },

  bottomText: {
    color: COLORS.icon,
    fontSize: 13,
  },

  link: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: "800",
  },

  partnerSection: {
    width: "100%",
    maxWidth: 420,

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

    color: COLORS.placeholder,

    letterSpacing: 0.8,
  },

  partnerButton: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.inputBackground,

    borderWidth: 1,
    borderColor: COLORS.inputBorder,

    borderRadius: 14,

    padding: 12,

    marginBottom: 10,
  },

  partnerIconContainer: {
    width: 42,
    height: 42,

    borderRadius: 12,

    backgroundColor: COLORS.navy,

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
    color: COLORS.black,
  },

  partnerSubtitle: {
    fontSize: 11,
    color: COLORS.icon,
    marginTop: 3,
  },

  footer: {
    width: "100%",
    maxWidth: 420,

    alignItems: "center",

    marginTop: 22,
  },

  footerLine: {
    width: "100%",

    height: 1,

    backgroundColor: COLORS.navyLight,

    marginBottom: 12,
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 5,
  },

  secureText: {
    color: COLORS.icon,
    fontSize: 11,
  },

  googleLogo: {
    width: 19,
    height: 19,
    resizeMode: "contain",
  },
});