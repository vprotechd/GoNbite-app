import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
import { io, Socket } from "socket.io-client";

import api from "../../../src/services/api";
import PlatformMap from "../../components/PlatformMap";

const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL ||
  "https://gonbite-app.onrender.com";

interface LocationCoords {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

interface RouteResponse {
  success?: boolean;

  routeCoordinates?: any[];

  encodedPolyline?: string;

  polyline?: string;

  distance?: number;

  duration?: number;

  restaurantLocation?: any;

  customerLocation?: any;

  restaurant?: any;

  customer?: any;

  destination?: any;
}

interface DeliveryAddressObject {
  address?: string;

  latitude?: number | string;

  longitude?: number | string;

  lat?: number | string;

  lng?: number | string;

  landmark?: string;

  receiverName?: string;

  receiverPhone?: string;
}

interface RestaurantData {
  _id?: string;

  id?: string;

  restaurantName?: string;

  address?: string;

  phone?: string;

  latitude?: number | string;

  longitude?: number | string;

  location?: any;

  coordinates?: any;

  restaurantLocation?: any;
}

interface DeliveryDashboardResponse {
  success?: boolean;

  activeOrder?: {
    _id: string;

    status: string;

    customerName?: string;

    customerPhone?: string;

    deliveryAddress?:
      | string
      | DeliveryAddressObject;

    restaurantId?: RestaurantData;

    deliveryPartnerLocation?: LocationCoords | null;

    customerLocation?: LocationCoords | null;

    deliveryLocation?: LocationCoords | null;

    customer?: any;
  } | null;
}

/*
 * =========================================================
 * NORMALIZE LOCATION
 * =========================================================
 *
 * Supports:
 *
 * 1. { latitude, longitude }
 * 2. { lat, lng }
 * 3. { location: { latitude, longitude } }
 * 4. { coordinates: { latitude, longitude } }
 * 5. GeoJSON [longitude, latitude]
 *
 * =========================================================
 */

const toLocationCoords = (
  value: any
): LocationCoords | null => {
  if (!value) {
    return null;
  }

  /*
   * GEOJSON
   *
   * Example:
   * coordinates: [76.7055, 30.7199]
   *
   * GeoJSON order:
   * [longitude, latitude]
   */

  if (
    Array.isArray(value) &&
    value.length >= 2
  ) {
    const longitude = Number(value[0]);
    const latitude = Number(value[1]);

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      return {
        latitude,
        longitude,
      };
    }
  }

  /*
   * Direct / nested coordinate formats
   */

  const latitude = Number(
    value.latitude ??
      value.lat ??
      value.location?.latitude ??
      value.location?.lat ??
      value.coordinates?.latitude ??
      value.coordinates?.lat
  );

  const longitude = Number(
    value.longitude ??
      value.lng ??
      value.lon ??
      value.location?.longitude ??
      value.location?.lng ??
      value.coordinates?.longitude ??
      value.coordinates?.lng
  );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    ...(value.updatedAt
      ? {
          updatedAt: value.updatedAt,
        }
      : {}),
  };
};

/*
 * =========================================================
 * GET RESTAURANT LOCATION
 * =========================================================
 */

const getRestaurantLocation = (
  restaurant: any
): LocationCoords | null => {
  if (!restaurant) {
    return null;
  }

  /*
   * 1. Complete restaurant object
   */

  const direct =
    toLocationCoords(restaurant);

  if (direct) {
    return direct;
  }

  /*
   * 2. restaurant.location
   */

  const location =
    toLocationCoords(
      restaurant.location
    );

  if (location) {
    return location;
  }

  /*
   * 3. restaurant.coordinates
   */

  const coordinates =
    toLocationCoords(
      restaurant.coordinates
    );

  if (coordinates) {
    return coordinates;
  }

  /*
   * 4. restaurant.restaurantLocation
   */

  const nestedLocation =
    toLocationCoords(
      restaurant.restaurantLocation
    );

  if (nestedLocation) {
    return nestedLocation;
  }

  /*
   * 5. restaurant.address
   *
   * In case backend returns coordinates
   * inside address object.
   */

  const nestedAddress =
    toLocationCoords(
      restaurant.address
    );

  if (nestedAddress) {
    return nestedAddress;
  }

  return null;
};

/*
 * =========================================================
 * CUSTOMER LOCATION HELPER
 * =========================================================
 */

const getCustomerLocation = (
  activeOrder: any
): LocationCoords | null => {
  if (!activeOrder) {
    return null;
  }

  return toLocationCoords(
    activeOrder.customerLocation ??
      activeOrder.deliveryLocation ??
      activeOrder.customer?.location ??
      activeOrder.customer?.coordinates ??
      (typeof activeOrder.deliveryAddress ===
      "object"
        ? activeOrder.deliveryAddress
        : null)
  );
};

/*
 * =========================================================
 * ADDRESS HELPER
 * =========================================================
 */

const getAddressText = (
  value: any
): string => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const address =
      value.address || "";

    const landmark =
      value.landmark || "";

    if (address && landmark) {
      return `${address}, ${landmark}`;
    }

    if (address) {
      return address;
    }

    if (landmark) {
      return landmark;
    }
  }

  return "Customer address";
};

