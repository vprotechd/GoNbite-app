import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Platform } from "react-native";

export default function FoodScanModal({
  visible,
  onClose,
  onFoodCaptured,
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const cameraRef = useRef(null);

  // ======================================================
  // TAKE PHOTO
  // ======================================================

  const takePhoto = async () => {
    try {
      if (!cameraRef.current) return;

      const result = await cameraRef.current.takePictureAsync({
        quality: 0.7,
      });

      if (result?.uri) {
        console.log("📸 Photo captured:", result.uri);
        setPhoto(result.uri);
      }
    } catch (error) {
      console.error("❌ Food photo error:", error);

      Alert.alert(
        "Error",
        "Could not capture the food image."
      );
    }
  };

  // ======================================================
  // RETAKE PHOTO
  // ======================================================

  const retakePhoto = () => {
    setPhoto(null);
  };

  // ======================================================
  // IDENTIFY FOOD
  // ======================================================

  const identifyFood = async () => {
    if (!photo || loading) return;

    try {
      setLoading(true);

      console.log("📸 Preparing food image...");

      const formData = new FormData();

      // ==================================================
      // WEB
      // ==================================================

      if (Platform.OS === "web") {
        console.log("🌐 Platform: Web");

        const imageResponse = await fetch(photo);

        if (!imageResponse.ok) {
          throw new Error("Could not read captured image.");
        }

        const blob = await imageResponse.blob();

        console.log("📦 Image blob created:", blob.size);

        formData.append(
          "image",
          blob,
          "food-photo.jpg"
        );
      }

      // ==================================================
      // ANDROID / IOS
      // ==================================================

      else {
        console.log("📱 Platform:", Platform.OS);

        formData.append("image", {
          uri: photo,
          type: "image/jpeg",
          name: "food-photo.jpg",
        });
      }

      console.log("🚀 Sending food image to backend...");

      // ==================================================
      // SEND REQUEST
      // ==================================================

      const response = await fetch(
        "http://192.168.1.17:5000/api/food-scan/identify",
        {
          method: "POST",
          body: formData,
        }
      );

      console.log(
        "📡 Backend response status:",
        response.status
      );

      // ==================================================
      // CHECK RESPONSE
      // ==================================================

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;

        try {
          const errorData = await response.json();

          errorMessage =
            errorData?.message ||
            errorMessage;
        } catch {
          // Ignore JSON parsing error
        }

        throw new Error(errorMessage);
      }

      // ==================================================
      // READ RESPONSE
      // ==================================================

      const data = await response.json();

      console.log(
        "🍔 FOOD IDENTIFICATION RESULT:",
        data
      );

      // ==================================================
      // SEND RESULT TO HOME SCREEN
      // ==================================================

      if (onFoodCaptured) {
        onFoodCaptured(data);
      }

    } catch (error) {
      console.error(
        "❌ Food identification error:",
        error
      );

      Alert.alert(
        "Food Scan Failed",
        error.message ||
          "Could not identify the food. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CLOSE
  // ======================================================

  const handleClose = () => {
    setPhoto(null);
    setLoading(false);
    onClose();
  };

  // ======================================================
  // CAMERA PERMISSION LOADING
  // ======================================================

  if (!permission) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
      >
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </Modal>
    );
  }

  // ======================================================
  // CAMERA PERMISSION DENIED
  // ======================================================

  if (!permission.granted) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
      >
        <View style={styles.permissionContainer}>

          <Ionicons
            name="camera-outline"
            size={50}
            color="#F5B82E"
          />

          <Text style={styles.permissionTitle}>
            Camera Permission Required
          </Text>

          <Text style={styles.permissionText}>
            Snax needs camera access to identify food
            from a photo.
          </Text>

          <TouchableOpacity
            onPress={requestPermission}
            style={styles.permissionBtn}
          >
            <Text style={styles.permissionBtnText}>
              Grant Permission
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClose}
            style={styles.cancelBtn}
          >
            <Text style={styles.cancelBtnText}>
              Cancel
            </Text>
          </TouchableOpacity>

        </View>
      </Modal>
    );
  }

  // ======================================================
  // MAIN MODAL
  // ======================================================

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>

          <TouchableOpacity
            onPress={handleClose}
          >
            <Ionicons
              name="close"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.title}>
            Scan Food
          </Text>

          <View style={{ width: 28 }} />

        </View>

        {/* ==================================================
            CAMERA / PREVIEW
        ================================================== */}

        <View style={styles.cameraContainer}>

          {!photo ? (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
            />
          ) : (
            <Image
              source={{ uri: photo }}
              style={styles.camera}
            />
          )}

          {!photo && (
            <View style={styles.scanFrame}>

              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />

              <Text style={styles.frameText}>
                Place the food inside the frame
              </Text>

            </View>
          )}

        </View>

        {/* ==================================================
            BOTTOM CONTROLS
        ================================================== */}

        <View style={styles.bottomSection}>

          {!photo ? (
            <>
              <Text style={styles.instruction}>
                Take a clear photo of the food
              </Text>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePhoto}
              >
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.instruction}>
                Does this photo clearly show the food?
              </Text>

              <View style={styles.actionRow}>

                {/* RETAKE */}

                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={retakePhoto}
                  disabled={loading}
                >
                  <Ionicons
                    name="camera-outline"
                    size={20}
                    color="#0B0F14"
                  />

                  <Text style={styles.retakeText}>
                    Retake
                  </Text>
                </TouchableOpacity>

                {/* IDENTIFY */}

                <TouchableOpacity
                  style={styles.identifyButton}
                  onPress={identifyFood}
                  disabled={loading}
                >
                  <Ionicons
                    name={
                      loading
                        ? "hourglass-outline"
                        : "sparkles"
                    }
                    size={20}
                    color="#0B0F14"
                  />

                  <Text style={styles.identifyText}>
                    {loading
                      ? "Identifying..."
                      : "Identify Food"}
                  </Text>
                </TouchableOpacity>

              </View>
            </>
          )}

        </View>

      </View>
    </Modal>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
  },

  header: {
    height: 90,
    paddingTop: 40,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  title: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  cameraContainer: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },

  camera: {
    width: "100%",
    height: "100%",
  },

  scanFrame: {
    position: "absolute",
    top: "25%",
    left: "10%",
    right: "10%",
    height: 250,
  },

  cornerTopLeft: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 45,
    height: 45,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F5B82E",
  },

  cornerTopRight: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 45,
    height: 45,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F5B82E",
  },

  cornerBottomLeft: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 45,
    height: 45,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: "#F5B82E",
  },

  cornerBottomRight: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 45,
    height: 45,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: "#F5B82E",
  },

  frameText: {
    position: "absolute",
    bottom: -40,
    width: "100%",
    textAlign: "center",
    color: "#FFFFFF",
    fontSize: 14,
  },

  bottomSection: {
    paddingHorizontal: 20,
    paddingVertical: 25,
    alignItems: "center",
  },

  instruction: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 5,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#F5B82E",
  },

  actionRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },

  retakeButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F5F7FA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  retakeText: {
    color: "#0B0F14",
    fontWeight: "700",
  },

  identifyButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  identifyText: {
    color: "#0B0F14",
    fontWeight: "800",
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  permissionTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginTop: 15,
    marginBottom: 8,
  },

  permissionText: {
    color: "#CBD5E1",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },

  permissionBtn: {
    backgroundColor: "#F5B82E",
    paddingHorizontal: 25,
    paddingVertical: 13,
    borderRadius: 12,
  },

  permissionBtnText: {
    color: "#0B0F14",
    fontWeight: "800",
  },

  cancelBtn: {
    marginTop: 12,
    padding: 10,
  },

  cancelBtnText: {
    color: "#94A3B8",
  },
});
