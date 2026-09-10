import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { io, Socket } from "socket.io-client";

import api from "../../services/api";
import PlatformMap from "../../components/PlatformMap";

// =====================================================
// TYPES
// =====================================================

type OrderStatus =
  | "Pending"
  | "Accepted"
  | "Preparing"
  | "Accepted by Delivery"
  | "Out for Delivery"
  | "Delivered"
  | "Cancelled";

interface LocationCoords {
  latitude: number;
  longitude: number;
  updatedAt?: string | null;
}

interface OrderItem {
  foodItemId?: string;
  name: string;
  quantity: number;
  price: number;
}

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
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
    status: OrderStatus;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    items: OrderItem[];
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    deliveryOtp?: string | null;
    createdAt?: string;
    updatedAt?: string;
  };

  restaurant: Restaurant | null;

  customerLocation:
    | LocationCoords
    | null;

  restaurantLocation:
    | LocationCoords
    | null;

  deliveryPartner: DeliveryPartner | null;

  deliveryPartnerLocation:
    | LocationCoords
    | null;
}

// =====================================================
// SOCKET URL
// =====================================================

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  process.env.EXPO_PUBLIC_API_URL?.replace(
    /\/api\/?$/,
    ""
  ) ||
  "http://192.168.1.10:5000";

// =====================================================
// SCREEN
// =====================================================

