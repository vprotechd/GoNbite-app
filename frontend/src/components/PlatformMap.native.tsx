import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";

import {
  StyleSheet,
  View,
  Text,
} from "react-native";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface PlatformMapProps {
  // Delivery partner live location
  currentLocation: LocationCoords | null;

  // Restaurant pickup location
  restaurantLocation?: LocationCoords | null;

  // Customer fixed delivery address
  customerLocation?: LocationCoords | null;

  // Kept for compatibility.
  // We are NOT displaying this separately.
  customerCurrentLocation?: LocationCoords | null;

  // Google route coordinates
  routeCoordinates?: LocationCoords[] | null;
}

export default function PlatformMap({
  currentLocation,
  restaurantLocation,
  customerLocation,
  customerCurrentLocation,
  routeCoordinates,
}: PlatformMapProps) {
  const mapRef = useRef<MapView>(null);

  /*
   * =====================================================
   * DEBUG LOCATION DATA
   * =====================================================
   *
   * This lets us verify exactly which coordinates
   * are coming into the map.
   */

  useEffect(() => {
    console.log(
      "========== GONBITE PLATFORM MAP =========="
    );

    console.log(
      "🏠 RESTAURANT:",
      restaurantLocation
    );

    console.log(
      "📍 CUSTOMER:",
      customerLocation
    );

    console.log(
      "🛵 DELIVERY PARTNER:",
      currentLocation
    );

    console.log(
      "👤 CUSTOMER LIVE:",
      customerCurrentLocation
    );

    console.log(
      "🛣 ROUTE POINTS:",
      routeCoordinates?.length || 0
    );

    console.log(
      "==========================================="
    );
  }, [
    restaurantLocation?.latitude,
    restaurantLocation?.longitude,

    customerLocation?.latitude,
    customerLocation?.longitude,

    currentLocation?.latitude,
    currentLocation?.longitude,

    customerCurrentLocation?.latitude,
    customerCurrentLocation?.longitude,

    routeCoordinates,
  ]);

  /*
   * =====================================================
   * SMOOTH DELIVERY PARTNER LOCATION
   * =====================================================
   */

  const [animatedRider, setAnimatedRider] =
    useState<LocationCoords | null>(
      currentLocation
    );

  const previousRiderRef =
    useRef<LocationCoords | null>(
      currentLocation
    );

  const animationRef =
    useRef<ReturnType<
      typeof setInterval
    > | null>(null);

  useEffect(() => {
    if (!currentLocation) {
      return;
    }

    /*
     * First location
     */

    if (!previousRiderRef.current) {
      previousRiderRef.current =
        currentLocation;

      setAnimatedRider(
        currentLocation
      );

      return;
    }

    const start =
      previousRiderRef.current;

    const end =
      currentLocation;

    /*
     * Stop previous animation
     */

    if (animationRef.current) {
      clearInterval(
        animationRef.current
      );

      animationRef.current = null;
    }

    /*
     * Location hasn't changed
     */

    if (
      start.latitude ===
        end.latitude &&
      start.longitude ===
        end.longitude
    ) {
      setAnimatedRider(end);

      return;
    }

    /*
     * Smooth movement
     */

    const duration = 1200;

    const startTime =
      Date.now();

    animationRef.current =
      setInterval(() => {
        const elapsed =
          Date.now() -
          startTime;

        const progress =
          Math.min(
            elapsed / duration,
            1
          );

        /*
         * Ease-in-out
         */

        const eased =
          progress < 0.5
            ? 2 *
              progress *
              progress
            : 1 -
              Math.pow(
                -2 * progress + 2,
                2
              ) /
                2;

        const latitude =
          start.latitude +
          (end.latitude -
            start.latitude) *
            eased;

        const longitude =
          start.longitude +
          (end.longitude -
            start.longitude) *
            eased;

        setAnimatedRider({
          latitude,
          longitude,
        });

        /*
         * Animation complete
         */

        if (progress >= 1) {
          if (
            animationRef.current
          ) {
            clearInterval(
              animationRef.current
            );

            animationRef.current =
              null;
          }

          previousRiderRef.current =
            end;

          setAnimatedRider(
            end
          );
        }
      }, 50);

    return () => {
      if (
        animationRef.current
      ) {
        clearInterval(
          animationRef.current
        );

        animationRef.current =
          null;
      }
    };
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,
  ]);

  /*
   * =====================================================
   * ROUTE LOCATIONS
   * =====================================================
   */

  const routeLocations: LocationCoords[] =
    Array.isArray(routeCoordinates)
      ? routeCoordinates.filter(
          (point) =>
            point &&
            Number.isFinite(
              Number(
                point.latitude
              )
            ) &&
            Number.isFinite(
              Number(
                point.longitude
              )
            )
        )
      : [];

  /*
   * =====================================================
   * MAP FIT LOCATIONS
   * =====================================================
   *
   * ONLY these three actual locations are included:
   *
   * 🏠 Restaurant
   * 🛵 Delivery partner
   * 📍 Customer
   *
   * customerCurrentLocation is intentionally NOT used.
   */

  const locations: LocationCoords[] =
    [
      ...(restaurantLocation
        ? [restaurantLocation]
        : []),

      ...(customerLocation
        ? [customerLocation]
        : []),

      ...(currentLocation
        ? [currentLocation]
        : []),
    ];

  /*
   * Include route points so the complete route
   * remains visible.
   */

  const fitLocations: LocationCoords[] =
    [
      ...locations,
      ...routeLocations,
    ];

  /*
   * =====================================================
   * INITIAL MAP POSITION
   * =====================================================
   */

  const firstLocation =
    currentLocation ||
    restaurantLocation ||
    customerLocation || {
      latitude: 28.6139,
      longitude: 77.209,
    };

  const region: Region = {
    latitude:
      firstLocation.latitude,

    longitude:
      firstLocation.longitude,

    latitudeDelta: 0.02,

    longitudeDelta: 0.02,
  };

  /*
   * =====================================================
   * AUTO FIT MAP
   * =====================================================
   */

  useEffect(() => {
    if (
      !mapRef.current ||
      fitLocations.length === 0
    ) {
      return;
    }

    const timer =
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          fitLocations,
          {
            edgePadding: {
              top: 100,
              right: 60,
              bottom: 120,
              left: 60,
            },

            animated: true,
          }
        );
      }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,

    restaurantLocation?.latitude,
    restaurantLocation?.longitude,

    customerLocation?.latitude,
    customerLocation?.longitude,

    routeCoordinates,
  ]);

  /*
   * =====================================================
   * CLEANUP ANIMATION
   * =====================================================
   */

  useEffect(() => {
    return () => {
      if (
        animationRef.current
      ) {
        clearInterval(
          animationRef.current
        );

        animationRef.current =
          null;
      }
    };
  }, []);

  /*
   * =====================================================
   * MAP
   * =====================================================
   */

  return (
    <MapView
      ref={mapRef}
      style={styles.map}

      provider={
        PROVIDER_GOOGLE
      }

      initialRegion={region}

      showsUserLocation={true}

      showsMyLocationButton={true}

      zoomEnabled={true}

      scrollEnabled={true}

      rotateEnabled={true}

      pitchEnabled={true}

      toolbarEnabled={false}
    >
      {/* =================================================
          🛣 ROAD ROUTE
          ================================================= */}

      {routeLocations.length >= 2 && (
        <Polyline
          coordinates={
            routeLocations
          }

          strokeWidth={6}

          strokeColor="#EF2C1E"

          lineCap="round"

          lineJoin="round"

          geodesic={false}
        />
      )}

      {/* =================================================
          🏠 RESTAURANT
          ================================================= */}

      {restaurantLocation && (
        <Marker
          coordinate={
            restaurantLocation
          }

          title="Restaurant"

          description="Restaurant pickup location"
        >
          <View
            style={[
              styles.marker,
              styles.restaurantMarker,
            ]}
          >
            <Text
              style={
                styles.markerEmoji
              }
            >
              🏠
            </Text>
          </View>
        </Marker>
      )}

      {/* =================================================
          📍 CUSTOMER DELIVERY LOCATION
          ================================================= */}

      {customerLocation && (
        <Marker
          coordinate={
            customerLocation
          }

          title="Customer"

          description="Food delivery destination"
        >
          <View
            style={[
              styles.marker,
              styles.customerMarker,
            ]}
          >
            <Text
              style={
                styles.markerEmoji
              }
            >
              📍
            </Text>
          </View>
        </Marker>
      )}

      {/* =================================================
          🛵 DELIVERY PARTNER
          ================================================= */}

      {animatedRider && (
        <Marker
          coordinate={
            animatedRider
          }

          title="Delivery Partner"

          description="Delivery partner — LIVE"

          anchor={{
            x: 0.5,
            y: 0.5,
          }}

          flat={false}
        >
          <View
            style={
              styles.riderContainer
            }
          >
            {/* SCOOTER */}

            <View
              style={
                styles.riderMarker
              }
            >
              <Text
                style={
                  styles.riderEmoji
                }
              >
                🛵
              </Text>
            </View>

            {/* LIVE */}

            <View
              style={
                styles.liveBadge
              }
            >
              <Text
                style={
                  styles.liveText
                }
              >
                LIVE
              </Text>
            </View>
          </View>
        </Marker>
      )}
    </MapView>
  );
}

