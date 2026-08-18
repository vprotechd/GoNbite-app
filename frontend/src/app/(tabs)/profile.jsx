import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [userData, setUserData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [originalData, setOriginalData] = useState({});

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);

        const response = await api.get("/auth/profile");

        setUserData(response.data);
        setOriginalData(response.data);
      } catch (error) {
        console.error("Failed to load profile:", error);

        Alert.alert(
          "Error",
          "Failed to load your profile. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, []);

  // ============================================================
  // CHECK CHANGES
  // ============================================================

  const hasChanges = () => {
    return (
      userData.name !== originalData.name ||
      userData.phone !== originalData.phone ||
      userData.address !== originalData.address
    );
  };

  // ============================================================
  // SAVE PROFILE
  // ============================================================

  const handleSaveProfile = async () => {
    if (
      !userData.name.trim() ||
      !userData.phone.trim() ||
      !userData.address.trim()
    ) {
      Alert.alert(
        "Incomplete Details",
        "Please fill in all fields before saving.",
      );
      return;
    }

    setIsSaving(true);

    try {
      await api.put("/auth/profile", userData);

      setOriginalData(userData);

      Alert.alert(
        "Success",
        "Profile updated successfully!",
      );
    } catch (error) {
      console.error("Save error:", error);

      Alert.alert(
        "Error",
        "Failed to save profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // UPDATE FIELD
  // ============================================================

  const updateField = (field, value) => {
    setUserData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* ======================================================
            HEADER
        ======================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#081A33"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Profile
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* ======================================================
            KEYBOARD AVOIDING VIEW
        ======================================================= */}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardView}
        >

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >

            {/* ==================================================
                LOADING
            =================================================== */}

            {isLoading ? (
              <View style={styles.loadingState}>

                <ActivityIndicator
                  size="large"
                  color="#F5B82E"
                />

                <Text style={styles.loadingText}>
                  Loading profile...
                </Text>

              </View>
            ) : (
              <>

                {/* ==================================================
                    PROFILE INTRO
                =================================================== */}

                <View style={styles.profileIconArea}>

                  <View style={styles.avatarCircle}>
                    <Ionicons
                      name="person"
                      size={38}
                      color="#FFFFFF"
                    />
                  </View>

                  <Text style={styles.profileTitle}>
                    Delivery Details
                  </Text>

                  <Text style={styles.profileSubtitle}>
                    Update your contact and delivery information
                  </Text>

                </View>

                {/* ==================================================
                    FORM
                =================================================== */}

                <View style={styles.formContainer}>

                  {/* FULL NAME */}

                  <View style={styles.inputGroup}>

                    <Text style={styles.label}>
                      Full Name
                    </Text>

                    <View style={styles.inputWrapper}>

                      <Ionicons
                        name="person-outline"
                        size={17}
                        color="#8E9BAE"
                        style={styles.inputIcon}
                      />

                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your full name"
                        placeholderTextColor="#8E9BAE"
                        value={userData.name}
                        onChangeText={(text) =>
                          updateField("name", text)
                        }
                        returnKeyType="next"
                      />

                    </View>

                  </View>

                  {/* CONTACT NUMBER */}

                  <View style={styles.inputGroup}>

                    <Text style={styles.label}>
                      Contact Number
                    </Text>

                    <View style={styles.inputWrapper}>

                      <Ionicons
                        name="call-outline"
                        size={17}
                        color="#8E9BAE"
                        style={styles.inputIcon}
                      />

                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your phone number"
                        placeholderTextColor="#8E9BAE"
                        keyboardType="phone-pad"
                        value={userData.phone}
                        onChangeText={(text) =>
                          updateField("phone", text)
                        }
                      />

                    </View>

                  </View>

                  {/* DELIVERY ADDRESS */}

                  <View style={styles.inputGroup}>

                    <Text style={styles.label}>
                      Delivery Address
                    </Text>

                    <View
                      style={[
                        styles.inputWrapper,
                        styles.textAreaWrapper,
                      ]}
                    >

                      <Ionicons
                        name="location-outline"
                        size={17}
                        color="#8E9BAE"
                        style={styles.inputIcon}
                      />

                      <TextInput
                        style={[
                          styles.textInput,
                          styles.textArea,
                        ]}
                        placeholder="Street, Area, City, State, Pincode"
                        placeholderTextColor="#8E9BAE"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={userData.address}
                        onChangeText={(text) =>
                          updateField("address", text)
                        }
                      />

                    </View>

                  </View>

                  {/* ==================================================
                      SAVE BUTTON
                  =================================================== */}

                  <TouchableOpacity
                    style={[
                      styles.saveButton,
                      (!hasChanges() || isSaving) &&
                        styles.saveButtonDisabled,
                    ]}
                    disabled={!hasChanges() || isSaving}
                    onPress={handleSaveProfile}
                    activeOpacity={0.8}
                  >

                    {isSaving ? (
                      <View style={styles.savingContent}>

                        <ActivityIndicator
                          size="small"
                          color="#081A33"
                        />

                        <Text style={styles.saveButtonText}>
                          Saving...
                        </Text>

                      </View>
                    ) : (
                      <Text style={styles.saveButtonText}>
                        {hasChanges()
                          ? "Save Changes"
                          : "No Changes Made"}
                      </Text>
                    )}

                  </TouchableOpacity>

                </View>

              </>
            )}

            <View style={{ height: 25 }} />

          </ScrollView>

        </KeyboardAvoidingView>

      </View>
    </SafeAreaView>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({

  // ==============================================================
  // MAIN
  // ==============================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  keyboardView: {
    flex: 1,
  },

  // ==============================================================
  // HEADER
  // ==============================================================

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#081A33",
  },

  headerSpacer: {
    width: 30,
  },

  // ==============================================================
  // SCROLL
  // ==============================================================

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 20,
  },

  // ==============================================================
  // LOADING
  // ==============================================================

  loadingState: {
    alignItems: "center",
    marginTop: 65,
  },

  loadingText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
    marginTop: 9,
  },

  // ==============================================================
  // PROFILE INTRO
  // ==============================================================

  profileIconArea: {
    alignItems: "center",
    marginBottom: 20,
  },

  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#F5B82E",
    marginBottom: 9,
  },

  profileTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#081A33",
  },

  profileSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    textAlign: "center",
    paddingHorizontal: 25,
    lineHeight: 16,
  },

  // ==============================================================
  // FORM
  // ==============================================================

  formContainer: {
    width: "100%",
  },

  inputGroup: {
    marginBottom: 14,
  },

  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#081A33",
    marginBottom: 6,
    marginLeft: 2,
  },

  // ==============================================================
  // INPUT
  // ==============================================================

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    paddingHorizontal: 10,
    height: 44,

    shadowColor: "#081A33",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 2,

    elevation: 1,
  },

  textAreaWrapper: {
    height: 92,
    alignItems: "flex-start",
    paddingTop: 10,
  },

  inputIcon: {
    marginRight: 8,
    marginTop: 0,
  },

  textInput: {
    flex: 1,
    fontSize: 13,
    color: "#081A33",
    height: "100%",
    paddingVertical: 0,
  },

  textArea: {
    height: "100%",
    textAlignVertical: "top",
    paddingTop: 0,
    lineHeight: 18,
  },

  // ==============================================================
  // SAVE BUTTON
  // ==============================================================

  saveButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 10,
    height: 45,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  saveButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },

  savingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  saveButtonText: {
    color: "#081A33",
    fontWeight: "700",
    fontSize: 13,
  },
});