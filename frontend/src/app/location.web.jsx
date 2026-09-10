import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function LocationScreen() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCurrentLocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        console.log("WEB LOCATION:");
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        setLocation({
          latitude,
          longitude,
        });

        setLoading(false);
      },
      (error) => {
        console.error("WEB LOCATION ERROR:", error);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5B82E" />

        <Text style={styles.loadingText}>
          Getting your location...
        </Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>
          Location unavailable
        </Text>

        <Text style={styles.errorText}>
          Please allow location access in your browser.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={getCurrentLocation}
        >
          <Text style={styles.buttonText}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* WEB MAP */}
      <View style={styles.mapContainer}>
        <iframe
          title="Delivery Location"
          style={styles.map}
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${
            location.longitude - 0.01
          }%2C${location.latitude - 0.01}%2C${
            location.longitude + 0.01
          }%2C${location.latitude + 0.01
          }&layer=mapnik&marker=${location.latitude}%2C${location.longitude}`}
        />
      </View>

      {/* BOTTOM PANEL */}
      <View style={styles.bottomPanel}>
        <Text style={styles.title}>
          Set Delivery Location
        </Text>

        <Text style={styles.subtitle}>
          Your current location has been detected.
        </Text>

        <View style={styles.coordinates}>
          <Text style={styles.coordinateText}>
            Latitude: {location.latitude.toFixed(6)}
          </Text>

          <Text style={styles.coordinateText}>
            Longitude: {location.longitude.toFixed(6)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            console.log("CONFIRMED LOCATION:", location);
            alert("Your current location has been selected.");
          }}
        >
          <Text style={styles.confirmButtonText}>
            Confirm Location
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={getCurrentLocation}
        >
          <Text style={styles.refreshButtonText}>
            📍 Use Current Location
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },

  map: {
    width: "100%",
    height: "100%",
    border: "none",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#475569",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#081A33",
    marginBottom: 8,
  },

  errorText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#F5B82E",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 10,
  },

  buttonText: {
    color: "#081A33",
    fontSize: 16,
    fontWeight: "700",
  },

  bottomPanel: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 25,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  title: {
    fontSize: 21,
    fontWeight: "700",
    color: "#081A33",
  },

  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: "#64748B",
  },

  coordinates: {
    marginTop: 14,
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
  },

  coordinateText: {
    fontSize: 13,
    color: "#475569",
    marginVertical: 2,
  },

  confirmButton: {
    marginTop: 15,
    backgroundColor: "#F5B82E",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#081A33",
  },

  refreshButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#081A33",
  },
});