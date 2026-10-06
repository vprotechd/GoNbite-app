
import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  View,
} from "react-native";
import {
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { io, Socket } from "socket.io-client";

import api from "../../../src/services/api";
import PlatformMap from "../../components/PlatformMap";

/*
 * =========================================================
 * SOCKET URL
 * =========================================================
 */

const SOCKET_URL = "http://192.168.1.20:5000";

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

interface LocationCoords {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

interface RestaurantInfo {
  _id?: string;
  id?: string;
  restaurantName?: string;
  name?: string;
  address?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

interface DeliveryPartnerInfo {
  id?: string;
  name?: string;
  phone?: string;
  vehicleType?: string;
}

interface ActiveOrder {
  _id: string;
  status: string;

  deliveryAddress?: string;

  restaurantId?: RestaurantInfo;

  deliveryPartnerLocation?:
    | LocationCoords
    | null;

  customerLocation?:
    | LocationCoords
    | null;
}

interface DeliveryDashboardResponse {
  success?: boolean;

  activeOrder?: ActiveOrder | null;
}

interface TrackOrderResponse {
  success?: boolean;

  order?: {
    id?: string;
    status?: string;
    customerName?: string;
    customerPhone?: string;
    deliveryAddress?: string;
  };

  restaurant?: {
    id?: string;
    name?: string;
    address?: string;
    phone?: string;
    latitude?: number;
    longitude?: number;
  } | null;

  customerLocation?:
    | LocationCoords
    | null;

  restaurantLocation?:
    | LocationCoords
    | null;

  deliveryPartner?:
    | DeliveryPartnerInfo
    | null;

  deliveryPartnerLocation?:
    | LocationCoords
    | null;
}

interface RouteResponse {
  success?: boolean;

  routeCoordinates?: LocationCoords[];

  encodedPolyline?: string;

  distance?: number;

  duration?: number;
}

/*
 * =========================================================
 * POLYLINE DECODER
 * =========================================================
 */

function decodePolyline(
  encoded: string
): LocationCoords[] {
  const points: LocationCoords[] = [];

  let index = 0;
  let latitude = 0;
  let longitude = 0;

  try {
    while (
      index < encoded.length
    ) {
      let shift = 0;
      let result = 0;
      let byte: number;

      do {
        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) <<
          shift;

        shift += 5;
      } while (
        byte >= 0x20 &&
        index < encoded.length
      );

      const deltaLatitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      latitude +=
        deltaLatitude;

      shift = 0;
      result = 0;

      do {
        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) <<
          shift;

        shift += 5;
      } while (
        byte >= 0x20 &&
        index < encoded.length
      );

      const deltaLongitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      longitude +=
        deltaLongitude;

      points.push({
        latitude:
          latitude / 1e5,

        longitude:
          longitude / 1e5,
      });
    }
  } catch (error) {
    console.error(
      "❌ POLYLINE DECODE ERROR:",
      error
    );
  }

  return points;
}

/*
 * =========================================================
 * MAIN SCREEN
 * =========================================================
 */

export default function ActiveOrderScreen() {
  const [loading, setLoading] =
    useState(true);

  const [delivering, setDelivering] =
    useState(false);

  const [orderId, setOrderId] =
    useState<string | null>(null);

  const [orderStatus, setOrderStatus] =
    useState<string>("");

  const [
    deliveryAddress,
    setDeliveryAddress,
  ] = useState<string>("");

  const [
    restaurantName,
    setRestaurantName,
  ] = useState<string>("");

  const [
    restaurantAddress,
    setRestaurantAddress,
  ] = useState<string>("");

  /*
   * =========================================================
   * RESTAURANT PHONE
   * =========================================================
   */

  const [
    restaurantPhone,
    setRestaurantPhone,
  ] = useState<string>("");

  /*
   * =========================================================
   * DELIVERY PARTNER PROFILE
   * =========================================================
   */

  const [
    deliveryPartner,
    setDeliveryPartner,
  ] =
    useState<DeliveryPartnerInfo | null>(
      null
    );

  const [
    restaurantLocation,
    setRestaurantLocation,
  ] = useState<LocationCoords | null>(
    null
  );

  /*
   * Delivery partner live location
   */

  const [
    deliveryPartnerLocation,
    setDeliveryPartnerLocation,
  ] =
    useState<LocationCoords | null>(
      null
    );

  /*
   * Customer fixed/saved location
   */

  const [
    customerLocation,
    setCustomerLocation,
  ] = useState<LocationCoords | null>(
    null
  );

  /*
   * Customer's own current live GPS
   */

  const [
    customerCurrentLocation,
    setCustomerCurrentLocation,
  ] =
    useState<LocationCoords | null>(
      null
    );

  /*
   * =====================================================
   * ROAD ROUTE
   * =====================================================
   */

  const [
    routeCoordinates,
    setRouteCoordinates,
  ] = useState<LocationCoords[]>(
    []
  );

  const [
    routeLoading,
    setRouteLoading,
  ] = useState(false);

  const [
    routeError,
    setRouteError,
  ] = useState<string | null>(
    null
  );

  /*
   * Socket
   */

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  const socketRef =
    useRef<Socket | null>(null);

  /*
   * Customer location watcher
   */

  const locationWatchRef =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const webWatchIdRef =
    useRef<number | null>(null);

  /*
   * Prevent multiple GPS watchers
   */

  const trackingStartedRef =
    useRef(false);

  /*
   * =========================================================
   * CALL PHONE
   * =========================================================
   */

  const callPhoneNumber = async (
    phone: string,
    personName: string
  ) => {
    try {
      if (!phone) {
        Alert.alert(
          "Phone number unavailable",
          `${personName}'s phone number is not available.`
        );

        return;
      }

      /*
       * Remove spaces and common
       * formatting characters.
       */

      const cleanPhone =
        phone.replace(
          /[\s()-]/g,
          ""
        );

      const phoneUrl =
        `tel:${cleanPhone}`;

      const supported =
        await Linking.canOpenURL(
          phoneUrl
        );

      if (!supported) {
        Alert.alert(
          "Cannot make call",
          "Phone calling is not available on this device."
        );

        return;
      }

      await Linking.openURL(
        phoneUrl
      );
    } catch (error) {
      console.error(
        "❌ CALL PHONE ERROR:",
        error
      );

      Alert.alert(
        "Call failed",
        `Unable to call ${personName}.`
      );
    }
  };

  /*
   * =========================================================
   * FETCH DETAILED TRACKING
   * =========================================================
   *
   * Gets restaurant and delivery partner
   * profile information from backend.
   */

  const fetchDetailedTracking =
    async (
      currentOrderId: string
    ) => {
      try {
        console.log(
          "📍 FETCHING DETAILED TRACKING:",
          currentOrderId
        );

        const response =
          await api.get<TrackOrderResponse>(
            `/orders/${currentOrderId}/track`
          );

        const data =
          response.data;

        console.log(
          "📍 DETAILED TRACKING RESPONSE:",
          data
        );

        /*
         * =================================================
         * ORDER
         * =================================================
         */

        if (
          data?.order?.status
        ) {
          setOrderStatus(
            data.order.status
          );
        }

        if (
          data?.order?.deliveryAddress
        ) {
          setDeliveryAddress(
            data.order.deliveryAddress
          );
        }

        /*
         * =================================================
         * RESTAURANT PROFILE
         * =================================================
         */

        if (data?.restaurant) {
          setRestaurantName(
            data.restaurant.name ||
              "Restaurant"
          );

          setRestaurantAddress(
            data.restaurant.address ||
              ""
          );

          setRestaurantPhone(
            data.restaurant.phone ||
              ""
          );

          if (
            typeof data.restaurant
              .latitude ===
              "number" &&
            typeof data.restaurant
              .longitude ===
              "number"
          ) {
            setRestaurantLocation({
              latitude:
                data.restaurant.latitude,

              longitude:
                data.restaurant.longitude,
            });
          }
        } else {
          setRestaurantName(
            "Restaurant"
          );

          setRestaurantAddress(
            ""
          );

          setRestaurantPhone(
            ""
          );

          setRestaurantLocation(
            null
          );
        }

        /*
         * =================================================
         * DELIVERY PARTNER PROFILE
         * =================================================
         */

        if (
          data?.deliveryPartner
        ) {
          console.log(
            "🛵 DELIVERY PARTNER PROFILE:",
            data.deliveryPartner
          );

          setDeliveryPartner(
            data.deliveryPartner
          );
        } else {
          console.log(
            "ℹ️ DELIVERY PARTNER PROFILE NOT AVAILABLE"
          );

          setDeliveryPartner(
            null
          );
        }

        /*
         * =================================================
         * DELIVERY PARTNER LOCATION
         * =================================================
         */

        if (
          data?.deliveryPartnerLocation &&
          typeof data
            .deliveryPartnerLocation
            .latitude === "number" &&
          typeof data
            .deliveryPartnerLocation
            .longitude === "number"
        ) {
          setDeliveryPartnerLocation(
            data.deliveryPartnerLocation
          );
        }

        /*
         * =================================================
         * CUSTOMER LOCATION
         * =================================================
         */

        if (
          data?.customerLocation &&
          typeof data
            .customerLocation
            .latitude === "number" &&
          typeof data
            .customerLocation
            .longitude === "number"
        ) {
          setCustomerLocation(
            data.customerLocation
          );
        }

        /*
         * =================================================
         * RESTAURANT LOCATION
         * =================================================
         */

        if (
          data?.restaurantLocation &&
          typeof data
            .restaurantLocation
            .latitude === "number" &&
          typeof data
            .restaurantLocation
            .longitude === "number"
        ) {
          setRestaurantLocation(
            data.restaurantLocation
          );
        }
      } catch (error: any) {
        console.error(
          "❌ DETAILED TRACKING ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      }
    };

  /*
   * =========================================================
   * FETCH ACTIVE ORDER
   * =========================================================
   */

  const fetchOrderTracking =
    async () => {
      try {
        setLoading(true);

        console.log(
          "📦 Fetching customer active order..."
        );

        const response =
          await api.get<DeliveryDashboardResponse>(
            "/delivery/dashboard"
          );

        const data =
          response.data;

        console.log(
          "📦 ACTIVE ORDER RESPONSE:",
          data
        );

        const activeOrder =
          data?.activeOrder;

        if (!activeOrder) {
          console.log(
            "ℹ️ No active order"
          );

          setOrderId(null);
          setOrderStatus("");

          setDeliveryPartnerLocation(
            null
          );

          setCustomerLocation(null);

          setRouteCoordinates([]);

          setDeliveryPartner(null);

          setRestaurantPhone("");

          return;
        }

        /*
         * ORDER ID
         */

        setOrderId(
          activeOrder._id
        );

        /*
         * STATUS
         */

        setOrderStatus(
          activeOrder.status
        );

        /*
         * DELIVERY ADDRESS
         */

        setDeliveryAddress(
          activeOrder.deliveryAddress ||
            "Customer location"
        );

        /*
         * =================================================
         * RESTAURANT
         * =================================================
         */

        const restaurant =
          activeOrder.restaurantId;

        if (restaurant) {
          setRestaurantName(
            restaurant.restaurantName ||
              restaurant.name ||
              "Restaurant"
          );

          setRestaurantAddress(
            restaurant.address || ""
          );

          /*
           * Existing dashboard data may
           * already contain phone.
           */

          setRestaurantPhone(
            restaurant.phone || ""
          );

          if (
            typeof restaurant.latitude ===
              "number" &&
            typeof restaurant.longitude ===
              "number"
          ) {
            setRestaurantLocation({
              latitude:
                restaurant.latitude,

              longitude:
                restaurant.longitude,
            });
          } else {
            console.log(
              "⚠️ Restaurant coordinates unavailable"
            );

            setRestaurantLocation(
              null
            );
          }
        } else {
          setRestaurantName(
            "Restaurant"
          );

          setRestaurantAddress(
            ""
          );

          setRestaurantPhone(
            ""
          );

          setRestaurantLocation(
            null
          );
        }

        /*
         * =================================================
         * DELIVERY PARTNER LOCATION
         * =================================================
         */

        if (
          activeOrder.deliveryPartnerLocation &&
          typeof activeOrder
            .deliveryPartnerLocation
            .latitude === "number" &&
          typeof activeOrder
            .deliveryPartnerLocation
            .longitude === "number"
        ) {
          console.log(
            "📍 SAVED DELIVERY PARTNER LOCATION:",
            activeOrder.deliveryPartnerLocation
          );

          setDeliveryPartnerLocation(
            activeOrder.deliveryPartnerLocation
          );
        }

        /*
         * =================================================
         * CUSTOMER LOCATION
         * =================================================
         */

        if (
          activeOrder.customerLocation &&
          typeof activeOrder
            .customerLocation
            .latitude === "number" &&
          typeof activeOrder
            .customerLocation
            .longitude === "number"
        ) {
          console.log(
            "👤 SAVED CUSTOMER LOCATION:",
            activeOrder.customerLocation
          );

          setCustomerLocation(
            activeOrder.customerLocation
          );
        }

        /*
         * =================================================
         * FETCH RESTAURANT + DELIVERY PARTNER PROFILE
         * =================================================
         */

        await fetchDetailedTracking(
          activeOrder._id
        );
      } catch (error: any) {
        console.error(
          "❌ FETCH ACTIVE ORDER ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      } finally {
        setLoading(false);
      }
    };

  /*
   * =========================================================
   * LOAD ROAD ROUTE
   * =========================================================
   */

  const loadRoute =
    async () => {
      if (!orderId) {
        return;
      }

      try {
        setRouteLoading(true);
        setRouteError(null);

        console.log(
          "🛣️ FETCHING ROAD ROUTE:",
          orderId
        );

        const response =
          await api.get<RouteResponse>(
            `/orders/${orderId}/route`
          );

        const data =
          response.data;

        console.log(
          "🛣️ ROUTE RESPONSE:",
          data
        );

        /*
         * OPTION 1
         */

        if (
          Array.isArray(
            data?.routeCoordinates
          ) &&
          data.routeCoordinates.length >
            0
        ) {
          const validCoordinates =
            data.routeCoordinates
              .filter(
                (point) =>
                  point &&
                  typeof point.latitude ===
                    "number" &&
                  typeof point.longitude ===
                    "number" &&
                  Number.isFinite(
                    point.latitude
                  ) &&
                  Number.isFinite(
                    point.longitude
                  )
              );

          if (
            validCoordinates.length >= 2
          ) {
            console.log(
              "🛣️ ROAD ROUTE LOADED:",
              validCoordinates.length,
              "points"
            );

            setRouteCoordinates(
              validCoordinates
            );

            return;
          }
        }

        /*
         * OPTION 2
         */

        if (
          typeof data?.encodedPolyline ===
            "string" &&
          data.encodedPolyline.length >
            0
        ) {
          console.log(
            "🛣️ DECODING GOOGLE POLYLINE..."
          );

          const decodedPoints =
            decodePolyline(
              data.encodedPolyline
            );

          if (
            decodedPoints.length >= 2
          ) {
            console.log(
              "🛣️ DECODED ROAD ROUTE:",
              decodedPoints.length,
              "points"
            );

            setRouteCoordinates(
              decodedPoints
            );

            return;
          }
        }

        console.log(
          "⚠️ Backend returned no usable road route"
        );

        setRouteCoordinates([]);
      } catch (error: any) {
        console.error(
          "❌ ROUTE LOAD ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        setRouteError(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Unable to load route"
        );
      } finally {
        setRouteLoading(false);
      }
    };

  /*
   * =========================================================
   * ROUTE AUTO REFRESH
   * =========================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    console.log(
      "🔄 STARTING ROUTE REFRESH:",
      orderId,
      orderStatus
    );

    loadRoute();

    const routeInterval =
      setInterval(() => {
        loadRoute();
      }, 5000);

    return () => {
      console.log(
        "🛑 STOPPING ROUTE REFRESH"
      );

      clearInterval(
        routeInterval
      );
    };
  }, [
    orderId,
    orderStatus,
  ]);

  /*
   * =========================================================
   * CUSTOMER CURRENT LOCATION
   * =========================================================
   */

  const startCustomerLiveLocation =
    async () => {
      try {
        /*
         * WEB
         */

        if (Platform.OS === "web") {
          if (
            !navigator.geolocation
          ) {
            console.log(
              "❌ Browser geolocation unavailable"
            );

            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location: LocationCoords =
                {
                  latitude:
                    position.coords
                      .latitude,

                  longitude:
                    position.coords
                      .longitude,

                  updatedAt:
                    new Date().toISOString(),
                };

              console.log(
                "👤 INITIAL CUSTOMER WEB LOCATION:",
                location
              );

              setCustomerCurrentLocation(
                location
              );

              sendCustomerLocation(
                location
              );
            },
            (error) => {
              console.error(
                "❌ CUSTOMER WEB LOCATION ERROR:",
                error
              );
            },
            {
              enableHighAccuracy:
                true,

              maximumAge: 3000,

              timeout: 15000,
            }
          );

          const watchId =
            navigator.geolocation.watchPosition(
              (position) => {
                const location: LocationCoords =
                  {
                    latitude:
                      position.coords
                        .latitude,

                    longitude:
                      position.coords
                        .longitude,

                    updatedAt:
                      new Date().toISOString(),
                  };

                console.log(
                  "👤 LIVE CUSTOMER WEB LOCATION:",
                  location
                );

                setCustomerCurrentLocation(
                  location
                );

                sendCustomerLocation(
                  location
                );
              },
              (error) => {
                console.error(
                  "❌ CUSTOMER WEB WATCH ERROR:",
                  error
                );
              },
              {
                enableHighAccuracy:
                  true,

                maximumAge: 3000,

                timeout: 15000,
              }
            );

          webWatchIdRef.current =
            watchId;

          return;
        }

        /*
         * MOBILE
         */

        const permission =
          await Location.requestForegroundPermissionsAsync();

        if (
          permission.status !==
          Location.PermissionStatus.GRANTED
        ) {
          console.log(
            "❌ CUSTOMER LOCATION PERMISSION DENIED"
          );

          return;
        }

        /*
         * Initial location
         */

        const initial =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        const initialLocation: LocationCoords =
          {
            latitude:
              initial.coords.latitude,

            longitude:
              initial.coords.longitude,

            updatedAt:
              new Date().toISOString(),
          };

        console.log(
          "👤 INITIAL CUSTOMER LOCATION:",
          initialLocation
        );

        setCustomerCurrentLocation(
          initialLocation
        );

        sendCustomerLocation(
          initialLocation
        );

        /*
         * Continuous tracking
         */

        locationWatchRef.current =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,

              timeInterval: 5000,

              distanceInterval: 10,
            },
            (location) => {
              const liveLocation: LocationCoords =
                {
                  latitude:
                    location.coords
                      .latitude,

                  longitude:
                    location.coords
                      .longitude,

                  updatedAt:
                    new Date().toISOString(),
                };

              console.log(
                "👤 LIVE CUSTOMER LOCATION:",
                liveLocation
              );

              setCustomerCurrentLocation(
                liveLocation
              );

              sendCustomerLocation(
                liveLocation
              );
            }
          );
      } catch (error) {
        console.error(
          "❌ START CUSTOMER LOCATION ERROR:",
          error
        );
      }
    };

  /*
   * =========================================================
   * SEND CUSTOMER LOCATION
   * =========================================================
   */

  const sendCustomerLocation =
    (
      location: LocationCoords
    ) => {
      const socket =
        socketRef.current;

      if (
        !socket ||
        !socket.connected ||
        !orderId
      ) {
        return;
      }

      console.log(
        "👤 SENDING CUSTOMER LOCATION:",
        location
      );

      socket.emit(
        "customerLocationUpdate",
        {
          orderId,

          latitude:
            location.latitude,

          longitude:
            location.longitude,

          updatedAt:
            location.updatedAt ||
            new Date().toISOString(),
        }
      );
    };

  /*
   * =========================================================
   * STOP CUSTOMER LOCATION
   * =========================================================
   */

  const stopCustomerLiveLocation =
    () => {
      try {
        if (
          locationWatchRef.current
        ) {
          locationWatchRef.current.remove();

          locationWatchRef.current =
            null;
        }

        if (
          webWatchIdRef.current !==
            null &&
          Platform.OS === "web"
        ) {
          navigator.geolocation.clearWatch(
            webWatchIdRef.current
          );

          webWatchIdRef.current =
            null;
        }

        trackingStartedRef.current =
          false;

        console.log(
          "🛑 CUSTOMER LOCATION TRACKING STOPPED"
        );
      } catch (error) {
        console.error(
          "❌ STOP CUSTOMER LOCATION ERROR:",
          error
        );
      }
    };

  /*
   * =========================================================
   * SOCKET SETUP
   * =========================================================
   */

  const connectSocket =
    async (
      currentOrderId: string
    ) => {
      try {
        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (!token) {
          console.log(
            "❌ No customer token found"
          );

          return;
        }

        console.log(
          "🔌 CUSTOMER SOCKET URL:",
          SOCKET_URL
        );

        /*
         * Cleanup existing socket
         */

        if (
          socketRef.current
        ) {
          socketRef.current.disconnect();

          socketRef.current =
            null;
        }

        const socket =
          io(SOCKET_URL, {
            transports: [
              "polling",
              "websocket",
            ],

            upgrade: true,

            reconnection: true,

            reconnectionAttempts:
              Infinity,

            reconnectionDelay: 1000,

            reconnectionDelayMax:
              5000,

            timeout: 20000,

            forceNew: true,

            auth: {
              token,
            },
          });

        socketRef.current =
          socket;

        /*
         * CONNECT
         */

        socket.on(
          "connect",
          () => {
            console.log(
              "🟢 CUSTOMER SOCKET CONNECTED:",
              socket.id
            );

            setSocketConnected(
              true
            );

            console.log(
              "📦 JOINING ORDER ROOM:",
              currentOrderId
            );

            socket.emit(
              "joinOrder",
              currentOrderId
            );

            if (
              customerCurrentLocation
            ) {
              socket.emit(
                "customerLocationUpdate",
                {
                  orderId:
                    currentOrderId,

                  latitude:
                    customerCurrentLocation.latitude,

                  longitude:
                    customerCurrentLocation.longitude,

                  updatedAt:
                    new Date().toISOString(),
                }
              );
            }
          }
        );

        /*
         * DISCONNECT
         */

        socket.on(
          "disconnect",
          (reason) => {
            console.log(
              "🔴 CUSTOMER SOCKET DISCONNECTED:",
              reason
            );

            setSocketConnected(
              false
            );
          }
        );

        /*
         * CONNECT ERROR
         */

        socket.on(
          "connect_error",
          (error) => {
            console.error(
              "❌ CUSTOMER SOCKET ERROR:",
              error.message
            );

            setSocketConnected(
              false
            );
          }
        );

        /*
         * LIVE DELIVERY PARTNER LOCATION
         */

        socket.on(
          "deliveryLocationUpdate",
          (data) => {
            console.log(
              "📍 LIVE DELIVERY PARTNER LOCATION:",
              data
            );

            if (
              data?.orderId ===
                currentOrderId &&
              typeof data.latitude ===
                "number" &&
              typeof data.longitude ===
                "number"
            ) {
              setDeliveryPartnerLocation(
                {
                  latitude:
                    data.latitude,

                  longitude:
                    data.longitude,

                  updatedAt:
                    data.updatedAt ||
                    new Date().toISOString(),
                }
              );
            }
          }
        );

        /*
         * LIVE CUSTOMER LOCATION
         */

        socket.on(
          "customerLocationUpdate",
          (data) => {
            console.log(
              "👤 LIVE CUSTOMER LOCATION:",
              data
            );

            if (
              data?.orderId ===
                currentOrderId &&
              typeof data.latitude ===
                "number" &&
              typeof data.longitude ===
                "number"
            ) {
              setCustomerCurrentLocation(
                {
                  latitude:
                    data.latitude,

                  longitude:
                    data.longitude,

                  updatedAt:
                    data.updatedAt ||
                    new Date().toISOString(),
                }
              );
            }
          }
        );
      } catch (error) {
        console.error(
          "❌ CONNECT CUSTOMER SOCKET ERROR:",
          error
        );
      }
    };

  /*
   * =========================================================
   * INITIAL FETCH
   * =========================================================
   */

  useEffect(() => {
    fetchOrderTracking();
  }, []);

  /*
   * =========================================================
   * SOCKET EFFECT
   * =========================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    console.log(
      "📦 CUSTOMER ORDER ID READY:",
      orderId
    );

    connectSocket(
      orderId
    );

    return () => {
      console.log(
        "🧹 CLEANING CUSTOMER SOCKET"
      );

      if (
        socketRef.current
      ) {
        socketRef.current.off(
          "deliveryLocationUpdate"
        );

        socketRef.current.off(
          "customerLocationUpdate"
        );

        socketRef.current.off(
          "connect"
        );

        socketRef.current.off(
          "disconnect"
        );

        socketRef.current.off(
          "connect_error"
        );

        socketRef.current.disconnect();

        socketRef.current =
          null;
      }

      setSocketConnected(
        false
      );
    };
  }, [orderId]);

  /*
   * =========================================================
   * START CUSTOMER GPS
   * =========================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    if (
      orderStatus ===
        "Delivered" ||
      orderStatus ===
        "Cancelled"
    ) {
      stopCustomerLiveLocation();

      return;
    }

    if (
      trackingStartedRef.current
    ) {
      return;
    }

    trackingStartedRef.current =
      true;

    console.log(
      "📍 STARTING CUSTOMER LIVE GPS"
    );

    startCustomerLiveLocation();

    return () => {
      stopCustomerLiveLocation();
    };
  }, [
    orderId,
    orderStatus,
  ]);

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#EF2C1E"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading active order...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =========================================================
   * NO ACTIVE ORDER
   * =========================================================
   */

  if (!orderId) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
        />

        <View
          style={styles.header}
        >
          <TouchableOpacity
            onPress={() => {
              if (
                router.canGoBack()
              ) {
                router.back();
              } else {
                router.replace(
                  "/"
                );
              }
            }}
            style={
              styles.backButton
            }
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#111827"
            />
          </TouchableOpacity>

          <Text
            style={
              styles.headerTitle
            }
          >
            Active Order
          </Text>

          <View
            style={{
              width: 40,
            }}
          />
        </View>

        <View
          style={
            styles.emptyContainer
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Ionicons
              name="bicycle-outline"
              size={48}
              color="#EF2C1E"
            />
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            No Active Order
          </Text>

          <Text
            style={
              styles.emptySubtitle
            }
          >
            You currently don't have
            any active delivery.
          </Text>

          <TouchableOpacity
            style={
              styles.backDashboardButton
            }
            onPress={() => {
              if (
                router.canGoBack()
              ) {
                router.back();
              } else {
                router.replace(
                  "/"
                );
              }
            }}
          >
            <Text
              style={
                styles.backDashboardText
              }
            >
              Back to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * =========================================================
   * STATUS
   * =========================================================
   */

  const isDelivered =
    orderStatus ===
    "Delivered";

  const isAccepted =
    orderStatus ===
    "Accepted by Delivery";

  const isOutForDelivery =
    orderStatus ===
    "Out for Delivery";

  /*
   * =========================================================
   * MAIN UI
   * =========================================================
   */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* =================================================
          HEADER
      ================================================= */}

      <View
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => {
            if (
              router.canGoBack()
            ) {
              router.back();
            } else {
              router.replace(
                "/"
              );
            }
          }}
          style={
            styles.backButton
          }
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        <View
          style={
            styles.headerCenter
          }
        >
          <Text
            style={
              styles.headerTitle
            }
          >
            Active Order
          </Text>

          <Text
            style={styles.orderRef}
          >
            #
            {orderId
              .slice(-6)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={
            styles.socketStatusContainer
          }
        >
          <View
            style={[
              styles.socketDot,
              {
                backgroundColor:
                  socketConnected
                    ? "#16A34A"
                    : "#9CA3AF",
              },
            ]}
          />

          <Text
            style={
              styles.socketStatusText
            }
          >
            {socketConnected
              ? "LIVE"
              : "OFFLINE"}
          </Text>
        </View>
      </View>

      {/* =================================================
          INFO
      ================================================= */}

      <View
        style={
          styles.infoSection
        }
      >
        {/* STATUS CARD */}

        <View
          style={
            styles.statusCard
          }
        >
          <View
            style={
              styles.statusIconContainer
            }
          >
            <Ionicons
              name={
                isDelivered
                  ? "checkmark-circle"
                  : isOutForDelivery
                  ? "bicycle"
                  : "time"
              }
              size={24}
              color="#EF2C1E"
            />
          </View>

          <View
            style={
              styles.statusContent
            }
          >
            <Text
              style={
                styles.cardLabel
              }
            >
              Order Status
            </Text>

            <Text
              style={
                styles.statusValue
              }
            >
              {orderStatus ||
                "Processing"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  isDelivered
                    ? "#DCFCE7"
                    : isOutForDelivery
                    ? "#FEF3C7"
                    : "#FEE2E2",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    isDelivered
                      ? "#15803D"
                      : isOutForDelivery
                      ? "#B45309"
                      : "#DC2626",
                },
              ]}
            >
              {isDelivered
                ? "COMPLETED"
                : isOutForDelivery
                ? "ON THE WAY"
                : "ACCEPTED"}
            </Text>
          </View>
        </View>

        {/* =================================================
            LOCATION CARDS
        ================================================= */}

        <View
          style={
            styles.locationRow
          }
        >
          {/* RESTAURANT */}

          <View
            style={
              styles.locationCard
            }
          >
            <View
              style={[
                styles.locationIcon,
                {
                  backgroundColor:
                    "#DBEAFE",
                },
              ]}
            >
              <Text
                style={
                  styles.locationEmoji
                }
              >
                🏪
              </Text>
            </View>

            <View
              style={
                styles.locationContent
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Pickup From
              </Text>

              <Text
                style={
                  styles.locationTitle
                }
                numberOfLines={1}
              >
                {restaurantName ||
                  "Restaurant"}
              </Text>

              <Text
                style={
                  styles.locationAddress
                }
                numberOfLines={1}
              >
                {restaurantAddress ||
                  "Restaurant address"}
              </Text>

              {/* CALL RESTAURANT */}

              {restaurantPhone ? (
                <TouchableOpacity
                  style={
                    styles.callButton
                  }
                  onPress={() =>
                    callPhoneNumber(
                      restaurantPhone,
                      restaurantName ||
                        "restaurant"
                    )
                  }
                >
                  <Ionicons
                    name="call"
                    size={12}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.callButtonText
                    }
                  >
                    Call
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* CUSTOMER */}

          <View
            style={
              styles.locationCard
            }
          >
            <View
              style={[
                styles.locationIcon,
                {
                  backgroundColor:
                    "#DCFCE7",
                },
              ]}
            >
              <Text
                style={
                  styles.locationEmoji
                }
              >
                🏠
              </Text>
            </View>

            <View
              style={
                styles.locationContent
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                Deliver To
              </Text>

              <Text
                style={
                  styles.locationTitle
                }
                numberOfLines={1}
              >
                You
              </Text>

              <Text
                style={
                  styles.locationAddress
                }
                numberOfLines={2}
              >
                {deliveryAddress ||
                  "Customer address"}
              </Text>
            </View>
          </View>
        </View>

        {/* =================================================
            DELIVERY PARTNER CARD
        ================================================= */}

        {deliveryPartner && (
          <View
            style={
              styles.deliveryPartnerCard
            }
          >
            <View
              style={
                styles.deliveryPartnerIcon
              }
            >
              <Ionicons
                name="bicycle"
                size={22}
                color="#EF2C1E"
              />
            </View>

            <View
              style={
                styles.deliveryPartnerInfo
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                DELIVERY PARTNER
              </Text>

              <Text
                style={
                  styles.deliveryPartnerName
                }
                numberOfLines={1}
              >
                {deliveryPartner.name ||
                  "Delivery Partner"}
              </Text>

              <Text
                style={
                  styles.deliveryPartnerVehicle
                }
              >
                {deliveryPartner.vehicleType ||
                  "Delivery Partner"}
              </Text>
            </View>

            {deliveryPartner.phone ? (
              <TouchableOpacity
                style={
                  styles.partnerCallButton
                }
                onPress={() =>
                  callPhoneNumber(
                    deliveryPartner.phone ||
                      "",
                    deliveryPartner.name ||
                      "delivery partner"
                  )
                }
              >
                <Ionicons
                  name="call"
                  size={15}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.partnerCallButtonText
                  }
                >
                  Call
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        )}
      </View>

      {/* =================================================
          MAP
      ================================================= */}

      <View
        style={
          styles.mapContainer
        }
      >
        <PlatformMap
          currentLocation={
            deliveryPartnerLocation
          }
          restaurantLocation={
            restaurantLocation
          }
          customerLocation={
            customerLocation
          }
          customerCurrentLocation={
            customerCurrentLocation
          }
          routeCoordinates={
            routeCoordinates
          }
        />

        {/* ROUTE STATUS */}

        {!isDelivered &&
          routeLoading && (
            <View
              style={
                styles.routeLoadingBadge
              }
            >
              <ActivityIndicator
                size="small"
                color="#EF2C1E"
              />

              <Text
                style={
                  styles.routeLoadingText
                }
              >
                Updating route...
              </Text>
            </View>
          )}

        {/* LIVE BADGE */}

        {!isDelivered && (
          <View
            style={
              styles.liveTrackingBadge
            }
          >
            <View
              style={
                styles.livePulse
              }
            />

            <Text
              style={
                styles.liveTrackingText
              }
            >
              LIVE TRACKING
            </Text>
          </View>
        )}

        {/* LEGEND */}

        <View
          style={styles.legend}
        >
          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#2563EB",
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Restaurant
            </Text>
          </View>

          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#16A34A",
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Customer
            </Text>
          </View>

          <View
            style={
              styles.legendItem
            }
          >
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor:
                    "#EF2C1E",
                },
              ]}
            />

            <Text
              style={
                styles.legendText
              }
            >
              Delivery Partner
            </Text>
          </View>
        </View>

        {/* LOCATION STATUS */}

        {!isDelivered && (
          <View
            style={
              styles.locationStatus
            }
          >
            <Ionicons
              name="navigate"
              size={15}
              color="#16A34A"
            />

            <Text
              style={
                styles.locationStatusText
              }
            >
              {deliveryPartnerLocation
                ? "Delivery partner is live"
                : "Waiting for delivery partner..."}
            </Text>
          </View>
        )}

        {/* ROUTE ERROR */}

        {!isDelivered &&
          routeError &&
          routeCoordinates.length ===
            0 && (
            <View
              style={
                styles.routeErrorBadge
              }
            >
              <Ionicons
                name="warning-outline"
                size={15}
                color="#B45309"
              />

              <Text
                style={
                  styles.routeErrorText
                }
              >
                Road route unavailable
              </Text>
            </View>
          )}
      </View>

      {/* =================================================
          ACCEPTED BANNER
      ================================================= */}

      {isAccepted && (
        <View
          style={
            styles.waitingBanner
          }
        >
          <Ionicons
            name="information-circle"
            size={20}
            color="#B45309"
          />

          <Text
            style={
              styles.waitingBannerText
            }
          >
            Your order has been accepted
            by the delivery partner.
            Waiting for the order to be
            picked up.
          </Text>
        </View>
      )}

      {/* =================================================
          OUT FOR DELIVERY BANNER
      ================================================= */}

      {isOutForDelivery && (
        <View
          style={
            styles.deliveryBanner
          }
        >
          <Ionicons
            name="bicycle"
            size={20}
            color="#B45309"
          />

          <Text
            style={
              styles.deliveryBannerText
            }
          >
            Your order is on the way.
            You can track the delivery
            partner live on the map.
          </Text>
        </View>
      )}

      {/* =================================================
          DELIVERED
      ================================================= */}

      {isDelivered && (
        <View
          style={
            styles.deliveredBanner
          }
        >
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#15803D"
          />

          <Text
            style={
              styles.deliveredBannerText
            }
          >
            Order Delivered Successfully
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      "#F8FAFC",
  },

  /*
   * LOADING
   */

  loadingContainer: {
    flex: 1,
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      "#FFFFFF",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#6B7280",
  },

  /*
   * HEADER
   */

  header: {
    height: 64,
    backgroundColor:
      "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor:
      "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent:
      "center",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems:
      "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },

  orderRef: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  socketStatusContainer: {
    width: 58,
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  socketDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 3,
  },

  socketStatusText: {
    fontSize: 8,
    fontWeight: "800",
    color: "#6B7280",
  },

  /*
   * INFO
   */

  infoSection: {
    backgroundColor:
      "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  statusCard: {
    minHeight: 58,
    borderWidth: 1,
    borderColor:
      "#E5E7EB",
    borderRadius: 12,
    flexDirection:
      "row",
    alignItems:
      "center",
    paddingHorizontal: 12,
    backgroundColor:
      "#FFFFFF",
  },

  statusIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "#FEF2F2",
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform:
      "uppercase",
    letterSpacing: 0.5,
  },

  statusValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
  },

  /*
   * LOCATION CARDS
   */

  locationRow: {
    flexDirection:
      "row",
    gap: 8,
    marginTop: 8,
  },

  locationCard: {
    flex: 1,
    minHeight: 78,
    borderWidth: 1,
    borderColor:
      "#E5E7EB",
    borderRadius: 12,
    padding: 9,
    flexDirection:
      "row",
    alignItems:
      "flex-start",
    backgroundColor:
      "#FFFFFF",
  },

  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  locationEmoji: {
    fontSize: 18,
  },

  locationContent: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },

  locationTitle: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },

  locationAddress: {
    marginTop: 2,
    fontSize: 9,
    color: "#6B7280",
  },

  /*
   * CALL RESTAURANT BUTTON
   */

  callButton: {
    marginTop: 5,
    alignSelf: "flex-start",
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#EF2C1E",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
  },

  callButtonText: {
    marginLeft: 4,
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
  },

  /*
   * DELIVERY PARTNER
   */

  deliveryPartnerCard: {
    marginTop: 8,
    minHeight: 58,
    borderWidth: 1,
    borderColor:
      "#E5E7EB",
    borderRadius: 12,
    padding: 9,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFFFFF",
  },

  deliveryPartnerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:
      "#FEF2F2",
    justifyContent:
      "center",
    alignItems:
      "center",
  },

  deliveryPartnerInfo: {
    flex: 1,
    marginLeft: 9,
    minWidth: 0,
  },

  deliveryPartnerName: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },

  deliveryPartnerVehicle: {
    marginTop: 2,
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "600",
    textTransform:
      "capitalize",
  },

  partnerCallButton: {
    flexDirection:
      "row",
    alignItems:
      "center",
    justifyContent:
      "center",
    backgroundColor:
      "#16A34A",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 9,
  },

  partnerCallButtonText: {
    marginLeft: 5,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },

  /*
   * MAP
   */

  mapContainer: {
    flex: 1,
    position:
      "relative",
    overflow:
      "hidden",
  },

  /*
   * ROUTE LOADING
   */

  routeLoadingBadge: {
    position:
      "absolute",
    top: 12,
    right: 12,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor:
      "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  routeLoadingText: {
    marginLeft: 6,
    fontSize: 9,
    fontWeight: "700",
    color: "#374151",
  },

  /*
   * LIVE
   */

  liveTrackingBadge: {
    position:
      "absolute",
    top: 12,
    left: 12,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor:
      "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor:
      "#EF2C1E",
    marginRight: 6,
  },

  liveTrackingText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#111827",
  },

  /*
   * LEGEND
   */

  legend: {
    position:
      "absolute",
    bottom: 12,
    left: 12,
    backgroundColor:
      "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 4,
    shadowColor:
      "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  legendItem: {
    flexDirection:
      "row",
    alignItems:
      "center",
    marginVertical: 2,
  },

  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },

  legendText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#374151",
  },

  /*
   * LOCATION STATUS
   */

  locationStatus: {
    position:
      "absolute",
    bottom: 12,
    right: 12,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor:
      "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  locationStatusText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "600",
    color: "#374151",
  },

  /*
   * ROUTE ERROR
   */

  routeErrorBadge: {
    position:
      "absolute",
    top: 52,
    right: 12,
    flexDirection:
      "row",
    alignItems:
      "center",
    backgroundColor:
      "#FFFBEB",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 3,
  },

  routeErrorText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "700",
    color: "#92400E",
  },

  /*
   * WAITING BANNER
   */

  waitingBanner: {
    backgroundColor:
      "#FFFBEB",
    borderTopWidth: 1,
    borderTopColor:
      "#FDE68A",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  waitingBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
    fontWeight: "600",
  },

  /*
   * DELIVERY BANNER
   */

  deliveryBanner: {
    backgroundColor:
      "#FFFBEB",
    borderTopWidth: 1,
    borderTopColor:
      "#FDE68A",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection:
      "row",
    alignItems:
      "center",
  },

  deliveryBannerText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 17,
    color: "#92400E",
    fontWeight: "600",
  },

  /*
   * DELIVERED
   */

  deliveredBanner: {
    backgroundColor:
      "#F0FDF4",
    borderTopWidth: 1,
    borderTopColor:
      "#BBF7D0",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection:
      "row",
    alignItems:
      "center",
    justifyContent:
      "center",
  },

  deliveredBannerText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#15803D",
    fontWeight: "800",
  },

  /*
   * EMPTY
   */

  emptyContainer: {
    flex: 1,
    justifyContent:
      "center",
    alignItems:
      "center",
    paddingHorizontal: 30,
    backgroundColor:
      "#FFFFFF",
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor:
      "#FEF2F2",
    justifyContent:
      "center",
    alignItems:
      "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  emptySubtitle: {
    marginTop: 8,
    textAlign:
      "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  backDashboardButton: {
    marginTop: 22,
    backgroundColor:
      "#EF2C1E",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
  },

  backDashboardText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});