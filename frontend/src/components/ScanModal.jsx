import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ScanModal({ visible, onClose, onOrderFound }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    Alert.alert(
      "Barcode Scanned!",
      `Data: ${data}`,
      [
        {
          text: "OK",
          onPress: () => {
            onOrderFound(data);
            setTimeout(() => onClose(), 500);
          },
        },
      ]
    );
  };

  if (!permission) {
    return <Text>Requesting camera permission...</Text>;
  }
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>No access to camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Scan & Order</Text>
          <Text style={styles.modalSubtitle}>
            Scan a QR code or barcode to order instantly.
          </Text>

          <View style={styles.scannerBox}>
            <CameraView
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={styles.scanner}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "code128", "code39"],
              }}
            />
          </View>

          {scanned && (
            <TouchableOpacity
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanBtnText}>Tap to Scan Again</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 16,
  },
  scannerBox: {
    width: "100%",
    height: 250,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#0B0F14",
  },
  scanner: {
    width: "100%",
    height: "100%",
  },
  rescanBtn: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#F5B82E",
    borderRadius: 10,
  },
  rescanBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
  },
  closeButtonText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 12,
  },
  permissionBtn: {
    backgroundColor: "#F5B82E",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  permissionBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
  },
});