import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Polyline,
  useMap,
} from "@vis.gl/react-google-maps";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface PlatformMapProps {
  // Delivery partner's current/live location
  currentLocation: LocationCoords | null;

  // Restaurant location
  restaurantLocation?: LocationCoords | null;

  // Customer's fixed delivery destination
  customerLocation?: LocationCoords | null;

  // Kept for compatibility with existing code.
  // We do NOT render this as a separate marker.
  customerCurrentLocation?: LocationCoords | null;

  // Google Maps route coordinates
  routeCoordinates?: LocationCoords[] | null;
}

interface Point {
  lat: number;
  lng: number;
}

/*
 * =========================================================
 * CONVERT LOCATION TO GOOGLE MAP POINT
 * =========================================================
 */

function toPoint(
  location?: LocationCoords | null
): Point | null {
  if (
    !location ||
    !Number.isFinite(Number(location.latitude)) ||
    !Number.isFinite(Number(location.longitude))
  ) {
    return null;
  }

  return {
    lat: Number(location.latitude),
    lng: Number(location.longitude),
  };
}

/*
 * =========================================================
 * ROUTE + MARKERS
 * =========================================================
 */

function RouteAndMarkers({
  currentLocation,
  restaurantLocation,
  customerLocation,
  routeCoordinates,
}: PlatformMapProps) {
  const map = useMap();

  /*
   * =======================================================
   * LOCATION CONVERSION
   * =======================================================
   */

  // DELIVERY PARTNER
  const rider = toPoint(currentLocation);

  // RESTAURANT
  const restaurant = toPoint(
    restaurantLocation
  );

  // CUSTOMER DELIVERY DESTINATION
  const customer = toPoint(
    customerLocation
  );

  /*
   * =======================================================
   * DEBUG LOG
   *
   * This helps us verify whether the parent component is
   * sending the correct coordinates.
   * =======================================================
   */

  useEffect(() => {
    console.log(
      "========== PLATFORM MAP LOCATIONS =========="
    );

    console.log(
      "RESTAURANT LOCATION:",
      restaurantLocation
    );

    console.log(
      "CUSTOMER LOCATION:",
      customerLocation
    );

    console.log(
      "DELIVERY PARTNER LOCATION:",
      currentLocation
    );

    console.log(
      "CONVERTED RESTAURANT:",
      restaurant
    );

    console.log(
      "CONVERTED CUSTOMER:",
      customer
    );

    console.log(
      "CONVERTED RIDER:",
      rider
    );

    console.log(
      "============================================="
    );
  }, [
    restaurantLocation?.latitude,
    restaurantLocation?.longitude,

    customerLocation?.latitude,
    customerLocation?.longitude,

    currentLocation?.latitude,
    currentLocation?.longitude,
  ]);

  /*
   * =======================================================
   * SMOOTH DELIVERY PARTNER MOVEMENT
   * =======================================================
   */

  const [animatedRider, setAnimatedRider] =
    useState<Point | null>(rider);

  const animationRef =
    useRef<number | null>(null);

  const previousRiderRef =
    useRef<Point | null>(rider);

  /*
   * =======================================================
   * RIDER ANIMATION
   * =======================================================
   */

  useEffect(() => {
    if (!rider) {
      return;
    }

    /*
     * First rider location
     */

    if (!previousRiderRef.current) {
      previousRiderRef.current = rider;

      setAnimatedRider(rider);

      return;
    }

    const start =
      previousRiderRef.current;

    const end =
      rider;

    /*
     * Cancel previous animation
     */

    if (
      animationRef.current !== null
    ) {
      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current = null;
    }

    /*
     * Rider has not moved
     */

    if (
      start.lat === end.lat &&
      start.lng === end.lng
    ) {
      setAnimatedRider(end);

      return;
    }

    /*
     * Smooth animation duration
     */

    const duration = 1200;

    const startTime =
      performance.now();

    const animate = (
      time: number
    ) => {
      const progress =
        Math.min(
          (time - startTime) /
            duration,
          1
        );

      /*
       * Ease in / ease out
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

      setAnimatedRider({
        lat:
          start.lat +
          (end.lat - start.lat) *
            eased,

        lng:
          start.lng +
          (end.lng - start.lng) *
            eased,
      });

      if (progress < 1) {
        animationRef.current =
          requestAnimationFrame(
            animate
          );
      } else {
        previousRiderRef.current =
          end;

        animationRef.current =
          null;

        setAnimatedRider(end);
      }
    };

    animationRef.current =
      requestAnimationFrame(
        animate
      );

    return () => {
      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current = null;
      }
    };
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,
  ]);

  /*
   * =======================================================
   * CLEANUP RIDER ANIMATION
   * =======================================================
   */

  useEffect(() => {
    return () => {
      if (
        animationRef.current !== null
      ) {
        cancelAnimationFrame(
          animationRef.current
        );

        animationRef.current = null;
      }
    };
  }, []);

  /*
   * =======================================================
   * CONVERT ROUTE COORDINATES
   * =======================================================
   */

  const route: Point[] =
    Array.isArray(routeCoordinates)
      ? routeCoordinates
          .map((point) => ({
            lat: Number(
              point.latitude
            ),

            lng: Number(
              point.longitude
            ),
          }))
          .filter(
            (point) =>
              Number.isFinite(
                point.lat
              ) &&
              Number.isFinite(
                point.lng
              )
          )
      : [];

  /*
   * =======================================================
   * AUTO FIT MAP
   *
   * Fits:
   *
   * 🏠 Restaurant
   * 🛵 Delivery Partner
   * 📍 Customer
   * 🛣 Route
   * =======================================================
   */

  useEffect(() => {
    if (!map) {
      return;
    }

    const points: Point[] = [];

    /*
     * Restaurant
     */

    if (restaurant) {
      points.push(restaurant);
    }

    /*
     * Delivery partner
     */

    if (rider) {
      points.push(rider);
    }

    /*
     * Customer
     */

    if (customer) {
      points.push(customer);
    }

    /*
     * Route
     */

    if (route.length > 0) {
      points.push(...route);
    }

    /*
     * Nothing available
     */

    if (points.length === 0) {
      return;
    }

    /*
     * Only one point
     */

    if (points.length === 1) {
      map.panTo(points[0]);

      map.setZoom(15);

      return;
    }

    /*
     * Calculate map bounds
     */

    const bounds = {
      north: Math.max(
        ...points.map(
          (point) => point.lat
        )
      ),

      south: Math.min(
        ...points.map(
          (point) => point.lat
        )
      ),

      east: Math.max(
        ...points.map(
          (point) => point.lng
        )
      ),

      west: Math.min(
        ...points.map(
          (point) => point.lng
        )
      ),
    };

    /*
     * Fit all locations
     */

    map.fitBounds(bounds, {
      top: 100,
      right: 60,
      bottom: 120,
      left: 60,
    });
  }, [
    map,

    restaurant?.lat,
    restaurant?.lng,

    rider?.lat,
    rider?.lng,

    customer?.lat,
    customer?.lng,

    routeCoordinates,
  ]);

  /*
   * =======================================================
   * COMMON MARKER STYLE
   * =======================================================
   */

  const markerBase: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
  };

  /*
   * =======================================================
   * RENDER
   * =======================================================
   */

  return (
    <>
      {/* =================================================
          ROUTE
          ================================================= */}

      {route.length >= 2 && (
        <Polyline
          path={route}
          strokeColor="#EF2C1E"
          strokeOpacity={0.9}
          strokeWeight={6}
        />
      )}

      {/* =================================================
          🏠 RESTAURANT
          ================================================= */}

      {restaurant && (
        <AdvancedMarker
          position={restaurant}
          title="Restaurant"
        >
          <div
            style={{
              ...markerBase,

              width: 50,
              height: 50,

              borderRadius: "50%",

              background:
                "#FFFFFF",

              border:
                "3px solid #EF2C1E",

              boxShadow:
                "0 3px 10px rgba(0,0,0,0.25)",

              fontSize: 28,

              cursor: "pointer",
            }}
          >
            🏠
          </div>
        </AdvancedMarker>
      )}

      {/* =================================================
          📍 CUSTOMER
          ================================================= */}

      {customer && (
        <AdvancedMarker
          position={customer}
          title="Customer delivery location"
        >
          <div
            style={{
              ...markerBase,

              width: 50,
              height: 50,

              borderRadius: "50%",

              background:
                "#FFFFFF",

              border:
                "3px solid #EF2C1E",

              boxShadow:
                "0 3px 10px rgba(0,0,0,0.30)",

              fontSize: 29,

              cursor: "pointer",
            }}
          >
            📍
          </div>
        </AdvancedMarker>
      )}

      {/* =================================================
          🛵 DELIVERY PARTNER
          ================================================= */}

      {animatedRider && (
        <AdvancedMarker
          position={animatedRider}
          title="Delivery partner — LIVE"
        >
          <div
            style={{
              display: "flex",

              flexDirection:
                "column",

              alignItems:
                "center",

              justifyContent:
                "center",
            }}
          >
            {/* SCOOTER */}

            <div
              style={{
                width: 54,
                height: 54,

                borderRadius: "50%",

                background:
                  "#EF2C1E",

                border:
                  "3px solid #FFFFFF",

                boxShadow:
                  "0 4px 12px rgba(0,0,0,0.30)",

                display: "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                fontSize: 30,

                cursor: "pointer",
              }}
            >
              🛵
            </div>

            {/* LIVE BADGE */}

            <div
              style={{
                marginTop: -4,

                padding:
                  "3px 7px",

                borderRadius: 10,

                background:
                  "#EF2C1E",

                color:
                  "#FFFFFF",

                fontSize: 9,

                fontWeight: 800,
              }}
            >
              LIVE
            </div>
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}

/*
 * =========================================================
 * PLATFORM MAP
 * =========================================================
 */

export default function PlatformMap(
  props: PlatformMapProps
) {
  /*
   * =======================================================
   * GOOGLE MAPS API KEY
   * =======================================================
   */

  const apiKey =
    process.env
      .EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;

  /*
   * =======================================================
   * INITIAL MAP LOCATION
   * =======================================================
   */

  const initialPoint =
    toPoint(
      props.currentLocation
    ) ||
    toPoint(
      props.restaurantLocation
    ) ||
    toPoint(
      props.customerLocation
    ) || {
      lat: 30.7046,
      lng: 76.7179,
    };

  /*
   * =======================================================
   * API KEY MISSING
   * =======================================================
   */

  if (!apiKey) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",

          display: "flex",

          alignItems:
            "center",

          justifyContent:
            "center",

          background:
            "#E2E6EB",

          color:
            "#334155",

          padding: 20,

          textAlign:
            "center",
        }}
      >
        Google Maps API key is missing.
      </div>
    );
  }

  /*
   * =======================================================
   * GOOGLE MAP
   * =======================================================
   */

  return (
    <APIProvider
      apiKey={apiKey}
    >
      <Map
        style={{
          width: "100%",
          height: "100%",
        }}

        defaultCenter={
          initialPoint
        }

        defaultZoom={15}

        mapId="1960fc434626f8b9b272bb47"

        gestureHandling="greedy"

        disableDefaultUI={false}

        zoomControl

        streetViewControl={
          false
        }

        mapTypeControl={
          false
        }
      >
        <RouteAndMarkers
          {...props}
        />
      </Map>
    </APIProvider>
  );
}

