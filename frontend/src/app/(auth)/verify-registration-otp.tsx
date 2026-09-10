import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import api from "../../services/api";

export default function VerifyRegistrationOTP() {
  const params = useLocalSearchParams<{
    email?: string;
  }>();

  const email = params.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const showErrorToast = (message: string) => {
    Toast.show({
      type: "error",
      text1: message,
      position: "top",
      visibilityTime: 3000,
      topOffset: 50,
    });
  };

  const showSuccessToast = (message: string) => {
    Toast.show({
      type: "success",
      text1: message,
      position: "top",
      visibilityTime: 2000,
      topOffset: 50,
    });
  };

  const handleVerify = async () => {
    if (!otp.trim()) {
      showErrorToast("Please enter the OTP.");
      return;
    }

    if (otp.length !== 6) {
      showErrorToast("OTP must be 6 digits.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post(
        "/auth/verify-registration-otp",
        {
          email,
          otp: otp.trim(),
        }
      );

      const { token, user } = response.data;

      await AsyncStorage.setItem(
        "token",
        token
      );

      await AsyncStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      showSuccessToast(
        "Email verified successfully!"
      );

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 1200);

    } catch (error: any) {
      console.log(
        "OTP verification error:",
        error?.response?.data ||
          error?.message
      );

      const message =
        error?.response?.data?.message ||
        "Invalid or expired OTP.";

      showErrorToast(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <Text style={styles.icon}>
          ✉️
        </Text>

        <Text style={styles.title}>
          Verify Your Email
        </Text>

        <Text style={styles.subtitle}>
          We have sent a 6-digit OTP to
        </Text>

        <Text style={styles.email}>
          {email}
        </Text>

        <TextInput
          style={styles.otpInput}
          placeholder="Enter OTP"
          placeholderTextColor="#64748B"
          value={otp}
          onChangeText={(text) =>
            setOtp(
              text.replace(/[^0-9]/g, "")
            )
          }
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[
            styles.verifyButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={handleVerify}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator
              color="#0B0F14"
            />
          ) : (
            <Text
              style={styles.buttonText}
            >
              Verify OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
        >
          <Text style={styles.backText}>
            Back to Registration
          </Text>
        </TouchableOpacity>

      </View>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  icon: {
    fontSize: 50,
    marginBottom: 20,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
  },

  subtitle: {
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
  },

  email: {
    color: "#F5B82E",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5,
    marginBottom: 30,
  },

  otpInput: {
    width: "100%",
    maxWidth: 350,
    height: 55,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 8,
    color: "#0B0F14",
    marginBottom: 18,
  },

  verifyButton: {
    width: "100%",
    maxWidth: 350,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#F5B82E",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: "#0B0F14",
    fontSize: 16,
    fontWeight: "700",
  },

  backButton: {
    marginTop: 20,
  },

  backText: {
    color: "#F5B82E",
    fontSize: 14,
    fontWeight: "600",
  },
});