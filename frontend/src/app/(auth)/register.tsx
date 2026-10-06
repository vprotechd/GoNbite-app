import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";

import {
  Alert,
  ActivityIndicator,
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
import {
  useFacebookLogin,
  useGoogleLogin,
} from "../../services/oauthService";

// ============================================================
// GO-NBITE COLORS
// ============================================================

const COLORS = {
  navy: "#061D4D",
  navyLight: "#102B5C",

  orange: "#FF6B35",
  orangeDark: "#E95727",
  orangeLight: "#FFF0EA",

  cream: "#FFF9F5",
  white: "#FFFFFF",

  dark: "#2F2926",
  text: "#3D3734",
  muted: "#718096",
  placeholder: "#9AA5B5",

  inputBg: "#FBFCFE",
  inputBorder: "#E4E8EE",

  success: "#22A06B",
  error: "#D64545",
};

// ============================================================
// LOGO
// ============================================================

const Logo = require("../../../assets/images/Logo.png");

// ============================================================
// COMPONENT
// ============================================================

export default function RegisterScreen() {
  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------------
  // SOCIAL LOGIN
  // ----------------------------------------------------------

  const googleLogin = useGoogleLogin();
  const facebookLogin = useFacebookLogin();

  // ----------------------------------------------------------
  // REMOVE BROWSER DEFAULT INPUT OUTLINE
  // ----------------------------------------------------------

  useEffect(() => {
    if (Platform.OS !== "web") return;

    const timer = setTimeout(() => {
      const inputs = document.querySelectorAll("input");

      inputs.forEach((input) => {
        input.setAttribute("autocomplete", "off");
        input.setAttribute("autocorrect", "off");
        input.setAttribute("spellcheck", "false");
        input.setAttribute("data-lpignore", "true");
        input.setAttribute("data-form-type", "other");

        // Remove browser black focus border
        const element = input as HTMLInputElement;

        element.style.outline = "none";
        element.style.border = "none";
        element.style.boxShadow = "none";
      });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ----------------------------------------------------------
  // TOAST HELPERS
  // ----------------------------------------------------------

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "top",
      visibilityTime: 1800,
      autoHide: true,
      topOffset: 55,
    });
  };

  const showErrorToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: message,
      position: "top",
      visibilityTime: 3000,
      autoHide: true,
      topOffset: 55,
    });
  };

  // ----------------------------------------------------------
  // REGISTER
  // ----------------------------------------------------------

  const handleRegister = async () => {
    // Name
    if (!name.trim()) {
      showErrorToast("Please enter your name.");
      return;
    }

    // Email
    if (!email.trim()) {
      showErrorToast("Please enter your email.");
      return;
    }

    // Correct email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
      showErrorToast("Please enter a valid email address.");
      return;
    }

    // Phone
    if (!phone.trim()) {
      showErrorToast("Please enter your phone number.");
      return;
    }

    if (phone.trim().length < 10) {
      showErrorToast("Please enter a valid phone number.");
      return;
    }

    // Password
    if (!password) {
      showErrorToast("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      showErrorToast("Password must be at least 8 characters.");
      return;
    }

    // Confirm password
    if (!confirmPassword) {
      showErrorToast("Please confirm your password.");
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

      console.log("Registration response:", response.data);

      /*
       * IMPORTANT:
       *
       * We are NOT saving the token here because after registration
       * the user should go to the LOGIN page.
       *
       * The user will receive/login with their credentials there.
       */

      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      showSuccessToast("Registration successful!");

      // Give Toast time to appear before navigating
      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 1200);
    } catch (error: any) {
      console.log(
        "Registration error:",
        error?.response?.data || error?.message
      );

      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to create account. Please try again.";

      showErrorToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------
  // GOOGLE LOGIN
  // ----------------------------------------------------------

  const handleGooglePress = async () => {
    try {
      const result = await googleLogin.promptAsync();

      if (result?.success) {
        showSuccessToast("Login successful!");

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1200);
      } else {
        showErrorToast("Google login failed or was cancelled.");
      }
    } catch (error) {
      console.error("Google login error:", error);
      showErrorToast("Google login failed.");
    }
  };

  // ----------------------------------------------------------
  // FACEBOOK LOGIN
  // ----------------------------------------------------------

  const handleFacebookPress = async () => {
    try {
      const result = await facebookLogin.promptAsync();

      if (result?.success) {
        showSuccessToast("Login successful!");

        setTimeout(() => {
          router.replace("/(tabs)");
        }, 1200);
      } else {
        showErrorToast("Facebook login failed or was cancelled.");
      }
    } catch (error) {
      console.error("Facebook login error:", error);
      showErrorToast("Facebook login failed.");
    }
  };

  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.navy}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
            <View style={styles.logoContainer}>
              <Image
                source={Logo}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={styles.orangeLine} />

            <Text style={styles.title}>Create Account</Text>

            <Text style={styles.subtitle}>
              Join GoNbite and start your delicious food journey.
            </Text>
          </View>

          {/* ==================================================
              FORM CARD
          ================================================== */}

          <View style={styles.formWrapper}>
            <View style={styles.formCard}>
              {/* Card heading */}

              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  Let's get started
                </Text>

                <Text style={styles.cardSubtitle}>
                  Create your GoNbite account in a few simple steps.
                </Text>
              </View>

              {/* ==================================================
                  FULL NAME
              ================================================== */}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Full Name</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person-outline"
                    size={19}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor={COLORS.placeholder}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* ==================================================
                  EMAIL
              ================================================== */}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Email Address</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail-outline"
                    size={19}
                    color={COLORS.orange}
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
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* ==================================================
                  PHONE
              ================================================== */}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Phone Number</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call-outline"
                    size={19}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor={COLORS.placeholder}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    underlineColorAndroid="transparent"
                  />
                </View>
              </View>

              {/* ==================================================
                  PASSWORD
              ================================================== */}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Password</Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={19}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor={COLORS.placeholder}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowPassword((previous) => !previous)
                    }
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={20}
                      color={COLORS.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ==================================================
                  CONFIRM PASSWORD
              ================================================== */}

              <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>
                  Confirm Password
                </Text>

                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={19}
                    color={COLORS.orange}
                    style={styles.inputIcon}
                  />

                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={COLORS.placeholder}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    underlineColorAndroid="transparent"
                  />

                  <TouchableOpacity
                    onPress={() =>
                      setShowConfirmPassword(
                        (previous) => !previous
                      )
                    }
                    style={styles.eyeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword
                          ? "eye-outline"
                          : "eye-off-outline"
                      }
                      size={20}
                      color={COLORS.muted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ==================================================
                  REGISTER BUTTON
              ================================================== */}

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
                    color={COLORS.white}
                    size="small"
                  />
                ) : (
                  <>
                    <Text style={styles.registerButtonText}>
                      Create Account
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={20}
                      color={COLORS.white}
                    />
                  </>
                )}
              </TouchableOpacity>

              {/* ==================================================
                  DIVIDER
              ================================================== */}

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />

                <Text style={styles.dividerText}>
                  OR CONTINUE WITH
                </Text>

                <View style={styles.dividerLine} />
              </View>

              {/* ==================================================
                  SOCIAL LOGIN
              ================================================== */}

              <View style={styles.socialContainer}>
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGooglePress}
                  activeOpacity={0.75}
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
                      "Apple login will be available soon.",
                    )
                  }
                >
                  <Ionicons name="logo-apple" size={19} color="#000000" />

                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>


                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleFacebookPress}
                  activeOpacity={0.75}
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

              {/* ==================================================
                  LOGIN
              ================================================== */}

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                  Already have an account?
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    router.push("/(auth)/login")
                  }
                  activeOpacity={0.7}
                >
                  <Text style={styles.loginLink}>
                    {" "}
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Small footer text */}

              <Text style={styles.footerText}>
                By creating an account, you agree to GoNbite's
                Terms & Privacy Policy.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ==================================================
          TOAST
      ================================================== */}

      <Toast />
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ----------------------------------------------------------
  // MAIN
  // ----------------------------------------------------------

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
    alignItems: "center",

    paddingHorizontal: 20,
    paddingTop: Platform.OS === "web" ? 35 : 20,
    paddingBottom: 50,
  },

  // ----------------------------------------------------------
  // HEADER
  // ----------------------------------------------------------

  header: {
    width: "100%",
    maxWidth: 600,
    alignItems: "center",

    marginBottom: 30,
  },

  logoContainer: {
    width: 260,
    height: 105,

    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 245,
    height: 95,
  },

  orangeLine: {
    width: 55,
    height: 5,

    borderRadius: 10,

    backgroundColor: COLORS.orange,

    marginTop: 4,
    marginBottom: 18,
  },

  title: {
    fontSize: 30,
    lineHeight: 38,

    fontWeight: "800",

    color: COLORS.white,

    textAlign: "center",

    letterSpacing: -0.5,
  },

  subtitle: {
    maxWidth: 430,

    fontSize: 14,
    lineHeight: 22,

    color: "#AAB6C8",

    textAlign: "center",

    marginTop: 7,
  },

  // ----------------------------------------------------------
  // FORM
  // ----------------------------------------------------------

  formWrapper: {
    width: "100%",
    maxWidth: 520,
  },

  formCard: {
    backgroundColor: COLORS.white,

    borderRadius: 24,

    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 28,

    // Native shadow
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 12,
        },
        shadowOpacity: 0.15,
        shadowRadius: 25,
      },

      android: {
        elevation: 10,
      },

      web: {
        boxShadow: "0px 18px 45px rgba(0, 0, 0, 0.14)",
      },
    }),
  },

  // ----------------------------------------------------------
  // CARD HEADER
  // ----------------------------------------------------------

  cardHeader: {
    marginBottom: 25,
  },

  cardTitle: {
    fontSize: 23,
    fontWeight: "800",

    color: COLORS.dark,

    marginBottom: 6,
  },

  cardSubtitle: {
    fontSize: 13.5,
    lineHeight: 20,

    color: COLORS.muted,
  },

  // ----------------------------------------------------------
  // INPUT FIELDS
  // ----------------------------------------------------------

  fieldContainer: {
    marginBottom: 17,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",

    color: COLORS.text,

    marginBottom: 7,
  },

  inputWrapper: {
    height: 53,

    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.inputBg,

    borderWidth: 1,
    borderColor: COLORS.inputBorder,

    borderRadius: 14,

    paddingHorizontal: 15,

    // Important:
    // This prevents the browser/native focus outline
    // from creating a black border.
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
        } as any)
      : {}),
  },

  inputIcon: {
    marginRight: 11,
  },

  input: {
    flex: 1,

    height: "100%",

    fontSize: 14.5,

    color: COLORS.dark,

    paddingVertical: 0,
    paddingHorizontal: 0,

    // Android
    underlineColorAndroid: "transparent",

    // Web
    ...(Platform.OS === "web"
      ? ({
          outlineStyle: "none",
          outlineWidth: 0,
          outlineColor: "transparent",
          borderWidth: 0,
          borderColor: "transparent",
          boxShadow: "none",
        } as any)
      : {}),
  },

  eyeButton: {
    width: 34,
    height: 40,

    justifyContent: "center",
    alignItems: "center",

    marginLeft: 5,
  },

  // ----------------------------------------------------------
  // REGISTER BUTTON
  // ----------------------------------------------------------

  registerButton: {
    height: 54,

    width: "100%",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 10,

    backgroundColor: COLORS.orange,

    borderRadius: 14,

    marginTop: 4,

    ...Platform.select({
      ios: {
        shadowColor: COLORS.orange,
        shadowOffset: {
          width: 0,
          height: 5,
        },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },

      android: {
        elevation: 5,
      },

      web: {
        boxShadow: "0px 8px 18px rgba(255, 107, 53, 0.22)",
      },
    }),
  },

  disabledButton: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: COLORS.white,

    fontSize: 16,

    fontWeight: "800",
  },

  // ----------------------------------------------------------
  // DIVIDER
  // ----------------------------------------------------------

  dividerContainer: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    marginVertical: 22,
  },

  dividerLine: {
    flex: 1,

    height: 1,

    backgroundColor: "#E7E9ED",
  },

  dividerText: {
    paddingHorizontal: 12,

    color: "#9AA2AE",

    fontSize: 10.5,

    fontWeight: "700",

    letterSpacing: 0.6,
  },

  // ----------------------------------------------------------
  // SOCIAL BUTTONS
  // ----------------------------------------------------------

  socialContainer: {
    width: "100%",

    flexDirection: "row",

    gap: 12,
  },

  socialButton: {
    flex: 1,

    height: 48,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 9,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.inputBorder,

    borderRadius: 12,
  },

  socialText: {
    color: COLORS.text,

    fontSize: 13,

    fontWeight: "700",
  },

  // ----------------------------------------------------------
  // LOGIN
  // ----------------------------------------------------------

  loginContainer: {
    flexDirection: "row",

    justifyContent: "center",
    alignItems: "center",

    marginTop: 23,
  },

  loginText: {
    color: COLORS.muted,

    fontSize: 13,
  },

  loginLink: {
    color: COLORS.orange,

    fontSize: 13,

    fontWeight: "800",
  },

  // ----------------------------------------------------------
  // FOOTER
  // ----------------------------------------------------------

  footerText: {
    color: "#A0A7B2",

    fontSize: 10.5,

    lineHeight: 16,

    textAlign: "center",

    marginTop: 18,

    paddingHorizontal: 10,
  },
  googleLogo: {
  width: 19,
  height: 19,
  resizeMode: "contain",
},
});