/*
 * =========================================================
 * DISTANCE BETWEEN TWO GPS POINTS
 * =========================================================
 */

const getDistanceMeters = (
  point1: LocationCoords,
  point2: LocationCoords
) => {
  const R = 6371000;

  const lat1 =
    (point1.latitude * Math.PI) / 180;

  const lat2 =
    (point2.latitude * Math.PI) / 180;

  const deltaLat =
    ((point2.latitude - point1.latitude) *
      Math.PI) /
    180;

  const deltaLng =
    ((point2.longitude - point1.longitude) *
      Math.PI) /
    180;

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

/*
 * =========================================================
 * GOOGLE ENCODED POLYLINE DECODER
 * =========================================================
 */

const decodePolyline = (
  encoded: string
): LocationCoords[] => {
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
          (byte & 0x1f) << shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLatitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      latitude += deltaLatitude;

      shift = 0;
      result = 0;

      do {
        byte =
          encoded.charCodeAt(index++) -
          63;

        result |=
          (byte & 0x1f) << shift;

        shift += 5;
      } while (byte >= 0x20);

      const deltaLongitude =
        result & 1
          ? ~(result >> 1)
          : result >> 1;

      longitude += deltaLongitude;

      points.push({
        latitude: latitude / 1e5,

        longitude: longitude / 1e5,
      });
    }
  } catch (error) {
    console.error(
      "❌ POLYLINE DECODE ERROR:",
      error
    );

    return [];
  }

  return points;
};

/*
 * =========================================================
 * NORMALIZE ROUTE POINT
 * =========================================================
 */

const normalizeRoutePoint = (
  point: any
): LocationCoords | null => {
  return toLocationCoords(point);
};

