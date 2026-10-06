import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
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

  const [aadhaarDocument, setAadhaarDocument] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [drivingLicenseDocument, setDrivingLicenseDocument] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [livePhoto, setLivePhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [loading, setLoading] = useState(false);

  // =========================================================
  // PICK AADHAAR
  // =========================================================

  const pickAadhaar = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access to upload your Aadhaar document."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        console.log("📄 AADHAAR SELECTED:", {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
        });

        setAadhaarDocument(asset);
      }
    } catch (error) {
      console.error("AADHAAR PICK ERROR:", error);

      Alert.alert(
        "Error",
        "Unable to select Aadhaar document."
      );
    }
  };

  // =========================================================
  // PICK DRIVING LICENCE
  // =========================================================

  const pickDrivingLicense = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow gallery access to upload your driving licence."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          quality: 0.8,
        });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        console.log("📄 DRIVING LICENCE SELECTED:", {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
        });

        setDrivingLicenseDocument(asset);
      }
    } catch (error) {
      console.error(
        "DRIVING LICENCE PICK ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to select driving licence."
      );
    }
  };

  // =========================================================
  // TAKE LIVE PHOTO
  // =========================================================

  const takeLivePhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take your live photo."
        );
        return;
      }

      const result =
        await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          quality: 0.8,
          cameraType: ImagePicker.CameraType.front,
        });

      if (!result.canceled && result.assets?.length > 0) {
        const asset = result.assets[0];

        console.log("📸 LIVE PHOTO CAPTURED:", {
          uri: asset.uri,
          fileName: asset.fileName,
          mimeType: asset.mimeType,
          width: asset.width,
          height: asset.height,
        });

        setLivePhoto(asset);
      }
    } catch (error) {
      console.error(
        "LIVE PHOTO ERROR:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to take live photo."
      );
    }
  };

  // =========================================================
  // REGISTER
  // =========================================================

  const handleRegister = async () => {
    // -------------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------------

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password ||
      !form.confirmPassword
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields."
      );
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert(
        "Error",
        "Passwords do not match."
      );
      return;
    }

    // -------------------------------------------------------
    // AADHAAR VALIDATION
    // -------------------------------------------------------

    if (!aadhaarDocument) {
      Alert.alert(
        "Aadhaar Required",
        "Please upload your Aadhaar document."
      );
      return;
    }

    // -------------------------------------------------------
    // DRIVING LICENCE VALIDATION
    // -------------------------------------------------------

    if (
      (form.vehicleType === "Bike" ||
        form.vehicleType === "Scooter") &&
      !drivingLicenseDocument
    ) {
      Alert.alert(
        "Driving Licence Required",
        "A driving licence is required for Bike and Scooter delivery."
      );
      return;
    }

    // -------------------------------------------------------
    // LIVE PHOTO VALIDATION
    // -------------------------------------------------------

    if (
      form.vehicleType === "Bicycle" &&
      !livePhoto
    ) {
      Alert.alert(
        "Live Photo Required",
        "Please take a live photo using your camera."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // -----------------------------------------------------
      // TEXT FIELDS
      // -----------------------------------------------------

      formData.append(
        "name",
        form.name.trim()
      );

      formData.append(
        "email",
        form.email.trim()
      );

      formData.append(
        "phone",
        form.phone.trim()
      );

      formData.append(
        "password",
        form.password
      );

      formData.append(
        "vehicleType",
        form.vehicleType
      );

      // -----------------------------------------------------
      // CROSS PLATFORM FILE UPLOAD HELPER
      // -----------------------------------------------------

      const appendFile = async (
        fieldName: string,
        asset: ImagePicker.ImagePickerAsset | null,
        defaultName: string
      ) => {
        if (!asset) {
          return;
        }

        const fileName =
          asset.fileName ||
          `${defaultName}_${Date.now()}.jpg`;

        const mimeType =
          asset.mimeType ||
          "image/jpeg";

        // ===================================================
        // WEB
        // ===================================================

        if (Platform.OS === "web") {
          console.log(
            `🌐 Preparing WEB file: ${fieldName}`
          );

          const response = await fetch(
            asset.uri
          );

          if (!response.ok) {
            throw new Error(
              `Unable to read ${fieldName} image.`
            );
          }

          const blob =
            await response.blob();

          const file =
            new File(
              [blob],
              fileName,
              {
                type: mimeType,
              }
            );

          formData.append(
            fieldName,
            file
          );

          console.log(
            `✅ WEB FILE ADDED: ${fieldName}`,
            {
              name: file.name,
              type: file.type,
              size: file.size,
            }
          );

          return;
        }

        // ===================================================
        // ANDROID / IOS
        // ===================================================

        console.log(
          `📱 Preparing MOBILE file: ${fieldName}`
        );

        formData.append(
          fieldName,
          {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
          } as any
        );

        console.log(
          `✅ MOBILE FILE ADDED: ${fieldName}`,
          {
            uri: asset.uri,
            name: fileName,
            type: mimeType,
          }
        );
      };

      // -----------------------------------------------------
      // APPEND AADHAAR
      // -----------------------------------------------------

      await appendFile(
        "aadhaarDocument",
        aadhaarDocument,
        "aadhaar"
      );

      // -----------------------------------------------------
      // APPEND DRIVING LICENCE
      // -----------------------------------------------------

      await appendFile(
        "drivingLicenseDocument",
        drivingLicenseDocument,
        "driving_license"
      );

      // -----------------------------------------------------
      // APPEND LIVE PHOTO
      // -----------------------------------------------------

      await appendFile(
        "livePhoto",
        livePhoto,
        "live_photo"
      );

      // -----------------------------------------------------
      // DEBUG LOGS
      // -----------------------------------------------------

      console.log(
        "===================================="
      );

      console.log(
        "🚀 DELIVERY REGISTRATION"
      );

      console.log(
        "📱 PLATFORM:",
        Platform.OS
      );

      console.log(
        "👤 NAME:",
        form.name.trim()
      );

      console.log(
        "📧 EMAIL:",
        form.email.trim()
      );

      console.log(
        "📞 PHONE:",
        form.phone.trim()
      );

      console.log(
        "🛵 VEHICLE:",
        form.vehicleType
      );

      console.log(
        "📎 Aadhaar:",
        !!aadhaarDocument
      );

      console.log(
        "📎 Driving Licence:",
        !!drivingLicenseDocument
      );

      console.log(
        "📎 Live Photo:",
        !!livePhoto
      );

      console.log(
        "===================================="
      );

      // -----------------------------------------------------
      // SEND REQUEST
      // IMPORTANT:
      // DO NOT MANUALLY SET Content-Type.
      // Axios will create the multipart boundary.
      // -----------------------------------------------------

      await api.post(
        "/delivery/register",
        formData
      );

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------

      Alert.alert(
        "Registration Sent!",
        "Your account has been created. Please wait for Admin approval.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace(
                "/delivery/login"
              ),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "❌ DELIVERY REGISTRATION ERROR:",
        error?.response?.data || error
      );

      Alert.alert(
        "Registration Failed",
        error?.response?.data?.error ||
          error?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#111827"
              />
            </TouchableOpacity>

            <View>
              <Text style={styles.title}>
                Delivery Partner
              </Text>

              <Text style={styles.subtitle}>
                Create your account
              </Text>
            </View>
          </View>

          {/* NAME */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Full Name
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={20}
                color="#6B7280"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#9CA3AF"
                value={form.name}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    name: text,
                  })
                }
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* EMAIL */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Email
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#6B7280"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={form.email}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    email: text,
                  })
                }
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* PHONE */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Phone Number
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="call-outline"
                size={20}
                color="#6B7280"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter phone number"
                placeholderTextColor="#9CA3AF"
                value={form.phone}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    phone: text,
                  })
                }
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* PASSWORD */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Password
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6B7280"
              />

              <TextInput
                style={styles.input}
                placeholder="Enter password"
                placeholderTextColor="#9CA3AF"
                value={form.password}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    password: text,
                  })
                }
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* CONFIRM PASSWORD */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Confirm Password
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#6B7280"
              />

              <TextInput
                style={styles.input}
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
                value={form.confirmPassword}
                onChangeText={(text) =>
                  setForm({
                    ...form,
                    confirmPassword: text,
                  })
                }
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* VEHICLE TYPE */}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              Vehicle Type
            </Text>

            <View style={styles.vehicleContainer}>
              {[
                "Bike",
                "Scooter",
                "Bicycle",
              ].map((vehicle) => (
                <TouchableOpacity
                  key={vehicle}
                  style={[
                    styles.vehicleButton,
                    form.vehicleType === vehicle &&
                      styles.vehicleButtonActive,
                  ]}
                  onPress={() =>
                    setForm({
                      ...form,
                      vehicleType: vehicle,
                    })
                  }
                >
                  <Ionicons
                    name={
                      vehicle === "Bicycle"
                        ? "bicycle-outline"
                        : "bicycle"
                    }
                    size={22}
                    color={
                      form.vehicleType === vehicle
                        ? "#FFFFFF"
                        : "#374151"
                    }
                  />

                  <Text
                    style={[
                      styles.vehicleText,
                      form.vehicleType ===
                        vehicle &&
                        styles.vehicleTextActive,
                    ]}
                  >
                    {vehicle}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* DOCUMENTS */}

          <View style={styles.documentsSection}>
            <Text style={styles.sectionTitle}>
              Required Documents
            </Text>

            {/* AADHAAR */}

            <View style={styles.documentCard}>
              <View style={styles.documentInfo}>
                <View style={styles.documentIcon}>
                  <Ionicons
                    name="card-outline"
                    size={25}
                    color="#EF2C1E"
                  />
                </View>

                <View style={styles.documentTextContainer}>
                  <Text
                    style={styles.documentTitle}
                  >
                    Aadhaar Card
                  </Text>

                  <Text
                    style={styles.documentSubtitle}
                  >
                    Required for all vehicles
                  </Text>

                  {aadhaarDocument && (
                    <Text
                      style={styles.selectedText}
                      numberOfLines={1}
                    >
                      ✓{" "}
                      {aadhaarDocument.fileName ||
                        "Aadhaar selected"}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickAadhaar}
              >
                <Ionicons
                  name={
                    aadhaarDocument
                      ? "checkmark"
                      : "cloud-upload-outline"
                  }
                  size={18}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.uploadButtonText}
                >
                  {aadhaarDocument
                    ? "Change"
                    : "Upload"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* DRIVING LICENCE */}

            {(form.vehicleType === "Bike" ||
              form.vehicleType === "Scooter") && (
              <View style={styles.documentCard}>
                <View style={styles.documentInfo}>
                  <View style={styles.documentIcon}>
                    <Ionicons
                      name="document-text-outline"
                      size={25}
                      color="#EF2C1E"
                    />
                  </View>

                  <View
                    style={
                      styles.documentTextContainer
                    }
                  >
                    <Text
                      style={styles.documentTitle}
                    >
                      Driving Licence
                    </Text>

                    <Text
                      style={styles.documentSubtitle}
                    >
                      Required for{" "}
                      {form.vehicleType}
                    </Text>

                    {drivingLicenseDocument && (
                      <Text
                        style={
                          styles.selectedText
                        }
                        numberOfLines={1}
                      >
                        ✓{" "}
                        {drivingLicenseDocument.fileName ||
                          "Driving licence selected"}
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={pickDrivingLicense}
                >
                  <Ionicons
                    name={
                      drivingLicenseDocument
                        ? "checkmark"
                        : "cloud-upload-outline"
                    }
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.uploadButtonText
                    }
                  >
                    {drivingLicenseDocument
                      ? "Change"
                      : "Upload"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LIVE PHOTO */}

            {form.vehicleType === "Bicycle" && (
              <View style={styles.documentCard}>
                <View style={styles.documentInfo}>
                  <View style={styles.documentIcon}>
                    <Ionicons
                      name="camera-outline"
                      size={25}
                      color="#EF2C1E"
                    />
                  </View>

                  <View
                    style={
                      styles.documentTextContainer
                    }
                  >
                    <Text
                      style={styles.documentTitle}
                    >
                      Live Photo
                    </Text>

                    <Text
                      style={styles.documentSubtitle}
                    >
                      Take a live photo using camera
                    </Text>

                    {livePhoto && (
                      <Text
                        style={
                          styles.selectedText
                        }
                        numberOfLines={1}
                      >
                        ✓ Live photo captured
                      </Text>
                    )}
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.uploadButton}
                  onPress={takeLivePhoto}
                >
                  <Ionicons
                    name={
                      livePhoto
                        ? "checkmark"
                        : "camera-outline"
                    }
                    size={18}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.uploadButtonText
                    }
                  >
                    {livePhoto
                      ? "Retake"
                      : "Camera"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* REGISTER BUTTON */}

          <TouchableOpacity
            style={[
              styles.registerButton,
              loading &&
                styles.registerButtonDisabled,
            ]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#FFFFFF"
              />
            ) : (
              <>
                <Text
                  style={styles.registerButtonText}
                >
                  Create Account
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </TouchableOpacity>

          {/* LOGIN */}

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account?
            </Text>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  "/delivery/login"
                )
              }
            >
              <Text
                style={styles.loginLink}
              >
                Login
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =============================================================
// STYLES
// =============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // -----------------------------------------------------------
  // HEADER
  // -----------------------------------------------------------

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },

  title: {
    fontSize: 25,
    fontWeight: "700",
    color: "#111827",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 3,
  },

  // -----------------------------------------------------------
  // INPUTS
  // -----------------------------------------------------------

  inputContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  inputWrapper: {
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    backgroundColor: "#FAFAFA",
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
    marginLeft: 10,
  },

  // -----------------------------------------------------------
  // VEHICLE
  // -----------------------------------------------------------

  vehicleContainer: {
    flexDirection: "row",
    gap: 10,
  },

  vehicleButton: {
    flex: 1,
    minHeight: 50,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 8,
  },

  vehicleButtonActive: {
    backgroundColor: "#EF2C1E",
    borderColor: "#EF2C1E",
  },

  vehicleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 5,
  },

  vehicleTextActive: {
    color: "#FFFFFF",
  },

  // -----------------------------------------------------------
  // DOCUMENTS
  // -----------------------------------------------------------

  documentsSection: {
    marginTop: 8,
    marginBottom: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },

  documentCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  documentInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },

  documentIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  documentTextContainer: {
    flex: 1,
  },

  documentTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },

  documentSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 3,
  },

  selectedText: {
    fontSize: 11,
    color: "#16A34A",
    fontWeight: "600",
    marginTop: 4,
  },

  uploadButton: {
    backgroundColor: "#EF2C1E",
    borderRadius: 9,
    minWidth: 82,
    height: 38,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 5,
  },

  // -----------------------------------------------------------
  // REGISTER
  // -----------------------------------------------------------

  registerButton: {
    height: 54,
    backgroundColor: "#EF2C1E",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  registerButtonDisabled: {
    opacity: 0.7,
  },

  registerButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
  },

  // -----------------------------------------------------------
  // LOGIN
  // -----------------------------------------------------------

  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 22,
  },

  loginText: {
    fontSize: 14,
    color: "#6B7280",
  },

  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: "#EF2C1E",
    marginLeft: 5,
  },
});
