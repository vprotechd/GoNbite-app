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

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
          const response = await fetch(image);
          const blob = await response.blob();

          const file = new File([blob], "restaurant-image.jpg", {
            type: "image/jpeg",
          });

          formData.append("image", file);
        } else {
          formData.append("image", {
            uri: image,
            name: "restaurant-image.jpg",
            type: "image/jpeg",
          } as any);
        }
      }

      const response = await api.post("/restaurant/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert(
        "Success",
        "Restaurant registered successfully! Please login.",
      );

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
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : Platform.OS === "web"
              ? undefined
              : "height"
        }
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- DARK HEADER --- */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Partner with GoNbite</Text>

            <View style={styles.headerSpacer} />
          </View>

          {/* --- WHITE CARD --- */}
          <View style={styles.whiteCard}>
            <View style={styles.logoContainer}>
              <Ionicons name="storefront" size={46} color="#FF6B35" />

              <Text style={styles.cardTitle}>Register Restaurant</Text>

              <Text style={styles.cardSubtitle}>
                Join as a partner and start selling!
              </Text>
            </View>

            {/* --- FORM FIELDS --- */}
            <View style={styles.formContainer}>
              {/* Owner Name */}
              <Text style={styles.label}>Owner's Full Name</Text>

              <TextInput
                style={styles.input}
                placeholder="Name"
                placeholderTextColor="#8E9BAE"
                value={form.ownerName}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    ownerName: text,
                  })
                }
              />

              {/* Restaurant Name */}
              <Text style={styles.label}>Restaurant Name</Text>

              <TextInput
                style={styles.input}
                placeholder="The Food House"
                placeholderTextColor="#8E9BAE"
                value={form.restaurantName}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    restaurantName: text,
                  })
                }
              />

              {/* Email */}
              <Text style={styles.label}>Email Address</Text>

              <TextInput
                style={styles.input}
                placeholder="restaurant@email.com"
                placeholderTextColor="#8E9BAE"
                keyboardType="email-address"
                autoCapitalize="none"
                value={form.email}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    email: text,
                  })
                }
              />

              {/* Phone */}
              <Text style={styles.label}>Phone Number</Text>

              <TextInput
                style={styles.input}
                placeholder="+91 9876543210"
                placeholderTextColor="#8E9BAE"
                keyboardType="phone-pad"
                value={form.phone}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    phone: text,
                  })
                }
              />

              {/* Address */}
              <Text style={styles.label}>Restaurant Address</Text>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="123, Main Street, Food City..."
                placeholderTextColor="#8E9BAE"
                multiline={true}
                numberOfLines={3}
                textAlignVertical="top"
                value={form.address}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    address: text,
                  })
                }
              />

              {/* --- IMAGE UPLOAD --- */}
              <Text style={styles.label}>Restaurant Photo</Text>

              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color="#FF6B35" />

                <Text style={styles.imagePickerText}>
                  {image ? "Change Image" : "Upload Restaurant Photo"}
                </Text>
              </TouchableOpacity>

              {image && (
                <Image source={{ uri: image }} style={styles.previewImage} />
              )}

              {/* --- PASSWORD --- */}
              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Create a password"
                  placeholderTextColor="#8E9BAE"
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      password: text,
                    })
                  }
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* --- CONFIRM PASSWORD --- */}
              <Text style={styles.label}>Confirm Password</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Confirm your password"
                  placeholderTextColor="#8E9BAE"
                  secureTextEntry={!showConfirmPassword}
                  value={form.confirmPassword}
                  onChangeText={(text) =>
                    setForm({
                      ...form,
                      confirmPassword: text,
                    })
                  }
                />

                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={21}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* --- REGISTER BUTTON --- */}
              <TouchableOpacity
                style={[
                  styles.registerButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? "Registering..." : "Register Restaurant"}
                </Text>
              </TouchableOpacity>

              {/* --- LOGIN LINK --- */}
              <TouchableOpacity
                onPress={() => router.replace("/restaurant/login")}
                style={styles.linkContainer}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>
                  Already have an account? Sign In
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
    width: "100%",
    alignItems: "center",
    paddingHorizontal: Platform.OS === "web" ? 24 : 16,
    paddingTop: Platform.OS === "web" ? 18 : 10,
    paddingBottom: 30,
  },

  /* --- DARK HEADER --- */
  header: {
    width: "100%",
    maxWidth: 650,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 36,
  },

  headerTitle: {
    fontSize: Platform.OS === "web" ? 20 : 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  /* --- WHITE CARD --- */
  whiteCard: {
    width: "100%",
    maxWidth: 600,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: Platform.OS === "web" ? 28 : 18,
    paddingVertical: Platform.OS === "web" ? 24 : 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: Platform.OS === "web" ? 22 : 21,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 7,
    textAlign: "center",
  },

  cardSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },

  /* --- FORM --- */
  formContainer: {
    gap: 11,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B0F14",
    marginBottom: 1,
  },

  input: {
    width: "100%",
    minHeight: 46,
    backgroundColor: "#F5F7FA",
    borderRadius: 11,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#0B0F14",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  textArea: {
    height: 82,
    textAlignVertical: "top",
    paddingTop: 12,
  },

  /* --- PASSWORD FIELD --- */
  passwordContainer: {
    width: "100%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  passwordInput: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0B0F14",
  },

  eyeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },

  /* --- IMAGE PICKER --- */
  imagePicker: {
    width: "100%",
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9EF",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FF6B35",
    borderStyle: "dashed",
    marginBottom: 3,
  },

  imagePickerText: {
    color: "#0B0F14",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },

  previewImage: {
    width: "100%",
    height: Platform.OS === "web" ? 180 : 160,
    borderRadius: 12,
    marginVertical: 7,
    resizeMode: "cover",
  },

  /* --- REGISTER BUTTON --- */
  registerButton: {
    alignSelf: "center",
    width: Platform.OS === "web" ? 240 : "82%",
    maxWidth: 280,
    minHeight: 44,
    backgroundColor: "#FF6B35",
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },

  /* --- LOGIN LINK --- */
  linkContainer: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },

  linkText: {
    color: "#FF6B35",
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },

  bottomSpace: {
    height: 20,
  },
});