export default function ActiveOrderScreen() {
  // ===================================================
  // ROUTE PARAM
  // ===================================================

  const params = useLocalSearchParams<{
    orderId?: string | string[];
  }>();

  const rawOrderId = params?.orderId;

  const orderId = Array.isArray(rawOrderId)
    ? rawOrderId[0]
    : rawOrderId;

  console.log(
    "🔥 CUSTOMER ACTIVE ORDER PARAMS:",
    params
  );

  console.log(
    "🆔 CUSTOMER FINAL ORDER ID:",
    orderId
  );

  // ===================================================
  // STATE
  // ===================================================

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [orderStatus, setOrderStatus] =
    useState<OrderStatus>("Pending");

  const [restaurant, setRestaurant] =
    useState<Restaurant | null>(null);

  const [deliveryPartner, setDeliveryPartner] =
    useState<DeliveryPartner | null>(null);

  const [customerLocation, setCustomerLocation] =
    useState<LocationCoords | null>(null);

    const [customerCurrentLocation, setCustomerCurrentLocation] =
  useState<LocationCoords | null>(null);

  const [restaurantLocation, setRestaurantLocation] =
    useState<LocationCoords | null>(null);

  const [deliveryAddress, setDeliveryAddress] =
    useState("");

  const [items, setItems] =
    useState<OrderItem[]>([]);

  const [totalAmount, setTotalAmount] =
    useState(0);

  const [paymentMethod, setPaymentMethod] =
    useState("");

  const [paymentStatus, setPaymentStatus] =
    useState("");

  const [deliveryOtp, setDeliveryOtp] =
    useState<string | null>(null);

  const [
    deliveryPartnerLocation,
    setDeliveryPartnerLocation,
  ] = useState<LocationCoords | null>(
    null
  );

  const [
    isSocketConnected,
    setIsSocketConnected,
  ] = useState(false);

  // ===================================================
  // REFS
  // ===================================================

  const socketRef =
    useRef<Socket | null>(null);

  const customerLocationSubscriptionRef =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const customerLiveLocationRef =
    useRef<LocationCoords | null>(null);

  // ===================================================
  // FETCH ORDER TRACKING DATA
  // ===================================================

  const fetchOrder = async (
    showLoader = true
  ) => {
    if (!orderId) {
      console.log(
        "⏳ Waiting for customer order ID..."
      );
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      console.log(
        "📦 Fetching tracking:",
        orderId
      );

      const response =
        await api.get<TrackResponse>(
          `/orders/${orderId}/track`
        );

      const data =
        response.data;

      console.log(
        "✅ Tracking response:",
        data
      );

      if (!data.success) {
        throw new Error(
          "Tracking information unavailable"
        );
      }

      // =============================================
      // ORDER
      // =============================================

      setOrderStatus(
        data.order.status
      );

      setDeliveryAddress(
        data.order.deliveryAddress || ""
      );

      setItems(
        data.order.items || []
      );

      setTotalAmount(
        data.order.totalAmount || 0
      );

      setPaymentMethod(
        data.order.paymentMethod || ""
      );

      setPaymentStatus(
        data.order.paymentStatus || ""
      );

      setDeliveryOtp(
        data.order.deliveryOtp || null
      );

      // =============================================
      // RESTAURANT
      // =============================================

      setRestaurant(
        data.restaurant || null
      );

      // =============================================
      // RESTAURANT LOCATION
      // =============================================

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
        setRestaurantLocation(null);

        console.log(
          "⚠️ Restaurant location not available"
        );
      }

      // =============================================
      // CUSTOMER LOCATION
      // =============================================

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

        customerLiveLocationRef.current =
          data.customerLocation;

        console.log(
          "📍 CUSTOMER LOCATION:",
          data.customerLocation
        );
      } else {
        console.log(
          "⚠️ Customer location not available yet"
        );
      }

      // =============================================
      // DELIVERY PARTNER
      // =============================================

      setDeliveryPartner(
        data.deliveryPartner || null
      );

      // =============================================
      // INITIAL DELIVERY PARTNER LOCATION
      // =============================================

      if (
        data.deliveryPartnerLocation &&
        typeof data.deliveryPartnerLocation.latitude ===
          "number" &&
        typeof data.deliveryPartnerLocation.longitude ===
          "number"
      ) {
        setDeliveryPartnerLocation(
          data.deliveryPartnerLocation
        );

        console.log(
          "🚴 DELIVERY PARTNER LOCATION:",
          data.deliveryPartnerLocation
        );
      } else {
        console.log(
          "⚠️ Delivery partner location not available yet"
        );
      }
    } catch (error: any) {
      console.log(
        "❌ TRACK ORDER ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      if (showLoader) {
        Alert.alert(
          "Error",
          error?.response?.data
            ?.error ||
            "Failed to load active order."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ===================================================
  // SEND CUSTOMER LOCATION
  // ===================================================

  const sendCustomerLocation = (
    socket: Socket,
    coords: LocationCoords
  ) => {
    if (!orderId) {
      console.log(
        "⚠️ Cannot send customer location: orderId missing"
      );
      return;
    }

    if (!socket.connected) {
      console.log(
        "⚠️ Cannot send customer location: socket disconnected"
      );
      return;
    }

    socket.emit(
      "customerLocationUpdate",
      {
        orderId: String(orderId),
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    );

    console.log(
      "📡 CUSTOMER LOCATION SENT:",
      {
        orderId: String(orderId),
        latitude: coords.latitude,
        longitude: coords.longitude,
      }
    );
  };

  // ===================================================
  // START CUSTOMER LIVE LOCATION
  // ===================================================

  const startCustomerLiveLocation = async (
    socket: Socket
  ) => {
    try {
      console.log(
        "📍 Starting customer live GPS..."
      );

      // =============================================
      // PERMISSION
      // =============================================

      const {
        status,
      } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log(
          "❌ Customer location permission denied"
        );

        Alert.alert(
          "Location Permission",
          "Please allow location access so your delivery location can be tracked."
        );

        return;
      }

      console.log(
        "✅ Customer location permission granted"
      );

      // =============================================
      // INITIAL LOCATION
      // =============================================

      const current =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,
          }
        );

      const initialLocation: LocationCoords = {
        latitude:
          current.coords.latitude,
        longitude:
          current.coords.longitude,
        updatedAt:
          new Date().toISOString(),
      };

      customerLiveLocationRef.current =
        initialLocation;

      setCustomerLocation(
        initialLocation
      );

      console.log(
        "📍 CUSTOMER INITIAL GPS:",
        initialLocation
      );

      // =============================================
      // SEND INITIAL LOCATION
      // =============================================

      sendCustomerLocation(
        socket,
        initialLocation
      );

      // =============================================
      // REMOVE OLD WATCHER
      // =============================================

      if (
        customerLocationSubscriptionRef.current
      ) {
        customerLocationSubscriptionRef.current.remove();

        customerLocationSubscriptionRef.current =
          null;
      }

      // =============================================
      // CONTINUOUS GPS WATCH
      // =============================================

      customerLocationSubscriptionRef.current =
        await Location.watchPositionAsync(
          {
            accuracy:
              Location.Accuracy.High,

            timeInterval: 5000,

            distanceInterval: 10,
          },
          (location) => {
            const coords: LocationCoords = {
              latitude:
                location.coords.latitude,
              longitude:
                location.coords.longitude,
              updatedAt:
                new Date().toISOString(),
            };

            customerLiveLocationRef.current =
              coords;

            setCustomerLocation(
              coords
            );

            console.log(
              "📍 CUSTOMER LIVE GPS:",
              coords
            );

            sendCustomerLocation(
              socket,
              coords
            );
          }
        );

      console.log(
        "🟢 Customer GPS watcher started"
      );
    } catch (error) {
      console.log(
        "❌ CUSTOMER GPS ERROR:",
        error
      );
    }
  };

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchOrder(true);
  }, [orderId]);

  // ===================================================
  // SOCKET.IO + CUSTOMER GPS
  // ===================================================

  useEffect(() => {
    if (!orderId) {
      return;
    }

    let mounted = true;

    const connectSocket =
      async () => {
        try {
          // ==========================================
          // GET JWT
          // ==========================================

          const token =
            await AsyncStorage.getItem(
              "token"
            );

          if (!token) {
            console.log(
              "❌ Customer socket: token missing"
            );

            return;
          }

          console.log(
            "🔌 Customer connecting Socket.IO:",
            SOCKET_URL
          );

          // ==========================================
          // CONNECT
          // ==========================================

          const socket =
            io(SOCKET_URL, {
              transports: [
                "polling",
                "websocket",
              ],

              reconnection: true,

              reconnectionAttempts:
                Infinity,

              reconnectionDelay: 1000,

              timeout: 20000,

              auth: {
                token,
              },
            });

          socketRef.current =
            socket;

          // ==========================================
          // CONNECTED
          // ==========================================

          socket.on(
            "connect",
            () => {
              if (!mounted) {
                return;
              }

              console.log(
                "🟢 Customer Socket connected:",
                socket.id
              );

              setIsSocketConnected(
                true
              );

              // ====================================
              // JOIN ORDER ROOM
              // ====================================

              socket.emit(
                "joinOrder",
                String(orderId)
              );

              console.log(
                "📦 Customer joined:",
                `order:${orderId}`
              );

              // ====================================
              // START CUSTOMER GPS
              // ====================================

              startCustomerLiveLocation(
                socket
              );
            }
          );

          // ==========================================
          // DISCONNECTED
          // ==========================================

          socket.on(
            "disconnect",
            (reason) => {
              if (!mounted) {
                return;
              }

              console.log(
                "🔴 Customer socket disconnected:",
                reason
              );

              setIsSocketConnected(
                false
              );
            }
          );

          // ==========================================
          // CONNECTION ERROR
          // ==========================================

          socket.on(
            "connect_error",
            (error) => {
              if (!mounted) {
                return;
              }

              console.log(
                "❌ Customer socket error:",
                error.message
              );

              setIsSocketConnected(
                false
              );
            }
          );

          // ==========================================
          // LIVE DELIVERY PARTNER LOCATION
          // ==========================================

          socket.on(
            "deliveryLocationUpdate",
            (data) => {
              if (!mounted) {
                return;
              }

              console.log(
                "📍 LIVE DELIVERY LOCATION:",
                data
              );

              if (
                data?.orderId &&
                String(data.orderId) !==
                  String(orderId)
              ) {
                return;
              }

              if (
                typeof data?.latitude ===
                  "number" &&
                typeof data?.longitude ===
                  "number"
              ) {
                const liveLocation: LocationCoords =
                  {
                    latitude:
                      Number(
                        data.latitude
                      ),

                    longitude:
                      Number(
                        data.longitude
                      ),

                    updatedAt:
                      data.updatedAt ||
                      null,
                  };

                setDeliveryPartnerLocation(
                  liveLocation
                );

                console.log(
                  "🚴 CUSTOMER MAP DELIVERY LOCATION:",
                  liveLocation
                );
              }
            }
          );

          // ==========================================
          // LIVE CUSTOMER LOCATION
          // ==========================================

          socket.on(
            "customerLocationUpdate",
            (data) => {
              if (!mounted) {
                return;
              }

              console.log(
                "📍 CUSTOMER LOCATION UPDATE:",
                data
              );

              if (
                data?.orderId &&
                String(data.orderId) !==
                  String(orderId)
              ) {
                return;
              }

              if (
                typeof data?.latitude ===
                  "number" &&
                typeof data?.longitude ===
                  "number"
              ) {
                const liveCustomerLocation: LocationCoords =
                  {
                    latitude:
                      Number(
                        data.latitude
                      ),

                    longitude:
                      Number(
                        data.longitude
                      ),

                    updatedAt:
                      data.updatedAt ||
                      null,
                  };

                customerLiveLocationRef.current =
                  liveCustomerLocation;

                setCustomerLocation(
                  liveCustomerLocation
                );

                console.log(
                  "📍 CUSTOMER MAP LOCATION:",
                  liveCustomerLocation
                );
              }
            }
          );

          // ==========================================
          // LIVE MESSAGE
          // ==========================================

          socket.on(
            "receiveMessage",
            (data) => {
              console.log(
                "💬 New order message:",
                data
              );
            }
          );
        } catch (error) {
          console.log(
            "❌ Customer socket setup error:",
            error
          );
        }
      };

    connectSocket();

    // ================================================
    // CLEANUP
    // ================================================

    return () => {
      mounted = false;

      console.log(
        "🧹 Cleaning customer socket..."
      );

      // =============================================
      // STOP CUSTOMER GPS
      // =============================================

      if (
        customerLocationSubscriptionRef.current
      ) {
        customerLocationSubscriptionRef.current.remove();

        customerLocationSubscriptionRef.current =
          null;
      }

      // =============================================
      // DISCONNECT SOCKET
      // =============================================

      if (
        socketRef.current
      ) {
        socketRef.current.emit(
          "leaveOrder",
          String(orderId)
        );

        socketRef.current.disconnect();

        socketRef.current = null;
      }

      setIsSocketConnected(
        false
      );
    };
  }, [orderId]);

  // ===================================================
  // OPEN PHONE
  // ===================================================

  const callDeliveryPartner = () => {
    if (
      !deliveryPartner?.phone
    ) {
      Alert.alert(
        "Unavailable",
        "Delivery partner phone number is not available."
      );

      return;
    }

    Linking.openURL(
      `tel:${deliveryPartner.phone}`
    ).catch(() => {
      Alert.alert(
        "Error",
        "Could not open phone dialer."
      );
    });
  };

  // ===================================================
  // OPEN RESTAURANT
  // ===================================================

  const callRestaurant = () => {
    if (!restaurant?.phone) {
      Alert.alert(
        "Unavailable",
        "Restaurant phone number is not available."
      );

      return;
    }

    Linking.openURL(
      `tel:${restaurant.phone}`
    ).catch(() => {
      Alert.alert(
        "Error",
        "Could not open phone dialer."
      );
    });
  };

  // ===================================================
  // OPEN ADDRESS IN MAPS
  // ===================================================

  const openMaps = (
    address: string
  ) => {
    if (!address) {
      Alert.alert(
        "Error",
        "Address is not available."
      );

      return;
    }

    let url = "";

    if (
      Platform.OS === "ios"
    ) {
      url =
        `http://maps.apple.com/?q=` +
        encodeURIComponent(
          address
        );
    } else if (
      Platform.OS === "android"
    ) {
      url =
        `geo:0,0?q=` +
        encodeURIComponent(
          address
        );
    } else {
      url =
        `https://www.google.com/maps/search/?api=1&query=` +
        encodeURIComponent(
          address
        );
    }

    Linking.openURL(url).catch(
      () => {
        Alert.alert(
          "Error",
          "Could not open maps."
        );
      }
    );
  };

  // ===================================================
  // STATUS HELPERS
  // ===================================================

  const statusIndex = (
    statusValue: OrderStatus
  ) => {
    const statuses: OrderStatus[] = [
      "Pending",
      "Preparing",
      "Accepted by Delivery",
      "Out for Delivery",
      "Delivered",
    ];

    return statuses.indexOf(
      statusValue
    );
  };

  const currentStatusIndex =
    statusIndex(orderStatus);

  const isCompleted = (
    index: number
  ) => {
    return (
      currentStatusIndex >= index
    );
  };

  // ===================================================
  // STATUS TEXT
  // ===================================================

  const getStatusTitle = () => {
    switch (orderStatus) {
      case "Pending":
        return "Order placed";

      case "Accepted":
        return "Order accepted";

      case "Preparing":
        return "Restaurant is preparing your order";

      case "Accepted by Delivery":
        return "Delivery partner accepted";

      case "Out for Delivery":
        return "On the way to you";

      case "Delivered":
        return "Delivered";

      case "Cancelled":
        return "Order cancelled";

      default:
        return "Order status";
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading your order...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // NO ORDER
  // ===================================================

  if (!orderId) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={
            styles.emptyContainer
          }
        >
          <Ionicons
            name="receipt-outline"
            size={55}
            color="#F5B82E"
          />

          <Text
            style={
              styles.emptyTitle
            }
          >
            No active order
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View
        style={styles.container}
      >
        {/* ==========================================
            HEADER
        ========================================== */}

        <View
          style={styles.header}
        >
          <TouchableOpacity
            style={
              styles.headerButton
            }
            onPress={() =>
              router.back()
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Track Order
          </Text>

          <TouchableOpacity
            style={
              styles.headerButton
            }
            onPress={() =>
              fetchOrder(false)
            }
          >
            <Ionicons
              name="refresh"
              size={23}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* ========================================
              LIVE STATUS
          ======================================== */}

          <View
            style={
              styles.liveStatusCard
            }
          >
            <View
              style={
                styles.liveIconCircle
              }
            >
              <Ionicons
                name={
                  orderStatus ===
                  "Delivered"
                    ? "checkmark"
                    : "bicycle"
                }
                size={25}
                color="#0B0F14"
              />
            </View>

            <View
              style={
                styles.liveStatusContent
              }
            >
              <Text
                style={
                  styles.liveStatusTitle
                }
              >
                {getStatusTitle()}
              </Text>

              <Text
                style={
                  styles.liveStatusSubtitle
                }
              >
                {orderStatus ===
                "Out for Delivery"
                  ? "Your delivery partner is on the way"
                  : orderStatus ===
                    "Delivered"
                  ? "Enjoy your meal!"
                  : "We'll keep you updated"}
              </Text>
            </View>

            <View
              style={
                styles.liveIndicator
              }
            >
              <View
                style={[
                  styles.liveDot,
                  {
                    backgroundColor:
                      isSocketConnected
                        ? "#4CAF50"
                        : "#F5B82E",
                  },
                ]}
              />

              <Text
                style={
                  styles.liveText
                }
              >
                {isSocketConnected
                  ? "LIVE"
                  : "CONNECTING"}
              </Text>
            </View>
          </View>

          {/* ========================================
              MAP
          ======================================== */}

          <View
            style={
              styles.mapCard
            }
          >
            <View
              style={
                styles.mapHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.mapTitle
                  }
                >
                  Live delivery tracking
                </Text>

                <Text
                  style={
                    styles.mapSubtitle
                  }
                >
                  {deliveryPartnerLocation
                    ? "Delivery partner location updated"
                    : orderStatus ===
                      "Out for Delivery"
                    ? "Waiting for delivery partner location..."
                    : "Live tracking starts when your order is on the way"}
                </Text>
              </View>

              <View
                style={
                  styles.mapIcon
                }
              >
                <Ionicons
                  name="navigate"
                  size={20}
                  color="#F5B82E"
                />
              </View>
            </View>

            <View
              style={
                styles.mapContainer
              }
            >
             <PlatformMap
  currentLocation={deliveryPartnerLocation}
  restaurantLocation={restaurantLocation}
  customerLocation={customerLocation}
  customerCurrentLocation={customerCurrentLocation}
/>

              {!deliveryPartnerLocation &&
                orderStatus !==
                  "Out for Delivery" && (
                  <View
                    style={
                      styles.mapOverlay
                    }
                  >
                    <Ionicons
                      name="map-outline"
                      size={35}
                      color="#64748B"
                    />

                    <Text
                      style={
                        styles.mapOverlayText
                      }
                    >
                      Live location will
                      appear here
                    </Text>
                  </View>
                )}
            </View>
          </View>

          {/* ========================================
              ORDER STATUS TIMELINE
          ======================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Order status
            </Text>

            {/* ORDER PLACED */}

            <View
              style={
                styles.timelineRow
              }
            >
              <View
                style={
                  styles.timelineIndicator
                }
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted(0) &&
                      styles.completedCircle,
                  ]}
                >
                  {isCompleted(0) && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.timelineLine,
                    isCompleted(1) &&
                      styles.completedLine,
                  ]}
                />
              </View>

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={
                    styles.timelineTitle
                  }
                >
                  Order placed
                </Text>

                <Text
                  style={
                    styles.timelineSubtitle
                  }
                >
                  Your order has been received
                </Text>
              </View>
            </View>

            {/* PREPARING */}

            <View
              style={
                styles.timelineRow
              }
            >
              <View
                style={
                  styles.timelineIndicator
                }
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted(1) &&
                      styles.completedCircle,
                  ]}
                >
                  {isCompleted(1) && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.timelineLine,
                    isCompleted(2) &&
                      styles.completedLine,
                  ]}
                />
              </View>

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={
                    styles.timelineTitle
                  }
                >
                  Preparing
                </Text>

                <Text
                  style={
                    styles.timelineSubtitle
                  }
                >
                  Restaurant is preparing your food
                </Text>
              </View>
            </View>

            {/* DELIVERY PARTNER */}

            <View
              style={
                styles.timelineRow
              }
            >
              <View
                style={
                  styles.timelineIndicator
                }
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted(2) &&
                      styles.completedCircle,
                  ]}
                >
                  {isCompleted(2) && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.timelineLine,
                    isCompleted(3) &&
                      styles.completedLine,
                  ]}
                />
              </View>

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={
                    styles.timelineTitle
                  }
                >
                  Delivery partner assigned
                </Text>

                <Text
                  style={
                    styles.timelineSubtitle
                  }
                >
                  {deliveryPartner
                    ? `${deliveryPartner.name} is delivering your order`
                    : "Finding a delivery partner"}
                </Text>
              </View>
            </View>

            {/* OUT FOR DELIVERY */}

            <View
              style={
                styles.timelineRow
              }
            >
              <View
                style={
                  styles.timelineIndicator
                }
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted(3) &&
                      styles.completedCircle,
                  ]}
                >
                  {isCompleted(3) && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>

                <View
                  style={[
                    styles.timelineLine,
                    isCompleted(4) &&
                      styles.completedLine,
                  ]}
                />
              </View>

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={
                    styles.timelineTitle
                  }
                >
                  Out for delivery
                </Text>

                <Text
                  style={
                    styles.timelineSubtitle
                  }
                >
                  Your order is on the way
                </Text>
              </View>
            </View>

            {/* DELIVERED */}

            <View
              style={[
                styles.timelineRow,
                {
                  minHeight: 45,
                },
              ]}
            >
              <View
                style={
                  styles.timelineIndicator
                }
              >
                <View
                  style={[
                    styles.timelineCircle,
                    isCompleted(4) &&
                      styles.completedCircle,
                  ]}
                >
                  {isCompleted(4) && (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color="#FFFFFF"
                    />
                  )}
                </View>
              </View>

              <View
                style={
                  styles.timelineContent
                }
              >
                <Text
                  style={
                    styles.timelineTitle
                  }
                >
                  Delivered
                </Text>

                <Text
                  style={
                    styles.timelineSubtitle
                  }
                >
                  Enjoy your food!
                </Text>
              </View>
            </View>
          </View>

          {/* ========================================
              DELIVERY PARTNER
          ======================================== */}

          {deliveryPartner && (
            <View
              style={
                styles.card
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Your delivery partner
              </Text>

              <View
                style={
                  styles.partnerRow
                }
              >
                <View
                  style={
                    styles.partnerAvatar
                  }
                >
                  <Ionicons
                    name="person"
                    size={28}
                    color="#F5B82E"
                  />
                </View>

                <View
                  style={
                    styles.partnerInfo
                  }
                >
                  <Text
                    style={
                      styles.partnerName
                    }
                  >
                    {deliveryPartner.name}
                  </Text>

                  <Text
                    style={
                      styles.partnerVehicle
                    }
                  >
                    {deliveryPartner.vehicleType ||
                      "Delivery Partner"}
                  </Text>

                  <View
                    style={
                      styles.ratingRow
                    }
                  >
                    <Ionicons
                      name="star"
                      size={15}
                      color="#F5B82E"
                    />

                    <Text
                      style={
                        styles.ratingText
                      }
                    >
                      4.8
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={
                    styles.callButton
                  }
                  onPress={
                    callDeliveryPartner
                  }
                >
                  <Ionicons
                    name="call"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.chatButton
                  }
                  onPress={() =>
                    Alert.alert(
                      "Chat",
                      "Live chat screen will be connected next."
                    )
                  }
                >
                  <Ionicons
                    name="chatbubble"
                    size={20}
                    color="#0B0F14"
                  />
                </TouchableOpacity>
              </View>

              {/* LIVE LOCATION STATUS */}

              <View
                style={
                  styles.partnerLiveStatus
                }
              >
                <View
                  style={[
                    styles.partnerLiveDot,
                    {
                      backgroundColor:
                        deliveryPartnerLocation
                          ? "#4CAF50"
                          : "#F5B82E",
                    },
                  ]}
                />

                <Text
                  style={
                    styles.partnerLiveText
                  }
                >
                  {deliveryPartnerLocation
                    ? "Delivery partner location is live"
                    : "Waiting for live location"}
                </Text>
              </View>
            </View>
          )}

          {/* ========================================
              DELIVERY OTP
          ======================================== */}

          {deliveryOtp &&
            orderStatus !==
              "Delivered" && (
              <View
                style={
                  styles.otpCard
                }
              >
                <View
                  style={
                    styles.otpIcon
                  }
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={26}
                    color="#0B0F14"
                  />
                </View>

                <View
                  style={
                    styles.otpContent
                  }
                >
                  <Text
                    style={
                      styles.otpTitle
                    }
                  >
                    Delivery OTP
                  </Text>

                  <Text
                    style={
                      styles.otpSubtitle
                    }
                  >
                    Share this OTP with the delivery partner when your order arrives.
                  </Text>

                  <Text
                    style={
                      styles.otpValue
                    }
                  >
                    {deliveryOtp}
                  </Text>
                </View>
              </View>
            )}

          {/* ========================================
              RESTAURANT
          ======================================== */}

          {restaurant && (
            <View
              style={
                styles.card
              }
            >
              <View
                style={
                  styles.restaurantHeader
                }
              >
                <View
                  style={
                    styles.restaurantIcon
                  }
                >
                  <Ionicons
                    name="restaurant"
                    size={23}
                    color="#F5B82E"
                  />
                </View>

                <View
                  style={
                    styles.restaurantInfo
                  }
                >
                  <Text
                    style={
                      styles.restaurantName
                    }
                  >
                    {restaurant.name}
                  </Text>

                  <Text
                    style={
                      styles.restaurantAddress
                    }
                  >
                    {restaurant.address ||
                      "Restaurant address unavailable"}
                  </Text>
                </View>

                {restaurant.phone && (
                  <TouchableOpacity
                    style={
                      styles.smallCallButton
                    }
                    onPress={
                      callRestaurant
                    }
                  >
                    <Ionicons
                      name="call-outline"
                      size={19}
                      color="#0B0F14"
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* ========================================
              DELIVERY ADDRESS
          ======================================== */}

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Delivering to
            </Text>

            <TouchableOpacity
              style={
                styles.addressRow
              }
              onPress={() =>
                openMaps(
                  deliveryAddress
                )
              }
            >
              <View
                style={
                  styles.addressIcon
                }
              >
                <Ionicons
                  name="location"
                  size={21}
                  color="#F5B82E"
                />
              </View>

              <View
                style={
                  styles.addressContent
                }
              >
                <Text
                  style={
                    styles.addressTitle
                  }
                >
                  Delivery address
                </Text>

                <Text
                  style={
                    styles.addressValue
                  }
                >
                  {deliveryAddress ||
                    "Address unavailable"}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* ========================================
              ORDER ITEMS
          ======================================== */}

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.itemsHeader
              }
            >
              <Text
                style={
                  styles.sectionTitle
                }
              >
                Your order
              </Text>

              {orderStatus !==
                "Delivered" && (
                <TouchableOpacity
                  onPress={() =>
                    router.back()
                  }
                >
                  <Text
                    style={
                      styles.addMoreText
                    }
                  >
                    Add more
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {items.length === 0 ? (
              <Text
                style={
                  styles.noItemsText
                }
              >
                No items found.
              </Text>
            ) : (
              items.map(
                (
                  item,
                  index
                ) => (
                  <View
                    key={`${item.foodItemId || item.name}-${index}`}
                    style={
                      styles.itemRow
                    }
                  >
                    <View
                      style={
                        styles.quantityBox
                      }
                    >
                      <Text
                        style={
                          styles.quantityText
                        }
                      >
                        {item.quantity}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.itemName
                      }
                    >
                      {item.name}
                    </Text>

                    <Text
                      style={
                        styles.itemPrice
                      }
                    >
                      ₹
                      {(
                        item.price *
                        item.quantity
                      ).toFixed(2)}
                    </Text>
                  </View>
                )
              )
            )}

            <View
              style={
                styles.divider
              }
            />

            {/* TOTAL */}

            <View
              style={
                styles.totalRow
              }
            >
              <Text
                style={
                  styles.totalLabel
                }
              >
                Total
              </Text>

              <Text
                style={
                  styles.totalValue
                }
              >
                ₹
                {Number(
                  totalAmount
                ).toFixed(2)}
              </Text>
            </View>

            {/* PAYMENT */}

            <View
              style={
                styles.paymentRow
              }
            >
              <View
                style={
                  styles.paymentLeft
                }
              >
                <Ionicons
                  name={
                    paymentMethod
                      ?.toLowerCase()
                      .includes(
                        "cash"
                      )
                      ? "cash-outline"
                      : "card-outline"
                  }
                  size={18}
                  color="#64748B"
                />

                <Text
                  style={
                    styles.paymentText
                  }
                >
                  {paymentMethod ||
                    "Payment"}
                </Text>
              </View>

              <Text
                style={[
                  styles.paymentStatus,
                  {
                    color:
                      paymentStatus ===
                      "Paid"
                        ? "#4CAF50"
                        : "#F5B82E",
                  },
                ]}
              >
                {paymentStatus ||
                  "Pending"}
              </Text>
            </View>
          </View>

          {/* ========================================
              HELP
          ======================================== */}

          <TouchableOpacity
            style={
              styles.helpCard
            }
            onPress={() =>
              Alert.alert(
                "Need Help?",
                "Support and order chat will be connected here."
              )
            }
          >
            <View
              style={
                styles.helpIcon
              }
            >
              <Ionicons
                name="help-circle-outline"
                size={25}
                color="#F5B82E"
              />
            </View>

            <View
              style={
                styles.helpContent
              }
            >
              <Text
                style={
                  styles.helpTitle
                }
              >
                Need help?
              </Text>

              <Text
                style={
                  styles.helpSubtitle
                }
              >
                Get help with your order
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#94A3B8"
            />
          </TouchableOpacity>

          {/* ========================================
              SOCKET INFO
          ======================================== */}

          <View
            style={
              styles.connectionStatus
            }
          >
            <View
              style={[
                styles.connectionDot,
                {
                  backgroundColor:
                    isSocketConnected
                      ? "#4CAF50"
                      : "#F5B82E",
                },
              ]}
            />

            <Text
              style={
                styles.connectionText
              }
            >
              {isSocketConnected
                ? "Live tracking connected"
                : "Connecting to live tracking..."}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // ===================================================
  // MAIN
  // ===================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 45,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyContainer: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
    padding: 25,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 15,
    marginBottom: 20,
  },

  primaryButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 13,
    paddingHorizontal: 30,
    paddingVertical: 14,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B0F14",
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 70,
    backgroundColor: "#081A33",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  // ===================================================
  // LIVE STATUS
  // ===================================================

  liveStatusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  liveIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
  },

  liveStatusContent: {
    flex: 1,
    marginLeft: 13,
  },

  liveStatusTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  liveStatusSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 17,
  },

  liveIndicator: {
    alignItems: "center",
    marginLeft: 8,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },

  liveText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
  },

  // ===================================================
  // MAP
  // ===================================================

  mapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  mapHeader: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  mapTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  mapSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  mapIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF6D8",
    alignItems: "center",
    justifyContent: "center",
  },

  mapContainer: {
    height: 250,
    backgroundColor: "#E2E6EB",
    position: "relative",
  },

  mapOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(245,247,250,0.88)",
  },

  mapOverlayText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 8,
  },

  // ===================================================
  // CARD
  // ===================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 15,
  },

  // ===================================================
  // TIMELINE
  // ===================================================

  timelineRow: {
    flexDirection: "row",
    minHeight: 66,
  },

  timelineIndicator: {
    width: 28,
    alignItems: "center",
  },

  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  completedCircle: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },

  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: "#E2E8F0",
    marginTop: 3,
    marginBottom: 2,
  },

  completedLine: {
    backgroundColor: "#4CAF50",
  },

  timelineContent: {
    flex: 1,
    paddingLeft: 10,
    paddingBottom: 12,
  },

  timelineTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0F14",
  },

  timelineSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },

  // ===================================================
  // PARTNER
  // ===================================================

  partnerRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  partnerAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF6D8",
    alignItems: "center",
    justifyContent: "center",
  },

  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  partnerName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  partnerVehicle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  ratingText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 4,
  },

  callButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  chatButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 7,
  },

  partnerLiveStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F6",
  },

  partnerLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  partnerLiveText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
  },

  // ===================================================
  // OTP
  // ===================================================

  otpCard: {
    backgroundColor: "#F5B82E",
    borderRadius: 18,
    padding: 17,
    marginBottom: 14,
    flexDirection: "row",
  },

  otpIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  otpContent: {
    flex: 1,
    marginLeft: 12,
  },

  otpTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  otpSubtitle: {
    fontSize: 11,
    color: "#334155",
    marginTop: 3,
    lineHeight: 16,
  },

  otpValue: {
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 5,
    color: "#0B0F14",
    marginTop: 8,
  },

  // ===================================================
  // RESTAURANT
  // ===================================================

  restaurantHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  restaurantIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF6D8",
    alignItems: "center",
    justifyContent: "center",
  },

  restaurantInfo: {
    flex: 1,
    marginLeft: 12,
  },

  restaurantName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0B0F14",
  },

  restaurantAddress: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },

  smallCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
  },

  // ===================================================
  // ADDRESS
  // ===================================================

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  addressIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#FFF6D8",
    alignItems: "center",
    justifyContent: "center",
  },

  addressContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },

  addressTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B0F14",
  },

  addressValue: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
    lineHeight: 17,
  },

  // ===================================================
  // ITEMS
  // ===================================================

  itemsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  addMoreText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F5B82E",
  },

  noItemsText: {
    fontSize: 13,
    color: "#64748B",
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 9,
  },

  quantityBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#475569",
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    fontWeight: "600",
    marginLeft: 10,
  },

  itemPrice: {
    fontSize: 14,
    color: "#0B0F14",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 10,
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0B0F14",
  },

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },

  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  paymentText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 7,
  },

  paymentStatus: {
    fontSize: 12,
    fontWeight: "800",
  },

  // ===================================================
  // HELP
  // ===================================================

  helpCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  helpIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#FFF6D8",
    alignItems: "center",
    justifyContent: "center",
  },

  helpContent: {
    flex: 1,
    marginLeft: 12,
  },

  helpTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B0F14",
  },

  helpSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },

  // ===================================================
  // CONNECTION
  // ===================================================

  connectionStatus: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 15,
  },

  connectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  connectionText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
});