export default function ActiveOrderScreen() {
  const [loading, setLoading] =
    useState(true);

  const [delivering, setDelivering] =
    useState(false);

  /*
   * =====================================================
   * CONTACT INFORMATION
   * =====================================================
   */

  const [
    restaurantPhone,
    setRestaurantPhone,
  ] = useState("");

  const [
    customerPhone,
    setCustomerPhone,
  ] = useState("");

  const [
    customerName,
    setCustomerName,
  ] = useState("");

  const [orderId, setOrderId] =
    useState<string | null>(null);

  const [
    orderStatus,
    setOrderStatus,
  ] = useState<string>("");

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

  const [
    restaurantLocation,
    setRestaurantLocation,
  ] =
    useState<LocationCoords | null>(
      null
    );

  const [
    currentLocation,
    setCurrentLocation,
  ] =
    useState<LocationCoords | null>(
      null
    );

  const [
    customerLocation,
    setCustomerLocation,
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
  ] = useState<LocationCoords[]>([]);

  const [
    socketConnected,
    setSocketConnected,
  ] = useState(false);

  const socketRef =
    useRef<Socket | null>(null);

  const locationWatchRef =
    useRef<Location.LocationSubscription | null>(
      null
    );

  const webWatchIdRef =
    useRef<number | null>(null);

  /*
   * =====================================================
   * ROUTE REFS
   * =====================================================
   */

  const routeRequestInFlightRef =
    useRef(false);

  const lastRouteOriginRef =
    useRef<LocationCoords | null>(
      null
    );

  const lastRouteDestinationRef =
    useRef<LocationCoords | null>(
      null
    );

  const routeTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  const lastRouteStatusRef =
    useRef<string | null>(null);

  /*
   * =====================================================
   * CALL PHONE NUMBER
   * =====================================================
   */

  const handleCall = async (
    phone?: string,
    person?: string
  ) => {
    if (!phone) {
      Alert.alert(
        "Phone Number Unavailable",
        `${
          person || "Contact"
        } phone number is not available.`
      );

      return;
    }

    try {
      const phoneNumber =
        String(phone).trim();

      console.log(
        `📞 CALLING ${
          person || "CONTACT"
        }:`,
        phoneNumber
      );

      const url =
        `tel:${phoneNumber}`;

      const supported =
        await Linking.canOpenURL(
          url
        );

      if (!supported) {
        Alert.alert(
          "Unable to Call",
          "Calling is not supported on this device."
        );

        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error(
        "❌ CALL ERROR:",
        error
      );

      Alert.alert(
        "Call Failed",
        "Unable to open the phone dialer."
      );
    }
  };

  /*
   * =====================================================
   * FETCH ACTIVE ORDER
   * =====================================================
   */

  const fetchOrderTracking =
    async () => {
      try {
        setLoading(true);

        console.log(
          "📦 Fetching delivery dashboard..."
        );

        const response =
          await api.get<DeliveryDashboardResponse>(
            "/delivery/dashboard"
          );

        const data =
          response.data;

        console.log(
          "📦 DELIVERY DASHBOARD RESPONSE:",
          data
        );

        const activeOrder =
          data?.activeOrder;

        if (!activeOrder) {
          console.log(
            "ℹ️ No active delivery order"
          );

          setOrderId(null);
          setOrderStatus("");

          setCurrentLocation(null);

          setCustomerLocation(null);

          setRestaurantLocation(null);

          setRouteCoordinates([]);

          setRestaurantPhone("");

          setCustomerPhone("");

          setCustomerName("");

          setDeliveryAddress("");

          setRestaurantName("");

          setRestaurantAddress("");

          lastRouteOriginRef.current =
            null;

          lastRouteDestinationRef.current =
            null;

          lastRouteStatusRef.current =
            null;

          return;
        }

        console.log(
          "📦 ACTIVE ORDER:",
          activeOrder._id
        );

        console.log(
          "📦 ACTIVE ORDER STATUS:",
          activeOrder.status
        );

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
         * CUSTOMER NAME
         */

        setCustomerName(
          activeOrder.customerName ||
            "Customer"
        );

        /*
         * CUSTOMER PHONE
         */

        setCustomerPhone(
          activeOrder.customerPhone ||
            ""
        );

        console.log(
          "👤 CUSTOMER PHONE:",
          activeOrder.customerPhone ||
            "Not available"
        );

        /*
         * DELIVERY ADDRESS
         */

        setDeliveryAddress(
          getAddressText(
            activeOrder.deliveryAddress
          )
        );

        /*
         * =================================================
         * RESTAURANT
         * =================================================
         */

        const restaurant =
          activeOrder.restaurantId;

        if (restaurant) {
          console.log(
            "🏪 FULL RESTAURANT OBJECT:",
            JSON.stringify(
              restaurant,
              null,
              2
            )
          );

          setRestaurantName(
            restaurant.restaurantName ||
              "Restaurant"
          );

          setRestaurantAddress(
            typeof restaurant.address ===
              "string"
              ? restaurant.address
              : ""
          );

          /*
           * RESTAURANT PHONE
           */

          setRestaurantPhone(
            restaurant.phone || ""
          );

          console.log(
            "🏪 RESTAURANT PHONE:",
            restaurant.phone ||
              "Not available"
          );

          /*
           * RESTAURANT LOCATION
           */

          const normalizedRestaurantLocation =
            getRestaurantLocation(
              restaurant
            );

          console.log(
            "🏪 NORMALIZED RESTAURANT LOCATION:",
            normalizedRestaurantLocation
          );

          if (
            normalizedRestaurantLocation
          ) {
            setRestaurantLocation(
              normalizedRestaurantLocation
            );

            console.log(
              "🏪 RESTAURANT LOCATION:",
              normalizedRestaurantLocation
            );
          } else {
            /*
             * IMPORTANT:
             *
             * Do NOT assume restaurant location
             * does not exist in backend.
             *
             * The route API will be called and
             * can resolve restaurant destination.
             */

            setRestaurantLocation(
              null
            );

            console.log(
              "⚠️ Dashboard restaurant coordinates not available."
            );

            console.log(
              "🛣️ Route API will try to resolve restaurant destination."
            );
          }
        } else {
          setRestaurantName("");
          setRestaurantAddress("");
          setRestaurantPhone("");
          setRestaurantLocation(null);

          console.log(
            "⚠️ Restaurant object not available in active order."
          );
        }

        /*
         * =================================================
         * SAVED DELIVERY PARTNER LOCATION
         * =================================================
         */

        const savedDeliveryLocation =
          toLocationCoords(
            activeOrder.deliveryPartnerLocation
          );

        if (
          savedDeliveryLocation
        ) {
          console.log(
            "📍 SAVED DELIVERY LOCATION:",
            savedDeliveryLocation
          );

          setCurrentLocation(
            savedDeliveryLocation
          );
        } else {
          console.log(
            "⚠️ Saved delivery partner location not available"
          );
        }

        /*
         * =================================================
         * SAVED CUSTOMER LOCATION
         * =================================================
         */

        const savedCustomerLocation =
          getCustomerLocation(
            activeOrder
          );

        if (
          savedCustomerLocation
        ) {
          console.log(
            "👤 SAVED CUSTOMER LOCATION:",
            savedCustomerLocation
          );

          setCustomerLocation(
            savedCustomerLocation
          );
        } else {
          setCustomerLocation(null);

          console.log(
            "⚠️ Customer live location not available"
          );
        }
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
   * =====================================================
   * GET CURRENT LOCATION
   * =====================================================
   */

  const getCurrentLocation =
    async (): Promise<LocationCoords | null> => {
      try {
        /*
         * WEB
         */

        if (Platform.OS === "web") {
          return new Promise(
            (resolve) => {
              if (
                !navigator.geolocation
              ) {
                console.log(
                  "❌ Browser geolocation unavailable"
                );

                resolve(null);

                return;
              }

              navigator.geolocation.getCurrentPosition(
                (position) => {
                  const location = {
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
                    "📍 CURRENT WEB LOCATION:",
                    location
                  );

                  resolve(location);
                },
                (error) => {
                  console.error(
                    "❌ WEB LOCATION ERROR:",
                    error
                  );

                  resolve(null);
                },
                {
                  enableHighAccuracy: true,

                  maximumAge: 5000,

                  timeout: 15000,
                }
              );
            }
          );
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
            "❌ Location permission denied"
          );

          return null;
        }

        const location =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        const result = {
          latitude:
            location.coords.latitude,

          longitude:
            location.coords.longitude,

          updatedAt:
            new Date().toISOString(),
        };

        console.log(
          "📍 CURRENT MOBILE LOCATION:",
          result
        );

        return result;
      } catch (error) {
        console.error(
          "❌ GET LOCATION ERROR:",
          error
        );

        return null;
      }
    };

  /*
   * =====================================================
   * SEND CURRENT LOCATION THROUGH SOCKET
   * =====================================================
   */

  const sendDeliveryLocation = (
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
      "📍 SENDING DELIVERY LOCATION:",
      location
    );

    socket.emit(
      "deliveryLocationUpdate",
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
   * =====================================================
   * FETCH ROAD ROUTE
   * =====================================================
   */

  const fetchDeliveryRoute =
    async (
      force = false
    ) => {
      /*
       * We need order ID and rider location.
       */

      if (
        !orderId ||
        !currentLocation
      ) {
        console.log(
          "⏳ ROUTE: Delivery partner location not available"
        );

        return;
      }

      /*
       * ===================================================
       * IMPORTANT:
       *
       * Do NOT require restaurantLocation here.
       *
       * The backend route endpoint may be able
       * to resolve restaurant coordinates.
       *
       * Accepted:
       * Partner → Restaurant
       *
       * Out:
       * Partner → Customer
       * ===================================================
       */

      let destination:
        | LocationCoords
        | null = null;

      if (
        orderStatus ===
        "Accepted by Delivery"
      ) {
        destination =
          restaurantLocation;

        if (!destination) {
          console.log(
            "⚠️ ROUTE: Restaurant location is missing locally."
          );

          console.log(
            "🛣️ ROUTE: Calling backend to resolve restaurant destination..."
          );
        }
      }

      if (
        orderStatus ===
        "Out for Delivery"
      ) {
        destination =
          customerLocation;

        if (!destination) {
          console.log(
            "⚠️ CUSTOMER LOCATION NOT IN DASHBOARD - BACKEND WILL RESOLVE DESTINATION"
          );
        }
      }

      /*
       * If status is something else,
       * no road route is required.
       */

      if (
        orderStatus !==
          "Accepted by Delivery" &&
        orderStatus !==
          "Out for Delivery"
      ) {
        return;
      }

      const origin =
        currentLocation;

      /*
       * ===================================================
       * CHECK IF ROUTE NEEDS REFRESH
       * ===================================================
       */

      const originMoved =
        !lastRouteOriginRef.current ||
        getDistanceMeters(
          lastRouteOriginRef.current,
          origin
        ) >= 30;

      /*
       * If destination is not known yet,
       * force a backend request.
       */

      const destinationMoved =
        !destination ||
        !lastRouteDestinationRef.current ||
        getDistanceMeters(
          lastRouteDestinationRef.current,
          destination
        ) >= 30;

      /*
       * Existing route is still valid.
       */

      if (
        !force &&
        routeCoordinates.length >=
          2 &&
        !originMoved &&
        !destinationMoved
      ) {
        return;
      }

      /*
       * Don't send multiple route requests.
       */

      if (
        routeRequestInFlightRef.current
      ) {
        console.log(
          "⏳ ROUTE REQUEST ALREADY RUNNING"
        );

        return;
      }

      routeRequestInFlightRef.current =
        true;

      try {
        console.log(
          "🛣️ DELIVERY: FETCHING ROAD ROUTE"
        );

        console.log(
          "📍 FROM:",
          origin
        );

        console.log(
          "📍 LOCAL TO:",
          destination
        );

        console.log(
          "📦 ORDER:",
          orderId
        );

        console.log(
          "📦 STATUS:",
          orderStatus
        );

        /*
         * =================================================
         * API
         * =================================================
         */

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
         * =================================================
         * BACKEND LOCATIONS
         * =================================================
         */

        const backendRestaurant =
          getRestaurantLocation(
            data?.restaurantLocation ??
              data?.restaurant
          );

        const backendCustomer =
          toLocationCoords(
            data?.customerLocation ??
              data?.customer
          );

        const backendDestination =
          toLocationCoords(
            data?.destination
          );

        console.log(
          "🏪 BACKEND RESTAURANT:",
          backendRestaurant
        );

        console.log(
          "👤 BACKEND CUSTOMER:",
          backendCustomer
        );

        console.log(
          "📍 BACKEND DESTINATION:",
          backendDestination
        );

        /*
         * =================================================
         * REMEMBER CURRENT LOCATIONS
         * BEFORE UPDATING STATE
         * =================================================
         */

        const restaurantWasMissing =
          !restaurantLocation;

        const customerWasMissing =
          !customerLocation;

        /*
         * =================================================
         * KEEP RESTAURANT AND CUSTOMER SEPARATE
         * =================================================
         */

        if (
          backendRestaurant
        ) {
          setRestaurantLocation(
            backendRestaurant
          );

          console.log(
            "🏪 BACKEND RESTAURANT LOCATION SET:",
            backendRestaurant
          );
        }

        if (
          backendCustomer
        ) {
          setCustomerLocation(
            backendCustomer
          );

          console.log(
            "👤 BACKEND CUSTOMER LOCATION SET:",
            backendCustomer
          );
        }

        /*
         * =================================================
         * DIRECT ROUTE COORDINATES
         * =================================================
         */

        let validCoordinates:
          LocationCoords[] = [];

        if (
          Array.isArray(
            data?.routeCoordinates
          ) &&
          data.routeCoordinates
            .length >= 2
        ) {
          validCoordinates =
            data.routeCoordinates
              .map(
                (point) =>
                  normalizeRoutePoint(
                    point
                  )
              )
              .filter(
                (
                  point
                ): point is LocationCoords =>
                  point !== null &&
                  Number.isFinite(
                    point.latitude
                  ) &&
                  Number.isFinite(
                    point.longitude
                  )
              );
        }

        /*
         * =================================================
         * ENCODED POLYLINE FALLBACK
         * =================================================
         */

        if (
          validCoordinates.length < 2
        ) {
          const encodedPolyline =
            data?.encodedPolyline ||
            data?.polyline;

          if (
            encodedPolyline
          ) {
            console.log(
              "🔄 Decoding encoded route..."
            );

            validCoordinates =
              decodePolyline(
                encodedPolyline
              );
          }
        }

        /*
         * =================================================
         * VALID ROUTE
         * =================================================
         */

        if (
          validCoordinates.length >=
          2
        ) {
          setRouteCoordinates(
            validCoordinates
          );

          lastRouteOriginRef.current =
            origin;

          /*
           * =================================================
           * ACCEPTED BY DELIVERY
           *
           * Partner → Restaurant
           * =================================================
           */

          if (
            orderStatus ===
            "Accepted by Delivery"
          ) {
            const resolvedRestaurant =
              restaurantLocation ||
              backendRestaurant ||
              backendDestination ||
              validCoordinates[
                validCoordinates.length -
                  1
              ];

            if (
              resolvedRestaurant
            ) {
              /*
               * IMPORTANT:
               *
               * Only restaurant marker
               * is updated here.
               *
               * Customer marker will NEVER
               * be overwritten during
               * Accepted by Delivery.
               */

              if (
                restaurantWasMissing ||
                !restaurantLocation
              ) {
                setRestaurantLocation(
                  resolvedRestaurant
                );

                console.log(
                  "🏪 RESTAURANT DESTINATION RESOLVED:",
                  resolvedRestaurant
                );
              }

              lastRouteDestinationRef.current =
                resolvedRestaurant;

              console.log(
                "🏪 ACCEPTED ROUTE DESTINATION:",
                resolvedRestaurant
              );
            }
          }

          /*
           * =================================================
           * OUT FOR DELIVERY
           *
           * Partner → Customer
           * =================================================
           */

          if (
            orderStatus ===
            "Out for Delivery"
          ) {
            const resolvedCustomer =
              customerLocation ||
              backendCustomer ||
              backendDestination ||
              validCoordinates[
                validCoordinates.length -
                  1
              ];

            if (
              resolvedCustomer
            ) {
              /*
               * IMPORTANT:
               *
               * Only customer marker
               * is updated here.
               *
               * Restaurant marker will NEVER
               * be overwritten during
               * Out for Delivery.
               */

              if (
                customerWasMissing ||
                !customerLocation
              ) {
                setCustomerLocation(
                  resolvedCustomer
                );

                console.log(
                  "📍 CUSTOMER DESTINATION RESOLVED:",
                  resolvedCustomer
                );
              }

              lastRouteDestinationRef.current =
                resolvedCustomer;

              console.log(
                "📍 OUT FOR DELIVERY DESTINATION:",
                resolvedCustomer
              );
            }
          }

          console.log(
            "✅ DELIVERY ROUTE SET:",
            validCoordinates.length,
            "points"
          );

          console.log(
            "📍 ROUTE START:",
            validCoordinates[0]
          );

          console.log(
            "📍 ROUTE END:",
            validCoordinates[
              validCoordinates.length - 1
            ]
          );

          return;
        }

        /*
         * =================================================
         * NO VALID ROUTE
         * =================================================
         */

        console.warn(
          "⚠️ ROUTE API returned no valid route"
        );

        setRouteCoordinates([]);
      } catch (error: any) {
        console.error(
          "❌ DELIVERY ROUTE ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );
      } finally {
        routeRequestInFlightRef.current =
          false;
      }
    };

  /*
   * =====================================================
   * LOCATION TRACKING
   * =====================================================
   */

  const startLocationTracking =
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
              "❌ Geolocation not supported"
            );

            return;
          }

          /*
           * Initial location
           */

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
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
                "📍 INITIAL WEB LOCATION:",
                location
              );

              setCurrentLocation(
                location
              );

              sendDeliveryLocation(
                location
              );
            },
            (error) => {
              console.error(
                "❌ INITIAL WEB LOCATION ERROR:",
                error
              );
            },
            {
              enableHighAccuracy: true,

              maximumAge: 3000,

              timeout: 15000,
            }
          );

          /*
           * Continuous tracking
           */

          const watchId =
            navigator.geolocation.watchPosition(
              (position) => {
                const location = {
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
                  "📍 LIVE WEB LOCATION:",
                  location
                );

                setCurrentLocation(
                  location
                );

                sendDeliveryLocation(
                  location
                );
              },
              (error) => {
                console.error(
                  "❌ WEB WATCH LOCATION ERROR:",
                  error
                );
              },
              {
                enableHighAccuracy: true,

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
            "❌ Location permission denied"
          );

          return;
        }

        /*
         * Initial mobile location
         */

        const initial =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        const initialLocation = {
          latitude:
            initial.coords.latitude,

          longitude:
            initial.coords.longitude,

          updatedAt:
            new Date().toISOString(),
        };

        console.log(
          "📍 INITIAL MOBILE LOCATION:",
          initialLocation
        );

        setCurrentLocation(
          initialLocation
        );

        sendDeliveryLocation(
          initialLocation
        );

        /*
         * Continuous mobile tracking
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
              const liveLocation = {
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
                "📍 LIVE MOBILE LOCATION:",
                liveLocation
              );

              setCurrentLocation(
                liveLocation
              );

              sendDeliveryLocation(
                liveLocation
              );
            }
          );
      } catch (error) {
        console.error(
          "❌ START LOCATION TRACKING ERROR:",
          error
        );
      }
    };

  /*
   * =====================================================
   * STOP LOCATION TRACKING
   * =====================================================
   */

  const stopLocationTracking =
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

        console.log(
          "🛑 LOCATION TRACKING STOPPED"
        );
      } catch (error) {
        console.error(
          "❌ STOP LOCATION ERROR:",
          error
        );
      }
    };

  /*
   * =====================================================
   * SOCKET SETUP
   * =====================================================
   */

  const connectSocket =
    async (
      currentOrderId: string
    ) => {
      try {
        const token =
          await AsyncStorage.getItem(
            "deliveryToken"
          );

        if (!token) {
          console.log(
            "❌ No delivery token found"
          );

          return;
        }

        console.log(
          "🔌 SOCKET URL:",
          SOCKET_URL
        );

        console.log(
          "🔌 Connecting delivery socket:",
          SOCKET_URL
        );

        /*
         * Existing socket cleanup
         */

        if (
          socketRef.current
        ) {
          socketRef.current.disconnect();

          socketRef.current =
            null;
        }

        const socket = io(
          SOCKET_URL,
          {
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
          }
        );

        socketRef.current =
          socket;

        /*
         * CONNECT
         */

        socket.on(
          "connect",
          () => {
            console.log(
              "🟢 DELIVERY SOCKET CONNECTED:",
              socket.id
            );

            setSocketConnected(
              true
            );

            /*
             * Join order room
             */

            console.log(
              "📦 Joining order room:",
              currentOrderId
            );

            socket.emit(
              "joinOrder",
              currentOrderId
            );

            /*
             * If location already exists,
             * send immediately.
             */

            if (
              currentLocation
            ) {
              socket.emit(
                "deliveryLocationUpdate",
                {
                  orderId:
                    currentOrderId,

                  latitude:
                    currentLocation.latitude,

                  longitude:
                    currentLocation.longitude,

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
              "🔴 DELIVERY SOCKET DISCONNECTED:",
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
              "❌ DELIVERY SOCKET ERROR:",
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
              "📍 LIVE DELIVERY LOCATION:",
              data
            );

            if (
              data?.orderId ===
                currentOrderId &&
              Number.isFinite(
                Number(data.latitude)
              ) &&
              Number.isFinite(
                Number(data.longitude)
              )
            ) {
              setCurrentLocation({
                latitude: Number(
                  data.latitude
                ),

                longitude: Number(
                  data.longitude
                ),

                updatedAt:
                  data.updatedAt ||
                  new Date().toISOString(),
              });
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
              Number.isFinite(
                Number(data.latitude)
              ) &&
              Number.isFinite(
                Number(data.longitude)
              )
            ) {
              setCustomerLocation({
                latitude: Number(
                  data.latitude
                ),

                longitude: Number(
                  data.longitude
                ),

                updatedAt:
                  data.updatedAt ||
                  new Date().toISOString(),
              });
            }
          }
        );
      } catch (error) {
        console.error(
          "❌ CONNECT SOCKET ERROR:",
          error
        );
      }
    };

  /*
   * =====================================================
   * FETCH INITIAL ORDER
   * =====================================================
   */

  useEffect(() => {
    fetchOrderTracking();
  }, []);

  /*
   * =====================================================
   * ORDER / SOCKET EFFECT
   * =====================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    console.log(
      "📦 ORDER ID READY:",
      orderId
    );

    connectSocket(orderId);

    return () => {
      console.log(
        "🧹 CLEANING DELIVERY SOCKET"
      );

      stopLocationTracking();

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
   * =====================================================
   * START / STOP GPS BASED ON ORDER STATUS
   * =====================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    const shouldTrack =
      orderStatus ===
        "Accepted by Delivery" ||
      orderStatus ===
        "Out for Delivery";

    if (shouldTrack) {
      console.log(
        "🚴 STARTING DELIVERY TRACKING FOR:",
        orderStatus
      );

      startLocationTracking();
    } else {
      console.log(
        "🛑 TRACKING NOT REQUIRED FOR:",
        orderStatus
      );

      stopLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [
    orderId,
    orderStatus,
  ]);

  /*
   * =====================================================
   * AUTOMATIC ROAD ROUTE FETCH
   * =====================================================
   */

  useEffect(() => {
    if (!orderId) {
      return;
    }

    /*
     * Route only needed for:
     *
     * Accepted by Delivery
     * Out for Delivery
     */

    const routeRequired =
      orderStatus ===
        "Accepted by Delivery" ||
      orderStatus ===
        "Out for Delivery";

    /*
     * ===================================================
     * STATUS CHANGED
     *
     * Accepted by Delivery
     *        ↓
     * Out for Delivery
     *
     * Clear old route.
     * New route will be fetched.
     * ===================================================
     */

    if (
      lastRouteStatusRef.current !==
      orderStatus
    ) {
      console.log(
        "🔄 ROUTE STATUS CHANGED:",
        lastRouteStatusRef.current,
        "→",
        orderStatus
      );

      setRouteCoordinates([]);

      lastRouteOriginRef.current =
        null;

      lastRouteDestinationRef.current =
        null;

      lastRouteStatusRef.current =
        orderStatus;
    }

    if (!routeRequired) {
      setRouteCoordinates([]);

      lastRouteOriginRef.current =
        null;

      lastRouteDestinationRef.current =
        null;

      return;
    }

    /*
     * Clear previous timer
     */

    if (
      routeTimerRef.current
    ) {
      clearTimeout(
        routeTimerRef.current
      );

      routeTimerRef.current =
        null;
    }

    /*
     * Wait 1 second after location
     * changes before asking backend
     * for route.
     */

    routeTimerRef.current =
      setTimeout(() => {
        fetchDeliveryRoute();
      }, 1000);

    return () => {
      if (
        routeTimerRef.current
      ) {
        clearTimeout(
          routeTimerRef.current
        );

        routeTimerRef.current =
          null;
      }
    };
  }, [
    orderId,

    orderStatus,

    currentLocation?.latitude,

    currentLocation?.longitude,

    restaurantLocation?.latitude,

    restaurantLocation?.longitude,

    customerLocation?.latitude,

    customerLocation?.longitude,
  ]);

  /*
   * =====================================================
   * DELIVER ORDER
   * =====================================================
   */

  const handleDelivered =
    async () => {
      if (!orderId) {
        return;
      }

      try {
        setDelivering(true);

        console.log(
          "📦 Marking order delivered:",
          orderId
        );

        await api.put(
          `/delivery/update-status/${orderId}`,
          {
            status: "Delivered",
          }
        );

        stopLocationTracking();

        setOrderStatus(
          "Delivered"
        );

        setRouteCoordinates([]);

        Alert.alert(
          "Order Delivered",
          "Order has been marked as delivered."
        );

        setTimeout(() => {
          if (
            router.canGoBack()
          ) {
            router.back();
          } else {
            router.replace("/");
          }
        }, 1200);
      } catch (error: any) {
        console.error(
          "❌ DELIVER ORDER ERROR:",
          error?.response?.data ||
            error?.message ||
            error
        );

        Alert.alert(
          "Error",
          error?.response?.data
            ?.message ||
            "Unable to mark order as delivered."
        );
      } finally {
        setDelivering(false);
      }
    };

  /*
   * =====================================================
   * LOADING
   * =====================================================
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
   * =====================================================
   * NO ACTIVE ORDER
   * =====================================================
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
                router.replace("/");
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
            style={{ width: 40 }}
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
                router.replace("/");
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
   * =====================================================
   * STATUS
   * =====================================================
   */

  const isDelivered =
    orderStatus === "Delivered";

  const isAccepted =
    orderStatus ===
    "Accepted by Delivery";

  const isOutForDelivery =
    orderStatus ===
    "Out for Delivery";

  /*
   * =====================================================
   * MAIN UI
   * =====================================================
   */

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FFFFFF"
      />

      {/* HEADER */}

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
              router.replace("/");
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

      {/* TOP INFO */}

      <View
        style={styles.infoSection}
      >
        {/* STATUS CARD */}

        <View
          style={styles.statusCard}
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

        {/* LOCATION CARDS */}

        <View
          style={styles.locationRow}
        >
          {/* RESTAURANT */}

          <View
            style={styles.locationCard}
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
            </View>
          </View>

          {/* CUSTOMER */}

          <View
            style={styles.locationCard}
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
                {customerName ||
                  "Customer"}
              </Text>

              <Text
                style={
                  styles.locationAddress
                }
                numberOfLines={1}
              >
                {deliveryAddress ||
                  "Customer address"}
              </Text>
            </View>
          </View>
        </View>

        {/* CONTACT BUTTONS */}

        <View
          style={styles.contactRow}
        >
          {/* RESTAURANT CALL */}

          <TouchableOpacity
            style={[
              styles.callButton,
              !restaurantPhone &&
                styles.callButtonDisabled,
            ]}
            onPress={() =>
              handleCall(
                restaurantPhone,
                "Restaurant"
              )
            }
            disabled={
              !restaurantPhone
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="call"
              size={18}
              color="#FFFFFF"
            />

            <View
              style={
                styles.callButtonContent
              }
            >
              <Text
                style={
                  styles.callButtonTitle
                }
              >
                Call Restaurant
              </Text>

              <Text
                style={
                  styles.callButtonPhone
                }
                numberOfLines={1}
              >
                {restaurantPhone ||
                  "Phone unavailable"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* CUSTOMER CALL */}

          <TouchableOpacity
            style={[
              styles.callButton,
              !customerPhone &&
                styles.callButtonDisabled,
            ]}
            onPress={() =>
              handleCall(
                customerPhone,
                "Customer"
              )
            }
            disabled={
              !customerPhone
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="call"
              size={18}
              color="#FFFFFF"
            />

            <View
              style={
                styles.callButtonContent
              }
            >
              <Text
                style={
                  styles.callButtonTitle
                }
              >
                Call Customer
              </Text>

              <Text
                style={
                  styles.callButtonPhone
                }
                numberOfLines={1}
              >
                {customerPhone ||
                  "Phone unavailable"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* MAP */}

      <View
        style={styles.mapContainer}
      >
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
          routeCoordinates={
            routeCoordinates
          }
        />

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

        {/* ROUTE STATUS */}

        {!isDelivered &&
          routeCoordinates.length >=
            2 && (
            <View
              style={
                styles.routeBadge
              }
            >
              <Ionicons
                name="navigate"
                size={14}
                color="#EF2C1E"
              />

              <Text
                style={
                  styles.routeBadgeText
                }
              >
                {isAccepted
                  ? "TO RESTAURANT"
                  : isOutForDelivery
                  ? "TO CUSTOMER"
                  : "ROAD ROUTE"}
              </Text>
            </View>
          )}

        {/* LEGEND */}

        <View
          style={styles.legend}
        >
          <View
            style={styles.legendItem}
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
              style={styles.legendText}
            >
              Restaurant
            </Text>
          </View>

          <View
            style={styles.legendItem}
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
              style={styles.legendText}
            >
              Customer
            </Text>
          </View>

          <View
            style={styles.legendItem}
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
              style={styles.legendText}
            >
              You
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
              {currentLocation
                ? "Your location is live"
                : "Getting your location..."}
            </Text>
          </View>
        )}
      </View>

      {/* BOTTOM ACTION */}

      {!isDelivered &&
        isOutForDelivery && (
          <View
            style={
              styles.bottomAction
            }
          >
            <TouchableOpacity
              style={
                styles.deliveredButton
              }
              onPress={
                handleDelivered
              }
              disabled={
                delivering
              }
            >
              {delivering ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.deliveredButtonText
                    }
                  >
                    Mark as Delivered
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

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
            Waiting for restaurant to
            mark the order as Out for
            Delivery.
          </Text>
        </View>
      )}

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
    backgroundColor: "#F8FAFC",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
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
    alignItems: "center",
    justifyContent: "center",
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
   * INFO SECTION
   */

  infoSection: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },

  statusCard: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },

  statusIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9CA3AF",
    textTransform: "uppercase",
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
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  locationCard: {
    flex: 1,
    minHeight: 68,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 9,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  locationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
   * CONTACT BUTTONS
   */

  contactRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },

  callButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: "#EF2C1E",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    justifyContent: "center",
  },

  callButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  callButtonContent: {
    flex: 1,
    marginLeft: 8,
    minWidth: 0,
  },

  callButtonTitle: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  callButtonPhone: {
    color: "#FFFFFF",
    fontSize: 10,
    marginTop: 2,
    opacity: 0.9,
  },

  /*
   * MAP
   */

  mapContainer: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },

  liveTrackingBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
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
    backgroundColor: "#EF2C1E",
    marginRight: 6,
  },

  liveTrackingText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#111827",
  },

  /*
   * ROUTE BADGE
   */

  routeBadge: {
    position: "absolute",
    top: 52,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  routeBadgeText: {
    marginLeft: 5,
    fontSize: 9,
    fontWeight: "800",
    color: "#EF2C1E",
  },

  /*
   * LEGEND
   */

  legend: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
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
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 20,
    elevation: 4,
    shadowColor: "#000",
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
   * BOTTOM ACTION
   */

  bottomAction: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  deliveredButton: {
    height: 48,
    backgroundColor: "#EF2C1E",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  deliveredButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },

  /*
   * WAITING
   */

  waitingBanner: {
    backgroundColor: "#FFFBEB",
    borderTopWidth: 1,
    borderTopColor: "#FDE68A",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
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
   * DELIVERED
   */

  deliveredBanner: {
    backgroundColor: "#F0FDF4",
    borderTopWidth: 1,
    borderTopColor: "#BBF7D0",
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#FFFFFF",
  },

  emptyIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
  },

  emptySubtitle: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#6B7280",
  },

  backDashboardButton: {
    marginTop: 22,
    backgroundColor: "#EF2C1E",
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

