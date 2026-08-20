import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(
        "Missing Information",
        "Please fill in all password fields."
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        "Invalid Password",
        "New password must contain at least 6 characters."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "New password and confirm password do not match."
      );
      return;
    }

    Alert.alert(
      "Password Updated",
      "Your password has been changed successfully.",
      [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]
    );

    // Connect your change-password API here.
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#081A33"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Change Password
          </Text>

          <View style={styles.headerSpacer} />

        </View>

        {/* CONTENT */}

        <View style={styles.content}>

          <View style={styles.infoBox}>

            <View style={styles.infoIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={21}
                color="#F5B82E"
              />
            </View>

            <View style={styles.infoText}>
              <Text style={styles.infoTitle}>
                Keep your account secure
              </Text>

              <Text style={styles.infoSubtitle}>
                Use a strong password that you don't use elsewhere.
              </Text>
            </View>

          </View>

          {/* CURRENT PASSWORD */}

          <Text style={styles.label}>
            Current Password
          </Text>

          <PasswordInput
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            visible={showCurrent}
            setVisible={setShowCurrent}
          />

          {/* NEW PASSWORD */}

          <Text style={styles.label}>
            New Password
          </Text>

          <PasswordInput
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            visible={showNew}
            setVisible={setShowNew}
          />

          {/* CONFIRM PASSWORD */}

          <Text style={styles.label}>
            Confirm New Password
          </Text>

          <PasswordInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            visible={showConfirm}
            setVisible={setShowConfirm}
          />

          <Text style={styles.requirement}>
            Password must contain at least 6 characters.
          </Text>

          {/* BUTTON */}

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>
              Change Password
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </SafeAreaView>
  );
}

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  visible,
  setVisible,
}) {
  return (
    <View style={styles.inputContainer}>

      <Ionicons
        name="lock-closed-outline"
        size={18}
        color="#64748B"
      />

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={!visible}
        autoCapitalize="none"
      />

      <TouchableOpacity
        onPress={() => setVisible(!visible)}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={19}
          color="#64748B"
        />
      </TouchableOpacity>

    </View>
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
    fontSize: 17,
    fontWeight: "800",
    color: "#081A33",
  },

  headerSpacer: {
    width: 30,
  },

  content: {
    padding: 12,
  },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    padding: 11,
    marginBottom: 20,
  },

  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  infoText: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#081A33",
  },

  infoSubtitle: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 14,
  },

  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#081A33",
    marginBottom: 6,
    marginLeft: 2,
  },

  inputContainer: {
    height: 47,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  input: {
    flex: 1,
    fontSize: 11,
    color: "#081A33",
    marginHorizontal: 9,
  },

  requirement: {
    fontSize: 9,
    color: "#64748B",
    marginTop: -4,
    marginBottom: 20,
  },

  button: {
    height: 46,
    backgroundColor: "#081A33",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },
});