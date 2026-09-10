import React, { useEffect, useRef } from "react";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { StyleSheet } from "react-native";

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
  const mapRef = useRef<MapView>(null);

  // Collect all available locations
  const locations: LocationCoords[] = [
    ...(restaurantLocation ? [restaurantLocation] : []),
    ...(customerLocation ? [customerLocation] : []),
    ...(customerCurrentLocation ? [customerCurrentLocation] : []),
    ...(currentLocation ? [currentLocation] : []),
  ];

  // Initial map position
  const firstLocation =
    currentLocation ||
    customerCurrentLocation ||
    restaurantLocation ||
    customerLocation || {
      latitude: 28.6139,
      longitude: 77.209,
    };

  const region: Region = {
    latitude: firstLocation.latitude,
    longitude: firstLocation.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  // Automatically show all available markers
  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(locations, {
          edgePadding: {
            top: 80,
            right: 50,
            bottom: 80,
            left: 50,
          },
          animated: true,
        });
      }, 300);
    }
  }, [
    currentLocation?.latitude,
    currentLocation?.longitude,

    restaurantLocation?.latitude,
    restaurantLocation?.longitude,

    customerLocation?.latitude,
    customerLocation?.longitude,

    customerCurrentLocation?.latitude,
    customerCurrentLocation?.longitude,
  ]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={region}
      showsUserLocation={true}
      showsMyLocationButton={true}
      zoomEnabled={true}
      scrollEnabled={true}
      rotateEnabled={true}
      pitchEnabled={true}
    >
      {/* =========================================
          RESTAURANT
      ========================================= */}
      {restaurantLocation && (
        <Marker
          coordinate={restaurantLocation}
          title="Restaurant"
          description="Restaurant location"
        />
      )}

      {/* =========================================
          CUSTOMER DELIVERY ADDRESS
      ========================================= */}
      {customerLocation && (
        <Marker
          coordinate={customerLocation}
          title="Delivery Address"
          description="Food delivery destination"
        />
      )}

      {/* =========================================
          CUSTOMER LIVE LOCATION
      ========================================= */}
      {customerCurrentLocation && (
        <Marker
          coordinate={customerCurrentLocation}
          title="Customer"
          description="Customer's current live location"
        />
      )}

      {/* =========================================
          DELIVERY PARTNER LIVE LOCATION
      ========================================= */}
      {currentLocation && (
        <Marker
          coordinate={currentLocation}
          title="Delivery Partner"
          description="Current delivery partner location"
        />
      )}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});