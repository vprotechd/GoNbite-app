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
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../../services/api";

export default function DeliveryLogin() {
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
      const res = await api.post("/delivery/login", { email, password });
      await AsyncStorage.setItem("deliveryToken", res.data.token);
      router.replace("/delivery/dashboard");
    } catch (error: any) {
      Alert.alert(
        "Login Failed",
        error.response?.data?.error || "Invalid credentials or pending approval."
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* --- HEADER --- */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="bicycle" size={48} color="#F5B82E" />
              <Text style={styles.title}>Delivery Partner</Text>
              <Text style={styles.subtitle}>Sign in to start delivering</Text>
            </View>
          </View>

          {/* --- FORM --- */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@email.com"
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

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B0F14" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/delivery/register")}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Don't have an account? Register here
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, alignItems: "center" },

  header: { alignItems: "center", marginBottom: 30 },
  logoContainer: { alignItems: "center", gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#0B0F14", marginTop: 12 },
  subtitle: { fontSize: 16, color: "#64748B" },

  formContainer: { width: "100%", maxWidth: 400, gap: 14 },
  label: { fontSize: 14, fontWeight: "600", color: "#0B0F14", marginBottom: 4 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0B0F14",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },
  loginButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  loginButtonText: { color: "#0B0F14", fontWeight: "700", fontSize: 17 },
  linkContainer: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#F5B82E", fontWeight: "600" },
});