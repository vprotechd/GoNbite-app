import React, { useEffect, useState } from "react";
import {
  APIProvider,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface PlatformMapProps {
  currentLocation: LocationCoords | null; // Delivery partner live location
  restaurantLocation?: LocationCoords | null;
  customerLocation?: LocationCoords | null; // Fixed delivery address
  customerCurrentLocation?: LocationCoords | null; // Customer live location
}

export default function PlatformMap({
  currentLocation,
  restaurantLocation,
  customerLocation,
  customerCurrentLocation,
}: PlatformMapProps) {
  const [mapCenter, setMapCenter] = useState({
    lat: 28.6139,
    lng: 77.209,
  });

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;

  /*
   * Priority:
   * 1. Delivery partner live location
   * 2. Customer live location
   * 3. Restaurant
   * 4. Delivery address
   */
  const firstLocation =
    currentLocation ||
    customerCurrentLocation ||
    restaurantLocation ||
    customerLocation;

  useEffect(() => {
    if (firstLocation) {
      setMapCenter({
        lat: firstLocation.latitude,
        lng: firstLocation.longitude,
      });
    }
  }, [
    firstLocation?.latitude,
    firstLocation?.longitude,
  ]);

  if (!apiKey) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#E2E6EB",
          color: "#334155",
          padding: 20,
          textAlign: "center",
        }}
      >
        Google Maps API key is missing.
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        style={{
          width: "100%",
          height: "100%",
        }}
        center={mapCenter}
        defaultZoom={15}
        gestureHandling="greedy"
        disableDefaultUI={false}
        zoomControl={true}
        streetViewControl={false}
        mapTypeControl={false}
      >

        {/* =========================================
            RESTAURANT
        ========================================= */}
        {restaurantLocation && (
          <Marker
            position={{
              lat: restaurantLocation.latitude,
              lng: restaurantLocation.longitude,
            }}
            title="Restaurant"
          />
        )}

        {/* =========================================
            CUSTOMER DELIVERY ADDRESS
        ========================================= */}
        {customerLocation && (
          <Marker
            position={{
              lat: customerLocation.latitude,
              lng: customerLocation.longitude,
            }}
            title="Delivery Address"
          />
        )}

        {/* =========================================
            CUSTOMER LIVE LOCATION
        ========================================= */}
        {customerCurrentLocation && (
          <Marker
            position={{
              lat: customerCurrentLocation.latitude,
              lng: customerCurrentLocation.longitude,
            }}
            title="Customer"
          />
        )}

        {/* =========================================
            DELIVERY PARTNER LIVE LOCATION
        ========================================= */}
        {currentLocation && (
          <Marker
            position={{
              lat: currentLocation.latitude,
              lng: currentLocation.longitude,
            }}
            title="Delivery Partner"
          />
        )}

      </Map>
    </APIProvider>
  );
}