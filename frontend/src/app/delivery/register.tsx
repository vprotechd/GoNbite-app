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
import * as ImagePicker from "expo-image-picker";
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

  // =================================================
  // PICK AADHAAR DOCUMENT
  // =================================================

  const pickAadhaar = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access to upload your Aadhaar document."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (!result.canceled) {
      setAadhaarDocument(result.assets[0]);
    }
  };

  // =================================================
  // PICK DRIVING LICENCE
  // =================================================

  const pickDrivingLicense = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow photo library access to upload your driving licence."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (!result.canceled) {
      setDrivingLicenseDocument(result.assets[0]);
    }
  };

  // =================================================
  // TAKE LIVE PHOTO
  // =================================================

  const takeLivePhoto = async () => {
    const permission =
      await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Camera Permission Required",
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

    if (!result.canceled) {
      setLivePhoto(result.assets[0]);
    }
  };

  // =================================================
  // REGISTER
  // =================================================

  const handleRegister = async () => {
    // -----------------------------------------------
    // BASIC VALIDATION
    // -----------------------------------------------

    if (
      !form.name ||
      !form.email ||
      !form.phone ||
      !form.password ||
      !form.confirmPassword
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields."
      );
      return;
    }

    // -----------------------------------------------
    // PASSWORD VALIDATION
    // -----------------------------------------------

    if (form.password !== form.confirmPassword) {
      Alert.alert(
        "Error",
        "Passwords do not match."
      );
      return;
    }

    // -----------------------------------------------
    // AADHAAR VALIDATION
    // -----------------------------------------------

    if (!aadhaarDocument) {
      Alert.alert(
        "Aadhaar Required",
        "Please upload your Aadhaar document."
      );
      return;
    }

    // -----------------------------------------------
    // BIKE / SCOOTER -> DRIVING LICENCE
    // -----------------------------------------------

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

    // -----------------------------------------------
    // BICYCLE -> LIVE PHOTO
    // -----------------------------------------------

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
      // =================================================
      // FORM DATA
      // =================================================

      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("password", form.password);
      formData.append(
        "vehicleType",
        form.vehicleType
      );

      // =================================================
      // AADHAAR
      // =================================================

      if (aadhaarDocument) {
        const uri = aadhaarDocument.uri;

        const fileName =
          aadhaarDocument.fileName ||
          `aadhaar_${Date.now()}.jpg`;

        const mimeType =
          aadhaarDocument.mimeType ||
          "image/jpeg";

        formData.append("aadhaarDocument", {
          uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      // =================================================
      // DRIVING LICENCE
      // =================================================

      if (drivingLicenseDocument) {
        const uri =
          drivingLicenseDocument.uri;

        const fileName =
          drivingLicenseDocument.fileName ||
          `driving_license_${Date.now()}.jpg`;

        const mimeType =
          drivingLicenseDocument.mimeType ||
          "image/jpeg";

        formData.append(
          "drivingLicenseDocument",
          {
            uri,
            name: fileName,
            type: mimeType,
          } as any
        );
      }

      // =================================================
      // LIVE PHOTO
      // =================================================

      if (livePhoto) {
        const uri = livePhoto.uri;

        const fileName =
          livePhoto.fileName ||
          `live_photo_${Date.now()}.jpg`;

        const mimeType =
          livePhoto.mimeType ||
          "image/jpeg";

        formData.append("livePhoto", {
          uri,
          name: fileName,
          type: mimeType,
        } as any);
      }

      // =================================================
      // SEND TO BACKEND
      // =================================================

      await api.post(
        "/delivery/register",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      Alert.alert(
        "Registration Sent!",
        "Your account has been created. Please wait for Admin approval.",
        [
          {
            text: "OK",
            onPress: () =>
              router.replace("/delivery/login"),
          },
        ]
      );
    } catch (error: any) {
      console.error(
        "DELIVERY REGISTRATION ERROR:",
        error.response?.data || error
      );

      Alert.alert(
        "Registration Failed",
        error.response?.data?.error ||
          "Something went wrong."
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
            : "height"
        }
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* =================================================
              HEADER
          ================================================= */}

          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Partner with SNAX
            </Text>

            <View style={{ width: 24 }} />
          </View>

          {/* =================================================
              FORM
          ================================================= */}

          <View style={styles.formContainer}>

            {/* NAME */}

            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              style={styles.input}
              placeholder="John Doe"
              value={form.name}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  name: text,
                })
              }
            />

            {/* EMAIL */}

            <Text style={styles.label}>
              Email Address
            </Text>

            <TextInput
              style={styles.input}
              placeholder="partner@email.com"
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

            {/* PHONE */}

            <Text style={styles.label}>
              Phone Number
            </Text>

            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  phone: text,
                })
              }
            />

            {/* =================================================
                VEHICLE TYPE
            ================================================= */}

            <Text style={styles.label}>
              Vehicle Type
            </Text>

            <View style={styles.vehicleRow}>
              {[
                "Bike",
                "Scooter",
                "Bicycle",
              ].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.vehicleBtn,
                    form.vehicleType === type &&
                      styles.vehicleBtnActive,
                  ]}
                  onPress={() => {
                    setForm({
                      ...form,
                      vehicleType: type,
                    });

                    // Clear vehicle-specific
                    // document when changing vehicle
                    setDrivingLicenseDocument(
                      null
                    );
                    setLivePhoto(null);
                  }}
                >
                  <Ionicons
                    name={
                      type === "Bicycle"
                        ? "bicycle"
                        : type === "Scooter"
                        ? "speedometer-outline"
                        : "bicycle-outline"
                    }
                    size={20}
                    color={
                      form.vehicleType === type
                        ? "#0B0F14"
                        : "#64748B"
                    }
                  />

                  <Text
                    style={[
                      styles.vehicleText,
                      form.vehicleType === type &&
                        styles.vehicleTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* =================================================
                DOCUMENT VERIFICATION
            ================================================= */}

            <View style={styles.verificationBox}>

              <View style={styles.verificationHeader}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={24}
                  color="#F5B82E"
                />

                <View style={styles.verificationHeaderText}>
                  <Text style={styles.verificationTitle}>
                    Verification Documents
                  </Text>

                  <Text style={styles.verificationSubtitle}>
                    Required for Admin approval
                  </Text>
                </View>
              </View>

              {/* =================================================
                  AADHAAR
              ================================================= */}

              <Text style={styles.documentLabel}>
                Aadhaar Card
                <Text style={styles.requiredText}>
                  {" "}*
                </Text>
              </Text>

              <TouchableOpacity
                style={[
                  styles.documentButton,
                  aadhaarDocument &&
                    styles.documentButtonSelected,
                ]}
                onPress={pickAadhaar}
              >
                <Ionicons
                  name={
                    aadhaarDocument
                      ? "checkmark-circle"
                      : "cloud-upload-outline"
                  }
                  size={24}
                  color={
                    aadhaarDocument
                      ? "#4CAF50"
                      : "#64748B"
                  }
                />

                <View style={styles.documentButtonContent}>
                  <Text
                    style={
                      styles.documentButtonTitle
                    }
                  >
                    {aadhaarDocument
                      ? "Aadhaar Uploaded"
                      : "Upload Aadhaar"}
                  </Text>

                  <Text
                    style={
                      styles.documentButtonSubtitle
                    }
                  >
                    {aadhaarDocument
                      ? "Tap to change document"
                      : "Select a clear photo"}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>

              {/* =================================================
                  BIKE / SCOOTER -> DRIVING LICENCE
              ================================================= */}

              {(form.vehicleType === "Bike" ||
                form.vehicleType === "Scooter") && (
                <>
                  <Text style={styles.documentLabel}>
                    Driving Licence
                    <Text style={styles.requiredText}>
                      {" "}*
                    </Text>
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.documentButton,
                      drivingLicenseDocument &&
                        styles.documentButtonSelected,
                    ]}
                    onPress={
                      pickDrivingLicense
                    }
                  >
                    <Ionicons
                      name={
                        drivingLicenseDocument
                          ? "checkmark-circle"
                          : "document-text-outline"
                      }
                      size={24}
                      color={
                        drivingLicenseDocument
                          ? "#4CAF50"
                          : "#64748B"
                      }
                    />

                    <View
                      style={
                        styles.documentButtonContent
                      }
                    >
                      <Text
                        style={
                          styles.documentButtonTitle
                        }
                      >
                        {drivingLicenseDocument
                          ? "Driving Licence Uploaded"
                          : "Upload Driving Licence"}
                      </Text>

                      <Text
                        style={
                          styles.documentButtonSubtitle
                        }
                      >
                        {drivingLicenseDocument
                          ? "Tap to change document"
                          : "Select a clear photo"}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* =================================================
                  BICYCLE -> LIVE PHOTO
              ================================================= */}

              {form.vehicleType ===
                "Bicycle" && (
                <>
                  <Text style={styles.documentLabel}>
                    Live Photo
                    <Text style={styles.requiredText}>
                      {" "}*
                    </Text>
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.documentButton,
                      livePhoto &&
                        styles.documentButtonSelected,
                    ]}
                    onPress={takeLivePhoto}
                  >
                    <Ionicons
                      name={
                        livePhoto
                          ? "checkmark-circle"
                          : "camera-outline"
                      }
                      size={24}
                      color={
                        livePhoto
                          ? "#4CAF50"
                          : "#64748B"
                      }
                    />

                    <View
                      style={
                        styles.documentButtonContent
                      }
                    >
                      <Text
                        style={
                          styles.documentButtonTitle
                        }
                      >
                        {livePhoto
                          ? "Live Photo Captured"
                          : "Take Live Photo"}
                      </Text>

                      <Text
                        style={
                          styles.documentButtonSubtitle
                        }
                      >
                        {livePhoto
                          ? "Tap to retake photo"
                          : "Use your front camera"}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#94A3B8"
                    />
                  </TouchableOpacity>
                </>
              )}

            </View>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <Text style={styles.label}>
              Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Create a password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  password: text,
                })
              }
            />

            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <Text style={styles.label}>
              Confirm Password
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(text) =>
                setForm({
                  ...form,
                  confirmPassword: text,
                })
              }
            />

            {/* =================================================
                REGISTER BUTTON
            ================================================= */}

            <TouchableOpacity
              style={[
                styles.registerButton,
                loading &&
                  styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator
                  color="#0B0F14"
                />
              ) : (
                <Text
                  style={
                    styles.registerButtonText
                  }
                >
                  Register as Delivery Partner
                </Text>
              )}
            </TouchableOpacity>

            {/* =================================================
                LOGIN LINK
            ================================================= */}

            <TouchableOpacity
              onPress={() =>
                router.push("/delivery/login")
              }
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
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },

  // =================================================
  // HEADER
  // =================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backButton: {
    padding: 6,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // =================================================
  // FORM
  // =================================================

  formContainer: {
    gap: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B0F14",
    marginBottom: 4,
  },

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

  // =================================================
  // VEHICLE
  // =================================================

  vehicleRow: {
    flexDirection: "row",
    gap: 10,
    marginVertical: 6,
  },

  vehicleBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    gap: 5,
  },

  vehicleBtnActive: {
    backgroundColor: "#F5B82E",
    borderColor: "#F5B82E",
  },

  vehicleText: {
    color: "#64748B",
    fontWeight: "600",
  },

  vehicleTextActive: {
    color: "#0B0F14",
  },

  // =================================================
  // VERIFICATION BOX
  // =================================================

  verificationBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    marginTop: 4,
    marginBottom: 4,
  },

  verificationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  verificationHeaderText: {
    marginLeft: 10,
    flex: 1,
  },

  verificationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B0F14",
  },

  verificationSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // =================================================
  // DOCUMENT
  // =================================================

  documentLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0B0F14",
    marginBottom: 6,
  },

  requiredText: {
    color: "#FF5252",
  },

  documentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    padding: 12,
    marginBottom: 14,
  },

  documentButtonSelected: {
    borderColor: "#4CAF50",
    backgroundColor: "#F0FAF2",
  },

  documentButtonContent: {
    flex: 1,
    marginLeft: 10,
  },

  documentButtonTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0F14",
  },

  documentButtonSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  // =================================================
  // REGISTER
  // =================================================

  registerButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 17,
  },

  // =================================================
  // LOGIN
  // =================================================

  linkContainer: {
    marginTop: 16,
    alignItems: "center",
  },

  linkText: {
    color: "#F5B82E",
    fontWeight: "600",
  },
});