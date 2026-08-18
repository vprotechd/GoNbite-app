import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import {
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

export default function RestaurantRegister() {
  const [form, setForm] = useState({
    ownerName: "",
    restaurantName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    // 1. Validation
    if (
      !form.ownerName ||
      !form.restaurantName ||
      !form.email ||
      !form.password ||
      !form.phone ||
      !form.address
    ) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("ownerName", form.ownerName);
      formData.append("restaurantName", form.restaurantName);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("address", form.address);
      formData.append("password", form.password);

      // Handle image correctly for Web and Native
      if (image) {
        if (Platform.OS === "web") {
          // For Web Browsers: Fetch the image, convert to Blob, then to File
          const response = await fetch(image);
          const blob = await response.blob();
          const file = new File([blob], "restaurant-image.jpg", {
            type: "image/jpeg",
          });
          formData.append("image", file);
        } else {
          // For Native Mobile Apps: Keep original object structure
          formData.append("image", {
            uri: image,
            name: "restaurant-image.jpg",
            type: "image/jpeg",
          } as any);
        }
      }

      const response = await api.post("/restaurant/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert(
        "Success",
        "Restaurant registered successfully! Please login.",
      );
      // 4. Navigate to the Restaurant Login screen
      router.replace("/restaurant/login");
    } catch (error: any) {
      console.error(
        "Registration Error:",
        error?.response?.data || error.message,
      );
      Alert.alert(
        "Registration Failed",
        error?.response?.data?.error || "Something went wrong.",
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
            <Text style={styles.headerTitle}>Partner with SNAX</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* --- WHITE CARD --- */}
          <View style={styles.whiteCard}>
            <View style={styles.logoContainer}>
              <Ionicons name="storefront" size={48} color="#F5B82E" />
              <Text style={styles.cardTitle}>Register Restaurant</Text>
              <Text style={styles.cardSubtitle}>
                Join as a partner and start selling!
              </Text>
            </View>

            {/* --- FORM FIELDS --- */}
            <View style={styles.formContainer}>
              <Text style={styles.label}>Owner's Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#8E9BAE"
                value={form.ownerName}
                onChangeText={(text) => setForm({ ...form, ownerName: text })}
              />

              <Text style={styles.label}>Restaurant Name</Text>
              <TextInput
                style={styles.input}
                placeholder="The Food House"
                placeholderTextColor="#8E9BAE"
                value={form.restaurantName}
                onChangeText={(text) =>
                  setForm({ ...form, restaurantName: text })
                }
              />

              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="restaurant@email.com"
                placeholderTextColor="#8E9BAE"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) => setForm({ ...form, email: text })}
              />

              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#8E9BAE"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(text) => setForm({ ...form, phone: text })}
              />

              <Text style={styles.label}>Restaurant Address</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="123, Main Street, Food City..."
                placeholderTextColor="#8E9BAE"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={form.address}
                onChangeText={(text) => setForm({ ...form, address: text })}
              />

              {/* --- IMAGE UPLOAD --- */}
              <Text style={styles.label}>Restaurant Photo</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#F5B82E" />
                <Text style={styles.imagePickerText}>
                  {image ? "Change Image" : "Upload Restaurant Photo"}
                </Text>
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image }} style={styles.previewImage} />
              )}

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor="#8E9BAE"
                secureTextEntry
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
              />

              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                placeholderTextColor="#8E9BAE"
                secureTextEntry
                value={form.confirmPassword}
                onChangeText={(text) =>
                  setForm({ ...form, confirmPassword: text })
                }
              />

              {/* --- BUTTON --- */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? "Registering..." : "Register Restaurant"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace("/restaurant/login")}
                style={styles.linkContainer}
              >
                <Text style={styles.linkText}>
                  Already have an account? Sign In
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
  textArea: { height: 80, textAlignVertical: "top" },

  /* --- IMAGE PICKER --- */
  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9EF",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#F5B82E",
    borderStyle: "dashed",
    marginBottom: 4,
  },
  imagePickerText: {
    color: "#0B0F14",
    fontWeight: "600",
    marginLeft: 8,
  },
  previewImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginVertical: 8,
  },

  /* --- BUTTON --- */
  registerButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.6 },
  registerButtonText: {
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