/*
 * =========================================================
 * STYLES
 * =========================================================
 */

const styles =
  StyleSheet.create({
    /*
     * MAP
     */

    map: {
      flex: 1,
    },

    /*
     * COMMON MARKER
     */

    marker: {
      width: 46,
      height: 46,

      borderRadius: 23,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth: 3,

      shadowColor:
        "#000000",

      shadowOpacity: 0.25,

      shadowRadius: 6,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 5,
    },

    /*
     * MARKER EMOJI
     */

    markerEmoji: {
      fontSize: 24,
    },

    /*
     * RESTAURANT
     */

    restaurantMarker: {
      borderColor:
        "#EF2C1E",
    },

    /*
     * CUSTOMER
     */

    customerMarker: {
      borderColor:
        "#EF2C1E",
    },

    /*
     * DELIVERY PARTNER
     */

    riderContainer: {
      alignItems:
        "center",

      justifyContent:
        "center",
    },

    riderMarker: {
      width: 54,
      height: 54,

      borderRadius: 27,

      backgroundColor:
        "#EF2C1E",

      borderWidth: 3,

      borderColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",

      shadowColor:
        "#000000",

      shadowOpacity: 0.3,

      shadowRadius: 7,

      shadowOffset: {
        width: 0,
        height: 3,
      },

      elevation: 7,
    },

    riderEmoji: {
      fontSize: 29,
    },

    /*
     * LIVE BADGE
     */

    liveBadge: {
      marginTop: -4,

      paddingHorizontal: 7,

      paddingVertical: 3,

      borderRadius: 10,

      backgroundColor:
        "#EF2C1E",

      borderWidth: 1,

      borderColor:
        "#FFFFFF",

      elevation: 3,
    },

    liveText: {
      color: "#FFFFFF",

      fontSize: 8,

      fontWeight: "800",

      letterSpacing: 0.5,
    },
  });

