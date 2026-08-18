import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api";

// ✅ 1. Define the type for URL params
interface Params {
  orderId: string;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
}

// ✅ 2. Define the Location type
interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function ActiveOrderScreen() {
  // ✅ Use the generic to enforce types safely
    // ✅ Define the type inline so TypeScript understands it immediately
  const params = useLocalSearchParams<{
    orderId: string;
    restaurantName: string;
    restaurantAddress: string;
    deliveryAddress: string;
  }>();
  const { orderId, restaurantName, restaurantAddress, deliveryAddress } = params;

  const [orderStatus, setOrderStatus] = useState<"Preparing" | "Out for Delivery" | "Delivered">("Preparing");
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);

  useEffect(() => {
    // Start live location tracking
    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    };
    startLocationTracking();
  }, []);

  const updateStatus = async (status: "Out for Delivery" | "Delivered") => {
    setIsLoading(true);
    try {
      await api.put(`/delivery/update-status/${orderId}`, { status });
      setOrderStatus(status);
      
      if (status === "Delivered") {
        Alert.alert("✅ Delivered!", "Payment has been credited to your wallet.");
        router.replace("/delivery/dashboard");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update status.");
    } finally {
      setIsLoading(false);
    }
  };

  const openMaps = (address: string) => {
    const url = Platform.OS === "ios" 
      ? `http://maps.apple.com/?daddr=${encodeURIComponent(address)}`
      : `geo:0,0?q=${encodeURIComponent(address)}`;
    Linking.openURL(url);
  };

  // Initial map region
  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: 28.6139, // Default to New Delhi if GPS is off
        longitude: 77.2090,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Active Delivery</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* --- MAP VIEW --- */}
                   {/* --- MAP VIEW --- */}
          <View style={styles.mapContainer}>
            {Platform.OS === 'web' ? (
              // ✅ FOR WEB: Show a clean placeholder instead of crashing
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={48} color="#F5B82E" />
                <Text style={styles.mapPlaceholderText}>
                  Map is only available on the mobile app.
                </Text>
              </View>
            ) : currentLocation ? (
              <MapView
                style={styles.map}
                initialRegion={initialRegion}
              >
                <Marker coordinate={currentLocation} title="Your Location" pinColor="#F5B82E" />
              </MapView>
            ) : (
              <View style={styles.mapPlaceholder}>
                <Text style={styles.mapPlaceholderText}>Loading GPS...</Text>
              </View>
            )}
          </View>

          {/* --- ORDER DETAILS --- */}
          <View style={styles.orderCard}>
            <Text style={styles.orderTitle}>Order #{orderId?.toString().slice(-6)}</Text>
            <Text style={styles.orderStatus}>Status: {orderStatus}</Text>
            
            <View style={styles.addressSection}>
              <Text style={styles.addressLabel}>📍 Pickup:</Text>
              <TouchableOpacity onPress={() => openMaps(restaurantAddress || "")}>
                <Text style={styles.addressText}>{restaurantAddress || "Address not provided"}</Text>
              </TouchableOpacity>

              <Text style={styles.addressLabel}>🏠 Drop-off:</Text>
              <TouchableOpacity onPress={() => openMaps(deliveryAddress || "")}>
                <Text style={styles.addressText}>{deliveryAddress || "Address not provided"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* --- ACTION BUTTONS --- */}
          {orderStatus === "Preparing" && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus("Out for Delivery")}>
              <Text style={styles.actionBtnText}>Confirm Pickup</Text>
            </TouchableOpacity>
          )}

          {orderStatus === "Out for Delivery" && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.deliveredBtn]} 
              onPress={() => updateStatus("Delivered")}
            >
              <Text style={styles.actionBtnText}>Mark as Delivered</Text>
            </TouchableOpacity>
          )}
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, backgroundColor: "#081A33" },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#FFFFFF" },
  scrollContent: { padding: 20 },

  mapContainer: { height: 250, borderRadius: 16, overflow: "hidden", marginBottom: 16, backgroundColor: "#E2E6EB" },
  map: { width: "100%", height: "100%" },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapPlaceholderText: { fontSize: 16, color: "#64748B" },

  orderCard: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#E2E6EB" },
  orderTitle: { fontSize: 18, fontWeight: "800", color: "#0B0F14" },
  orderStatus: { fontSize: 14, color: "#64748B", marginTop: 4 },

  addressSection: { marginTop: 12 },
  addressLabel: { fontSize: 14, fontWeight: "600", color: "#0B0F14", marginTop: 8 },
  addressText: { fontSize: 13, color: "#F5B82E", marginTop: 2 },

  actionBtn: { backgroundColor: "#F5B82E", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  deliveredBtn: { backgroundColor: "#4CAF50" },
  actionBtnText: { color: "#0B0F14", fontWeight: "700", fontSize: 16 },
});