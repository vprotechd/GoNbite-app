import { Ionicons } from "@expo/vector-icons";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { useEffect, useState } from "react";
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
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // =====================================================
  // SPEECH RECOGNITION RESULT
  // =====================================================

 useSpeechRecognitionEvent("result", (event) => {
  const transcript =
    event.results?.[0]?.transcript || "";

  console.log("🎤 Transcript:", transcript);
  console.log("🎤 Is final:", event.isFinal);

  if (event.isFinal && transcript.trim()) {
  const query = transcript
    .trim()
    .replace(/[.,!?;:]+/g, "")
    .trim();

  console.log("🎤 FINAL VOICE SEARCH:", query);

  setTranscribedText(query);
  setIsRecording(false);
  setIsProcessing(false);

  if (onOrderFound) {
    onOrderFound(query);
  }
}
});

  // =====================================================
  // SPEECH RECOGNITION END
  // =====================================================

  useSpeechRecognitionEvent("end", () => {
    console.log("🎤 Speech recognition ended");

    setIsRecording(false);
  });

  // =====================================================
  // SPEECH RECOGNITION ERROR
  // =====================================================

  useSpeechRecognitionEvent("error", (event) => {
    console.error(
      "Speech recognition error:",
      event.error,
      event.message
    );useSpeechRecognitionEvent("error", (event) => {
  if (event.error === "aborted") {
    console.log("🎤 Speech recognition stopped.");
    setIsRecording(false);
    return;
  }

  console.error(
    "Speech recognition error:",
    event.error,
    event.message
  );

  setIsRecording(false);

  Alert.alert(
    "Voice Recognition Error",
    event.message ||
      "Unable to recognize your voice."
  );
});

    setIsRecording(false);

    if (event.error !== "aborted") {
      Alert.alert(
        "Voice Recognition Error",
        event.message ||
          "Unable to recognize your voice."
      );
    }
  });

  // =====================================================
  // CLEANUP
  // =====================================================

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  // =====================================================
  // START LISTENING
  // =====================================================

  const startRecording = async () => {
    try {
      setTranscribedText("");

      // Request microphone permission
      const microphonePermission =
        await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!microphonePermission.granted) {
        Alert.alert(
          "Microphone Permission",
          "Please allow microphone access to use voice ordering."
        );
        return;
      }

      // Start speech recognition
      ExpoSpeechRecognitionModule.start({
  lang: "en-IN",
  interimResults: true,
  continuous: false,
  maxAlternatives: 1,
});

      setIsRecording(true);

      // Speech.speak(
      //   "Listening. Please tell me what you would like to order."
      // );
    } catch (error) {
      console.error(
        "Failed to start voice recognition:",
        error
      );

      setIsRecording(false);

      Alert.alert(
        "Voice Recognition Error",
        "Unable to start voice recognition."
      );
    }
  };

  // =====================================================
  // STOP LISTENING
  // =====================================================

  const stopRecording = () => {
  try {
    setIsRecording(false);

    ExpoSpeechRecognitionModule.stop();

    console.log("🛑 Stopping speech recognition...");
  } catch (error) {
    console.error(
      "Failed to stop voice recognition:",
      error
    );

    setIsRecording(false);
    setIsProcessing(false);

    Alert.alert(
      "Voice Recognition Error",
      "Unable to stop voice recognition."
    );
  }
};
  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const handleClose = () => {
    if (isRecording) {
      ExpoSpeechRecognitionModule.abort();
      setIsRecording(false);
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

          {/* MICROPHONE */}

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

          {/* STATUS */}

         <Text style={styles.statusText}>
  {isRecording
    ? "Listening..."
    : isProcessing
    ? "Processing your order..."
    : transcribedText
    ? "Order captured"
    : "Tap to speak"}
</Text>

          {/* TRANSCRIPTION */}

          {transcribedText ? (
            <View style={styles.transcriptionBox}>
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color="#F5B82E"
              />

              <Text style={styles.transcribedText}>
                "{transcribedText}"
              </Text>
            </View>
          ) : null}

          {/* CLOSE */}

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
  },

  micContainer: {
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  pulseRingOuter: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(245,184,46,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRingMiddle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(245,184,46,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  pulseRingInner: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "rgba(245,184,46,0.35)",
  },

  micButton: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
  },

  micButtonRecording: {
    backgroundColor: "#E53935",
  },

  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 16,
  },

  transcriptionBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF8E1",
    padding: 14,
    borderRadius: 12,
    marginBottom: 18,
  },

  transcribedText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },

  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
    backgroundColor: "#081A33",
  },

  closeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});