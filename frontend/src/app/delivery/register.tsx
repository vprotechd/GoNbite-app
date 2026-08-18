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
import api from "../../services/api";

export default function DeliveryRegister() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    vehicleType: "Bike",
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/delivery/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        vehicleType: form.vehicleType,
      });

      Alert.alert(
        "Registration Sent!",
        "Your account has been created. Please wait for Admin approval.",
        [{ text: "OK", onPress: () => router.replace("/delivery/login") }]
      );
    } catch (error: any) {
      Alert.alert(
        "Registration Failed",
        error.response?.data?.error || "Something went wrong."
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Partner with SNAX</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* --- FORM --- */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(text) => setForm({ ...form, name: text })}
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="partner@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={form.email}
              onChangeText={(text) => setForm({ ...form, email: text })}
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => setForm({ ...form, phone: text })}
            />

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.vehicleRow}>
              {["Bike", "Scooter", "Car"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleBtn,
                    form.vehicleType === type && styles.vehicleBtnActive,
                  ]}
                  onPress={() => setForm({ ...form, vehicleType: type })}
                >
                  <Text
                    style={[
                      styles.vehicleText,
                      form.vehicleType === type && styles.vehicleTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Create a password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => setForm({ ...form, password: text })}
            />

            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
            />

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#0B0F14" />
              ) : (
                <Text style={styles.registerButtonText}>
                  Register as Delivery Partner
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/delivery/login")}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>
                Already have an account? Sign In
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: { padding: 6 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },

  formContainer: { gap: 14 },
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

  vehicleRow: { flexDirection: "row", gap: 10, marginVertical: 6 },
  vehicleBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },
  vehicleBtnActive: { backgroundColor: "#F5B82E", borderColor: "#F5B82E" },
  vehicleText: { color: "#64748B", fontWeight: "600" },
  vehicleTextActive: { color: "#0B0F14" },

  registerButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  registerButtonText: { color: "#0B0F14", fontWeight: "700", fontSize: 17 },
  linkContainer: { marginTop: 16, alignItems: "center" },
  linkText: { color: "#F5B82E", fontWeight: "600" },
});