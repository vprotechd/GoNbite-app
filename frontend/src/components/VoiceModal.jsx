import { Ionicons } from "@expo/vector-icons";
import {
  AudioModule,
  RecordingPresets,
  useAudioRecorder,
} from "expo-audio";
import * as Speech from "expo-speech";
import { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function VoiceModal({
  visible,
  onClose,
  onOrderFound,
}) {
  const recorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY
  );

  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    try {
      // Request microphone permission
      const { granted } =
        await AudioModule.requestRecordingPermissionsAsync();

      if (!granted) {
        Alert.alert(
          "Microphone Permission",
          "Please allow microphone access to use voice ordering."
        );
        return;
      }

      // Configure audio
      await AudioModule.setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Prepare recorder
      await recorder.prepareToRecordAsync();

      // Start recording
      recorder.record();

      setIsRecording(true);
      setTranscribedText("");

      Speech.speak(
        "Listening for your order. Please speak now."
      );
    } catch (error) {
      console.error(
        "Failed to start recording:",
        error
      );

      Alert.alert(
        "Recording Error",
        "Unable to start voice recording."
      );
    }
  };

  // =====================================================
  // STOP RECORDING
  // =====================================================

  const stopRecording = async () => {
    try {
      setIsRecording(false);

      // Stop recording
      await recorder.stop();

      const uri = recorder.uri;

      console.log(
        "Recording stopped. URI:",
        uri
      );

      // =================================================
      // TEMPORARY VOICE RECOGNITION
      // =================================================
      //
      // expo-audio records the audio but does NOT
      // automatically convert speech into text.
      //
      // For now we simulate the recognized order.
      //

      const mockOrder =
        "I want to order a pizza";

      setTranscribedText(mockOrder);

      // Send result to parent
      if (onOrderFound) {
        onOrderFound(mockOrder);
      }

      Speech.speak(
        "Your voice order has been received."
      );

      Alert.alert(
        "Voice Order Received",
        `We heard: "${mockOrder}"`
      );

      // Close after 1.5 seconds
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error(
        "Failed to stop recording:",
        error
      );

      setIsRecording(false);

      Alert.alert(
        "Recording Error",
        "Unable to stop the recording."
      );
    }
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setTranscribedText("");
    onClose();
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>

          {/* TITLE */}

          <View style={styles.titleIcon}>
            <Ionicons
              name="mic"
              size={22}
              color="#081A33"
            />
          </View>

          <Text style={styles.modalTitle}>
            Voice Order
          </Text>

          <Text style={styles.modalSubtitle}>
            Tap the mic and speak your order naturally.
          </Text>

          {/* MICROPHONE BUTTON */}

          <View style={styles.micContainer}>

            {isRecording && (
              <View style={styles.pulseRingOuter}>
                <View style={styles.pulseRingMiddle}>
                  <View style={styles.pulseRingInner} />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.micButton,
                isRecording &&
                  styles.micButtonRecording,
              ]}
              onPress={
                isRecording
                  ? stopRecording
                  : startRecording
              }
              activeOpacity={0.85}
            >
              <Ionicons
                name={
                  isRecording
                    ? "stop"
                    : "mic"
                }
                size={38}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>

          {/* RECORDING STATUS */}

          <Text style={styles.statusText}>
            {isRecording
              ? "Listening..."
              : "Tap to speak"}
          </Text>

          {/* TRANSCRIBED TEXT */}

          {transcribedText ? (
            <View style={styles.transcriptionBox}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color="#F5B82E"
              />

              <Text
                style={styles.transcribedText}
              >
                "{transcribedText}"
              </Text>
            </View>
          ) : null}

          {/* CLOSE BUTTON */}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>
              Close
            </Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
  },

  // ===================================================
  // TITLE
  // ===================================================

  titleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B0F14",
  },

  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 30,
    lineHeight: 19,
  },

  // ===================================================
  // MICROPHONE
  // ===================================================

  micContainer: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },

  micButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
  },

  micButtonRecording: {
    backgroundColor: "#FF5252",
  },

  // ===================================================
  // PULSE
  // ===================================================

  pulseRingOuter: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 2,
    borderColor: "#FF5252",
    opacity: 0.25,
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRingMiddle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: "#FF5252",
    opacity: 0.45,
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRingInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 2,
    borderColor: "#FF5252",
    opacity: 0.7,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    marginTop: 4,
    marginBottom: 15,
  },

  // ===================================================
  // TRANSCRIPTION
  // ===================================================

  transcriptionBox: {
    width: "100%",
    backgroundColor: "#FFFCF5",
    borderWidth: 1,
    borderColor: "#F5B82E",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 15,
  },

  transcribedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#0B0F14",
    fontStyle: "italic",
  },

  // ===================================================
  // CLOSE
  // ===================================================

  closeButton: {
    width: "100%",
    height: 44,
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  closeButtonText: {
    color: "#64748B",
    fontWeight: "700",
    fontSize: 14,
  },
});