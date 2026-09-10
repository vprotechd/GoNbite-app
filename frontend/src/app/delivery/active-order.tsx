import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { io, Socket } from "socket.io-client";

import api from "../../services/api";
import PlatformMap from "../../components/PlatformMap";

// =====================================================
// TYPES
// =====================================================

interface LocationCoords {
  latitude: number;
  longitude: number;
  updatedAt?: string | null;
}

interface Restaurant {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  latitude?: number | null;
  longitude?: number | null;
}

interface TrackResponse {
  success: boolean;

  order: {
    id: string;
    status: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
    totalAmount?: number;
    paymentMethod?: string;
    paymentStatus?: string;
    createdAt?: string;
    updatedAt?: string;
  };

  restaurant: Restaurant | null;

  customerLocation: LocationCoords | null;

  restaurantLocation: LocationCoords | null;

  deliveryPartner: any;

  deliveryPartnerLocation: LocationCoords | null;
}

// =====================================================
// SOCKET URL
// =====================================================

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  "http://192.168.1.10:5000";

// =====================================================
// SCREEN
// =====================================================

export default function ActiveOrder() {
  // ===================================================
  // ROUTE PARAMS
  // ===================================================

  const params = useLocalSearchParams<{
    orderId: string;
    restaurantName?: string;
    restaurantAddress?: string;
    deliveryAddress?: string;
    status?: string;
  }>();

  const {
    orderId,
    restaurantName,
    restaurantAddress,
    deliveryAddress: routeDeliveryAddress,
    status: routeStatus,
  } = params;

  // ===================================================
  // STATES
  // ===================================================

  const [currentLocation, setCurrentLocation] =
    useState<LocationCoords | null>(null);

  const [restaurantLocation, setRestaurantLocation] =
    useState<LocationCoords | null>(null);

  const [customerLocation, setCustomerLocation] =
    useState<LocationCoords | null>(null);

  const [loading, setLoading] = useState(true);

  const [trackingLoading, setTrackingLoading] =
    useState(false);

  const [socketConnected, setSocketConnected] =
    useState(false);

  const [orderStatus, setOrderStatus] =
    useState(routeStatus || "");

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [deliveryAddress, setDeliveryAddress] =
    useState(routeDeliveryAddress || "");

  // ===================================================
  // REFS
  // ===================================================

  const socketRef = useRef<Socket | null>(null);

  const locationSubscriptionRef =
    useRef<Location.LocationSubscription | null>(null);

  const webWatchIdRef =
    useRef<number | null>(null);

  // IMPORTANT:
  // Keeps the latest GPS location available even
  // when the socket reconnects.
  const currentLocationRef =
    useRef<LocationCoords | null>(null);

  // ===================================================
  // DEBUG PARAMS
  // ===================================================

  useEffect(() => {
    console.log("====================================");
    console.log("🚴 DELIVERY ACTIVE ORDER");
    console.log("====================================");

    console.log(
      "🔥 ALL ACTIVE ORDER PARAMS:",
      params
    );

    console.log(
      "🆔 ORDER ID:",
      orderId
    );

    console.log(
      "🏪 RESTAURANT:",
      restaurantName
    );

    console.log(
      "📍 RESTAURANT ADDRESS:",
      restaurantAddress
    );

    console.log(
      "🏠 DELIVERY ADDRESS:",
      routeDeliveryAddress
    );

    console.log(
      "📦 STATUS:",
      routeStatus
    );

    console.log(
      "🔌 SOCKET URL:",
      SOCKET_URL
    );

    console.log("====================================");
  }, []);

  // ===================================================
  // HELPER:
  // SAVE CURRENT LOCATION
  // ===================================================

  const updateCurrentLocation = (
    coords: LocationCoords
  ) => {
    currentLocationRef.current = coords;
    setCurrentLocation(coords);
  };

  // ===================================================
  // HELPER:
  // SEND LOCATION TO SERVER
  // ===================================================

  const sendLocationToServer = (
    latitude: number,
    longitude: number
  ) => {
    if (!orderId) {
      console.log(
        "⚠️ Cannot send location: orderId missing"
      );

      return;
    }

    if (!socketRef.current?.connected) {
      console.log(
        "⚠️ Cannot send location: socket not connected"
      );

      return;
    }

    socketRef.current.emit(
      "deliveryLocationUpdate",
      {
        orderId,
        latitude,
        longitude,
      }
    );

    console.log(
      "📡 LOCATION SENT TO SERVER:",
      {
        orderId,
        latitude,
        longitude,
      }
    );
  };

  // ===================================================
  // FETCH ORDER TRACKING
  // ===================================================

  const fetchOrderTracking = async () => {
    if (!orderId) {
      console.log(
        "❌ Cannot fetch tracking: orderId missing"
      );

      setLoading(false);

      return;
    }

    try {
      setTrackingLoading(true);

      console.log(
        "📦 Fetching tracking information:",
        orderId
      );

      const response =
        await api.get<TrackResponse>(
          `/orders/${orderId}/track`
        );

      const data = response.data;

      console.log(
        "✅ ORDER TRACKING RESPONSE:",
        data
      );

      if (!data.success) {
        throw new Error(
          "Tracking information unavailable"
        );
      }

      // =================================================
      // ORDER STATUS
      // =================================================

      if (data.order?.status) {
        console.log(
          "📦 SERVER ORDER STATUS:",
          data.order.status
        );

        setOrderStatus(data.order.status);
      }

      // =================================================
      // DELIVERY ADDRESS
      // =================================================

      if (data.order?.deliveryAddress) {
        setDeliveryAddress(
          data.order.deliveryAddress
        );
      }

      // =================================================
      // RESTAURANT
      // =================================================

      if (data.restaurant) {
        setRestaurant(data.restaurant);

        console.log(
          "🏪 RESTAURANT DATA:",
          data.restaurant
        );
      }

      // =================================================
      // RESTAURANT LOCATION
      // =================================================

      if (
        data.restaurantLocation &&
        typeof data.restaurantLocation.latitude ===
          "number" &&
        typeof data.restaurantLocation.longitude ===
          "number"
      ) {
        setRestaurantLocation(
          data.restaurantLocation
        );

        console.log(
          "🏪 RESTAURANT LOCATION:",
          data.restaurantLocation
        );
      } else {
        console.log(
          "⚠️ Restaurant coordinates not available"
        );

        setRestaurantLocation(null);
      }

      // =================================================
      // CUSTOMER LOCATION
      // =================================================

      if (
        data.customerLocation &&
        typeof data.customerLocation.latitude ===
          "number" &&
        typeof data.customerLocation.longitude ===
          "number"
      ) {
        setCustomerLocation(
          data.customerLocation
        );

        console.log(
          "📍 CUSTOMER LOCATION:",
          data.customerLocation
        );
      } else {
        console.log(
          "⚠️ Customer coordinates not available"
        );

        setCustomerLocation(null);
      }

      // =================================================
      // DELIVERY PARTNER LOCATION
      // =================================================

      if (
        data.deliveryPartnerLocation &&
        typeof data.deliveryPartnerLocation.latitude ===
          "number" &&
        typeof data.deliveryPartnerLocation.longitude ===
          "number"
      ) {
        updateCurrentLocation(
          data.deliveryPartnerLocation
        );

        console.log(
          "🚴 DELIVERY PARTNER LOCATION:",
          data.deliveryPartnerLocation
        );
      } else {
        console.log(
          "⚠️ No saved delivery partner location"
        );
      }

    } catch (error: any) {
      console.log(
        "❌ TRACKING ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );
    } finally {
      setTrackingLoading(false);
      setLoading(false);
    }
  };

  // ===================================================
  // FETCH TRACKING WHEN ORDER ID AVAILABLE
  // ===================================================

  useEffect(() => {
    if (orderId) {
      fetchOrderTracking();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  // ===================================================
  // SOCKET CONNECTION
  // ===================================================

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        const token =
          await AsyncStorage.getItem("token");

        if (!token) {
          console.log(
            "❌ No token found for socket"
          );

          return;
        }

        console.log(
          "🔌 Connecting delivery socket:",
          SOCKET_URL
        );

        const socket = io(
          SOCKET_URL,
          {
            transports: [
              "polling",
              "websocket",
            ],

            reconnection: true,

            reconnectionAttempts: Infinity,

            reconnectionDelay: 1000,

            timeout: 20000,

            auth: {
              token,
            },
          }
        );

        socketRef.current = socket;

        // =============================================
        // CONNECTED
        // =============================================

        socket.on(
          "connect",
          () => {
            if (!mounted) return;

            console.log(
              "🟢 DELIVERY SOCKET CONNECTED:",
              socket.id
            );

            setSocketConnected(true);

            // ==========================================
            // JOIN ORDER ROOM
            // ==========================================

            if (orderId) {
              console.log(
                "📦 Joining order room:",
                orderId
              );

              socket.emit(
                "joinOrder",
                orderId
              );
            }

            // ==========================================
            // SEND LATEST LOCATION AFTER CONNECT
            // ==========================================

            const latestLocation =
              currentLocationRef.current;

            if (
              latestLocation &&
              orderId
            ) {
              console.log(
                "📡 INITIAL LOCATION SENT:",
                latestLocation
              );

              socket.emit(
                "deliveryLocationUpdate",
                {
                  orderId,

                  latitude:
                    latestLocation.latitude,

                  longitude:
                    latestLocation.longitude,
                }
              );
            }
          }
        );

        // =============================================
        // SOCKET ERROR
        // =============================================

        socket.on(
          "connect_error",
          (error) => {
            console.log(
              "❌ Socket connection error:",
              error.message
            );

            if (mounted) {
              setSocketConnected(false);
            }
          }
        );

        // =============================================
        // DISCONNECT
        // =============================================

        socket.on(
          "disconnect",
          (reason) => {
            console.log(
              "🔴 DELIVERY SOCKET DISCONNECTED:",
              reason
            );

            if (mounted) {
              setSocketConnected(false);
            }
          }
        );

        // =============================================
        // LIVE DELIVERY LOCATION
        // =============================================

        socket.on(
          "deliveryLocationUpdate",
          (data) => {
            console.log(
              "📍 LIVE DELIVERY LOCATION:",
              data
            );

            if (
              data?.orderId === orderId &&
              typeof data.latitude ===
                "number" &&
              typeof data.longitude ===
                "number"
            ) {
              updateCurrentLocation({
                latitude:
                  data.latitude,

                longitude:
                  data.longitude,

                updatedAt:
                  data.updatedAt ||
                  new Date().toISOString(),
              });
            }
          }
        );

      } catch (error) {
        console.log(
          "❌ Socket setup error:",
          error
        );
      }
    };

    if (orderId) {
      connectSocket();
    }

    // ===============================================
    // CLEANUP
    // ===============================================

    return () => {
      mounted = false;

      if (
        socketRef.current &&
        orderId
      ) {
        console.log(
          "📤 Leaving order room:",
          orderId
        );

        socketRef.current.emit(
          "leaveOrder",
          orderId
        );
      }

      socketRef.current?.disconnect();

      socketRef.current = null;

      setSocketConnected(false);
    };

  }, [orderId]);

  // ===================================================
  // GET INITIAL LOCATION
  // ===================================================

  const getCurrentLocation = async () => {
    try {
      console.log(
        "📍 Getting delivery partner location..."
      );

      // =================================================
      // WEB
      // =================================================

      if (
        typeof navigator !== "undefined" &&
        navigator.geolocation
      ) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              latitude:
                position.coords.latitude,

              longitude:
                position.coords.longitude,
            };

            console.log(
              "📍 INITIAL WEB LOCATION:",
              coords
            );

            updateCurrentLocation(coords);

            // If socket is already connected,
            // immediately send location.
            sendLocationToServer(
              coords.latitude,
              coords.longitude
            );
          },

          (error) => {
            console.log(
              "❌ Web location error:",
              error
            );
          },

          {
            enableHighAccuracy: true,

            timeout: 15000,

            maximumAge: 10000,
          }
        );

        return;
      }

      // =================================================
      // MOBILE
      // =================================================

      const {
        status,
      } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log(
          "❌ Location permission denied"
        );

        Alert.alert(
          "Location Permission",
          "Please allow location permission to track your delivery."
        );

        return;
      }

      const location =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      const coords = {
        latitude:
          location.coords.latitude,

        longitude:
          location.coords.longitude,
      };

      console.log(
        "📍 INITIAL MOBILE LOCATION:",
        coords
      );

      updateCurrentLocation(coords);

      // If socket is already connected,
      // immediately send location.
      sendLocationToServer(
        coords.latitude,
        coords.longitude
      );

    } catch (error) {
      console.log(
        "❌ Get location error:",
        error
      );
    }
  };

  // ===================================================
  // START GPS TRACKING
  // ===================================================

  const startLocationTracking = async () => {
    try {
      console.log(
        "🚴 STARTING LIVE LOCATION TRACKING"
      );

      if (!orderId) {
        console.log(
          "❌ Cannot start tracking: orderId missing"
        );

        return;
      }

      // =================================================
      // MOBILE
      // =================================================

      if (
        typeof navigator === "undefined" ||
        !navigator.geolocation
      ) {
        const {
          status,
        } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.log(
            "❌ Mobile location permission denied"
          );

          Alert.alert(
            "Location Permission",
            "Location permission is required for delivery tracking."
          );

          return;
        }

        // Stop previous subscription
        if (
          locationSubscriptionRef.current
        ) {
          locationSubscriptionRef.current.remove();

          locationSubscriptionRef.current =
            null;
        }

        console.log(
          "📱 Starting mobile GPS watcher..."
        );

        locationSubscriptionRef.current =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,

              timeInterval: 5000,

              distanceInterval: 10,
            },

            (location) => {
              const latitude =
                location.coords.latitude;

              const longitude =
                location.coords.longitude;

              const coords = {
                latitude,
                longitude,
              };

              console.log(
                "📍 GPS LOCATION:",
                coords
              );

              updateCurrentLocation(
                coords
              );

              // ======================================
              // SEND TO SERVER
              // ======================================

              sendLocationToServer(
                latitude,
                longitude
              );
            }
          );

        console.log(
          "✅ MOBILE GPS TRACKING STARTED"
        );

        return;
      }

      // =================================================
      // WEB
      // =================================================

      if (
        webWatchIdRef.current !== null
      ) {
        navigator.geolocation.clearWatch(
          webWatchIdRef.current
        );

        webWatchIdRef.current = null;
      }

      console.log(
        "🌐 Starting web GPS watcher..."
      );

      webWatchIdRef.current =
        navigator.geolocation.watchPosition(
          (position) => {
            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            const coords = {
              latitude,
              longitude,
            };

            console.log(
              "🌐 WEB LIVE LOCATION:",
              coords
            );

            updateCurrentLocation(
              coords
            );

            // ======================================
            // SEND TO SERVER
            // ======================================

            sendLocationToServer(
              latitude,
              longitude
            );
          },

          (error) => {
            console.log(
              "❌ Web GPS error:",
              error
            );
          },

          {
            enableHighAccuracy: true,

            maximumAge: 5000,

            timeout: 15000,
          }
        );

      console.log(
        "✅ WEB GPS TRACKING STARTED"
      );

    } catch (error) {
      console.log(
        "❌ START TRACKING ERROR:",
        error
      );
    }
  };

  // ===================================================
  // STOP GPS TRACKING
  // ===================================================

  const stopLocationTracking = () => {
    console.log(
      "🛑 STOPPING LOCATION TRACKING"
    );

    // =================================================
    // MOBILE
    // =================================================

    if (
      locationSubscriptionRef.current
    ) {
      locationSubscriptionRef.current.remove();

      locationSubscriptionRef.current =
        null;
    }

    // =================================================
    // WEB
    // =================================================

    if (
      webWatchIdRef.current !== null &&
      typeof navigator !== "undefined" &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        webWatchIdRef.current
      );

      webWatchIdRef.current = null;
    }
  };

  // ===================================================
  // INITIAL LOCATION
  // ===================================================

  useEffect(() => {
    getCurrentLocation();

    return () => {
      stopLocationTracking();
    };
  }, []);

  // ===================================================
  // START / STOP TRACKING BASED ON STATUS
  // ===================================================

  useEffect(() => {
    console.log(
      "📦 CURRENT ORDER STATUS:",
      orderStatus
    );

    if (
      orderStatus === "Out for Delivery"
    ) {
      console.log(
        "🚴 Order is Out for Delivery"
      );

      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };

  }, [orderStatus, orderId]);

  // ===================================================
  // MARK DELIVERED
  // ===================================================

  const handleDelivered = async () => {
    if (!orderId) {
      Alert.alert(
        "Error",
        "Order ID is missing."
      );

      return;
    }

    try {
      setLoading(true);

      console.log(
        "📦 Marking order delivered:",
        orderId
      );

      const response =
        await api.put(
          `/delivery/orders/${orderId}/status`,
          {
            status: "Delivered",
          }
        );

      console.log(
        "✅ DELIVERED RESPONSE:",
        response.data
      );

      if (
        response.data?.success
      ) {
        setOrderStatus("Delivered");

        stopLocationTracking();

        socketRef.current?.emit(
          "leaveOrder",
          orderId
        );

        Alert.alert(
          "Order Delivered",
          "Order has been successfully delivered.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace(
                  "/delivery/dashboard"
                );
              },
            },
          ]
        );

      } else {
        Alert.alert(
          "Error",
          response.data?.error ||
            "Failed to mark order as delivered."
        );
      }

    } catch (error: any) {
      console.log(
        "❌ DELIVERED ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to mark order as delivered."
      );

    } finally {
      setLoading(false);
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingText}>
          Loading active order...
        </Text>
      </SafeAreaView>
    );
  }

  // ===================================================
  // SCREEN
  // ===================================================

  return (
    <SafeAreaView style={styles.container}>

      {/* =================================================
          HEADER
      ================================================= */}

      <View style={styles.header}>

        <TouchableOpacity
          onPress={() =>
            router.back()
          }
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111"
          />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            Active Order
          </Text>

          <Text style={styles.orderIdText}>
            #{orderId?.slice(-6)}
          </Text>
        </View>

        <View
          style={[
            styles.socketIndicator,
            {
              backgroundColor:
                socketConnected
                  ? "#22C55E"
                  : "#EF4444",
            },
          ]}
        />

      </View>

      {/* =================================================
          STATUS
      ================================================= */}

      <View style={styles.statusCard}>

        <View style={styles.statusIcon}>

          <Ionicons
            name={
              orderStatus ===
              "Delivered"
                ? "checkmark-circle"
                : "bicycle"
            }
            size={25}
            color="#F5B82E"
          />

        </View>

        <View style={styles.statusInfo}>

          <Text style={styles.statusLabel}>
            Order Status
          </Text>

          <Text style={styles.statusValue}>
            {orderStatus ||
              "Processing"}
          </Text>

        </View>

      </View>

      {/* =================================================
          RESTAURANT INFO
      ================================================= */}

      <View style={styles.infoCard}>

        <View style={styles.infoIcon}>
          <Ionicons
            name="restaurant-outline"
            size={22}
            color="#F5B82E"
          />
        </View>

        <View style={styles.infoContent}>

          <Text style={styles.infoLabel}>
            PICKUP FROM
          </Text>

          <Text style={styles.infoTitle}>
            {restaurant?.name ||
              restaurantName ||
              "Restaurant"}
          </Text>

          <Text style={styles.infoAddress}>
            {restaurant?.address ||
              restaurantAddress ||
              "Restaurant address unavailable"}
          </Text>

        </View>

      </View>

      {/* =================================================
          CUSTOMER INFO
      ================================================= */}

      <View style={styles.infoCard}>

        <View style={styles.infoIcon}>
          <Ionicons
            name="location-outline"
            size={22}
            color="#F5B82E"
          />
        </View>

        <View style={styles.infoContent}>

          <Text style={styles.infoLabel}>
            DELIVER TO
          </Text>

          <Text style={styles.infoTitle}>
            Customer
          </Text>

          <Text style={styles.infoAddress}>
            {deliveryAddress ||
              "Customer address unavailable"}
          </Text>

        </View>

      </View>

      {/* =================================================
          MAP
      ================================================= */}

      <View style={styles.mapContainer}>

        <PlatformMap
          currentLocation={
            currentLocation
          }

          restaurantLocation={
            restaurantLocation
          }

          customerLocation={
            customerLocation
          }
        />

        {/* =================================================
            MAP LEGEND
        ================================================= */}

        <View style={styles.mapLegend}>

          <View style={styles.legendRow}>

            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#4285F4",
                },
              ]}
            />

            <Text style={styles.legendText}>
              Restaurant
            </Text>

          </View>

          <View style={styles.legendRow}>

            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#34A853",
                },
              ]}
            />

            <Text style={styles.legendText}>
              Customer
            </Text>

          </View>

          <View style={styles.legendRow}>

            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#EA4335",
                },
              ]}
            />

            <Text style={styles.legendText}>
              You
            </Text>

          </View>

        </View>

        {/* =================================================
            TRACKING STATUS
        ================================================= */}

        {orderStatus ===
          "Out for Delivery" && (

          <View
            style={styles.liveTrackingBadge}
          >

            <View
              style={styles.liveDot}
            />

            <Text
              style={
                styles.liveTrackingText
              }
            >
              Live location sharing
            </Text>

          </View>
        )}

        {/* =================================================
            MAP LOADING
        ================================================= */}

        {trackingLoading && (

          <View
            style={styles.mapLoading}
          >

            <ActivityIndicator
              size="small"
            />

            <Text
              style={
                styles.mapLoadingText
              }
            >
              Loading locations...
            </Text>

          </View>
        )}

      </View>

      {/* =================================================
          DELIVERED BUTTON
      ================================================= */}

      {orderStatus ===
        "Out for Delivery" && (

        <View
          style={styles.bottomContainer}
        >

          <TouchableOpacity
            style={
              styles.deliveredButton
            }
            onPress={
              handleDelivered
            }
            disabled={loading}
          >

            <Ionicons
              name="checkmark-circle-outline"
              size={24}
              color="#111"
            />

            <Text
              style={
                styles.deliveredButtonText
              }
            >
              Mark as Delivered
            </Text>

          </TouchableOpacity>

        </View>
      )}

      {/* =================================================
          DELIVERED STATE
      ================================================= */}

      {orderStatus ===
        "Delivered" && (

        <View
          style={
            styles.deliveredCard
          }
        >

          <Ionicons
            name="checkmark-circle"
            size={30}
            color="#22C55E"
          />

          <Text
            style={
              styles.deliveredText
            }
          >
            Order Delivered Successfully
          </Text>

        </View>
      )}

    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F8F8",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: "#666",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 65,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 16,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#EEEEEE",
  },

  backButton: {
    width: 42,
    height: 42,

    justifyContent: "center",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,

    alignItems: "center",
  },

  headerTitle: {
    fontSize: 19,

    fontWeight: "700",

    color: "#111",
  },

  orderIdText: {
    fontSize: 12,

    color: "#777",

    marginTop: 2,
  },

  socketIndicator: {
    width: 10,
    height: 10,

    borderRadius: 5,
  },

  // ===================================================
  // STATUS
  // ===================================================

  statusCard: {
    flexDirection: "row",

    alignItems: "center",

    marginHorizontal: 15,

    marginTop: 12,

    padding: 14,

    backgroundColor: "#FFFFFF",

    borderRadius: 12,
  },

  statusIcon: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: "#FFF5D6",

    justifyContent: "center",

    alignItems: "center",
  },

  statusInfo: {
    marginLeft: 12,
  },

  statusLabel: {
    fontSize: 12,

    color: "#777",

    fontWeight: "500",
  },

  statusValue: {
    marginTop: 3,

    fontSize: 16,

    color: "#111",

    fontWeight: "700",
  },

  // ===================================================
  // INFO CARDS
  // ===================================================

  infoCard: {
    flexDirection: "row",

    marginHorizontal: 15,

    marginTop: 10,

    padding: 13,

    backgroundColor: "#FFFFFF",

    borderRadius: 12,
  },

  infoIcon: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: "#FFF5D6",

    justifyContent: "center",

    alignItems: "center",
  },

  infoContent: {
    flex: 1,

    marginLeft: 11,
  },

  infoLabel: {
    fontSize: 10,

    color: "#888",

    fontWeight: "700",

    letterSpacing: 0.5,
  },

  infoTitle: {
    marginTop: 2,

    fontSize: 15,

    fontWeight: "700",

    color: "#111",
  },

  infoAddress: {
    marginTop: 3,

    fontSize: 12,

    color: "#666",

    lineHeight: 17,
  },

  // ===================================================
  // MAP
  // ===================================================

  mapContainer: {
    flex: 1,

    marginTop: 12,

    marginHorizontal: 15,

    marginBottom: 10,

    borderRadius: 15,

    overflow: "hidden",

    backgroundColor: "#EAEAEA",

    minHeight: 250,
  },

  // ===================================================
  // MAP LEGEND
  // ===================================================

  mapLegend: {
    position: "absolute",

    top: 12,

    left: 12,

    backgroundColor:
      "rgba(255,255,255,0.95)",

    borderRadius: 10,

    paddingHorizontal: 10,

    paddingVertical: 8,
  },

  legendRow: {
    flexDirection: "row",

    alignItems: "center",

    marginVertical: 2,
  },

  legendDot: {
    width: 9,
    height: 9,

    borderRadius: 5,

    marginRight: 6,
  },

  legendText: {
    fontSize: 11,

    color: "#333",

    fontWeight: "500",
  },

  // ===================================================
  // LIVE TRACKING
  // ===================================================

  liveTrackingBadge: {
    position: "absolute",

    top: 12,

    right: 12,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 10,

    paddingVertical: 7,

    backgroundColor:
      "rgba(255,255,255,0.95)",

    borderRadius: 20,
  },

  liveDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: "#22C55E",

    marginRight: 6,
  },

  liveTrackingText: {
    fontSize: 11,

    fontWeight: "600",

    color: "#222",
  },

  // ===================================================
  // MAP LOADING
  // ===================================================

  mapLoading: {
    position: "absolute",

    bottom: 12,

    left: 12,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor:
      "rgba(255,255,255,0.95)",

    borderRadius: 20,

    paddingHorizontal: 12,

    paddingVertical: 7,
  },

  mapLoadingText: {
    marginLeft: 6,

    fontSize: 11,

    color: "#555",
  },

  // ===================================================
  // BOTTOM
  // ===================================================

  bottomContainer: {
    paddingHorizontal: 15,

    paddingBottom: 12,

    backgroundColor: "#F8F8F8",
  },

  deliveredButton: {
    height: 52,

    borderRadius: 12,

    backgroundColor: "#F5B82E",

    flexDirection: "row",

    justifyContent: "center",

    alignItems: "center",

    gap: 8,
  },

  deliveredButtonText: {
    fontSize: 16,

    fontWeight: "700",

    color: "#111",
  },

  // ===================================================
  // DELIVERED
  // ===================================================

  deliveredCard: {
    marginHorizontal: 15,

    marginBottom: 12,

    padding: 15,

    borderRadius: 12,

    backgroundColor: "#EAF8EF",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  deliveredText: {
    marginLeft: 8,

    fontSize: 15,

    fontWeight: "700",

    color: "#15803D",
  },

});