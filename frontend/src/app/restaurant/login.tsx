import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import {
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

export default function RestaurantLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        "Error",
        "Please enter both email and password."
      );
      return;
    }

    setLoading(true);

    try {
      console.log("🍽️ RESTAURANT LOGIN START");
      console.log("📧 EMAIL:", email);

      const res = await api.post("/restaurant/login", {
        email,
        password,
      });

      console.log(
        "🍽️ RESTAURANT LOGIN RESPONSE:",
        res.data
      );

      const token = res.data?.token;

      if (!token) {
        throw new Error(
          "Restaurant token was not received from server."
        );
      }

      /*
       * ============================================
       * IMPORTANT:
       * REMOVE DELIVERY SESSION
       *
       * Restaurant and Delivery must not share
       * active authentication sessions.
       * ============================================
       */

      await AsyncStorage.removeItem(
        "deliveryToken"
      );

      /*
       * ============================================
       * SAVE RESTAURANT TOKEN
       * ============================================
       */

      await AsyncStorage.setItem(
        "restaurantToken",
        token
      );

      /*
       * ============================================
       * SAVE RESTAURANT USER
       *
       * RestaurantLayout requires:
       * user.role === "restaurant"
       * ============================================
       */

      const restaurantUser = {
        ...(res.data?.user || {}),
        role: "restaurant",
      };

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(restaurantUser)
      );

      /*
       * ============================================
       * VERIFY STORAGE
       * ============================================
       */

      const savedRestaurantToken =
        await AsyncStorage.getItem(
          "restaurantToken"
        );

      const savedDeliveryToken =
        await AsyncStorage.getItem(
          "deliveryToken"
        );

      const savedUser =
        await AsyncStorage.getItem("user");

      console.log(
        "🍽️ RESTAURANT TOKEN SAVED:",
        !!savedRestaurantToken
      );

      console.log(
        "🚴 DELIVERY TOKEN AFTER RESTAURANT LOGIN:",
        savedDeliveryToken
      );

      console.log(
        "👤 USER SAVED:",
        savedUser
      );

      /*
       * ============================================
       * GO TO RESTAURANT DASHBOARD
       * ============================================
       */

      console.log(
        "➡️ GOING TO RESTAURANT DASHBOARD"
      );

      router.replace(
        "/restaurant/dashboard"
      );

    } catch (error) {
      console.error(
        "❌ RESTAURANT LOGIN ERROR:",
        error
      );

      const err = error as any;

      const errorMessage =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please check your credentials.";

      Alert.alert(
        "Error",
        errorMessage
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
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name="arrow-back"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Restaurant Panel
            </Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* LOGIN CARD */}

          <View style={styles.whiteCard}>
            <View style={styles.logoContainer}>
              <Ionicons
                name="storefront"
                size={42}
                color="#FF6B35"
              />

              <Text style={styles.cardTitle}>
                Welcome Back
              </Text>

              <Text style={styles.cardSubtitle}>
                Sign in to manage your restaurant
              </Text>
            </View>

            {/* FORM */}

            <View style={styles.formContainer}>
              <View>
                <Text style={styles.label}>
                  Email Address
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="restaurant@email.com"
                  placeholderTextColor="#8E9BAE"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View>
                <Text style={styles.label}>
                  Password
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor="#8E9BAE"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* LOGIN BUTTON */}

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading &&
                    styles.disabledButton,
                ]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  {loading
                    ? "Logging in..."
                    : "Sign In"}
                </Text>
              </TouchableOpacity>

              {/* REGISTER LINK */}

              <TouchableOpacity
                onPress={() =>
                  router.push(
                    "/restaurant/register"
                  )
                }
                style={styles.linkContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Don't have an account? Register
                  your restaurant here
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpace} />
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
    backgroundColor: "#F5F7FA",
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 25,
    alignItems: "center",
  },

  /* =========================
     HEADER
  ========================= */

  header: {
    width: "100%",
    maxWidth: 700,
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  headerSpacer: {
    width: 36,
  },

  /* =========================
     WHITE CARD
  ========================= */

  whiteCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 22,
    paddingVertical: 22,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 7,
    textAlign: "center",
  },

  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },

  /* =========================
     FORM
  ========================= */

  formContainer: {
    width: "100%",
    gap: 11,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0B0F14",
    marginBottom: 5,
  },

  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 9,
    fontSize: 14,
    color: "#0B0F14",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  /* =========================
     LOGIN BUTTON
  ========================= */

  loginButton: {
    alignSelf: "center",

    width: "65%",
    maxWidth: 230,
    minWidth: 150,

    height: 42,
    borderRadius: 10,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FF6B35",

    marginTop: 5,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  /* =========================
     REGISTER LINK
  ========================= */

  linkContainer: {
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  linkText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 17,
  },

  bottomSpace: {
    height: 25,
  },
});
