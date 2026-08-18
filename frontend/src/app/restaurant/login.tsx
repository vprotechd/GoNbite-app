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
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/restaurant/login", { email, password });
      await AsyncStorage.setItem("restaurantToken", res.data.token);
      router.replace("/restaurant/dashboard");
       } catch (error: any) { // 👈 Add ": any" here
      Alert.alert(
        "Error",
        error?.response?.data?.error ||
        "Login failed. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* --- DARK HEADER --- */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Restaurant Panel</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* --- WHITE CARD --- */}
          <View style={styles.whiteCard}>
            <View style={styles.logoContainer}>
              <Ionicons name="storefront" size={48} color="#F5B82E" />
              <Text style={styles.cardTitle}>Welcome Back</Text>
              <Text style={styles.cardSubtitle}>
                Sign in to manage your restaurant
              </Text>
            </View>

            {/* --- FORM FIELDS --- */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="restaurant@email.com"
                placeholderTextColor="#8E9BAE"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#8E9BAE"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* --- BUTTON --- */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? "Logging in..." : "Sign In"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/restaurant/register")}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>
                  Don't have an account? Register your restaurant here
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },

  /* --- DARK HEADER --- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: { padding: 6 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* --- WHITE CARD --- */
  whiteCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  logoContainer: { alignItems: "center", marginBottom: 20 },
  cardTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  /* --- FIELDS --- */
  formContainer: { gap: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B0F14",
    marginBottom: 2,
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0B0F14",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  /* --- BUTTON --- */
  loginButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  loginButtonText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 17,
  },

  /* --- LINK --- */
  linkContainer: { marginTop: 16, alignItems: "center" },
  linkText: {
    color: "#F5B82E",
    fontWeight: "600",
  },
});
