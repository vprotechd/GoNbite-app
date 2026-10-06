import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function ConfirmLocationScreen() {
  const params = useLocalSearchParams();

  // =====================================================
  // LOCATION STATE
  // =====================================================

  const [address, setAddress] = useState(
    params.address ? String(params.address) : ""
  );

  const [latitude, setLatitude] = useState(
    params.latitude ? Number(params.latitude) : null
  );

  const [longitude, setLongitude] = useState(
    params.longitude ? Number(params.longitude) : null
  );

  // =====================================================
  // RECIPIENT DETAILS
  // =====================================================

  const [receiverName, setReceiverName] = useState(
    params.receiverName ? String(params.receiverName) : ""
  );

  const [phone, setPhone] = useState(
    params.receiverPhone ? String(params.receiverPhone) : ""
  );

  const [landmark, setLandmark] = useState(
    params.landmark ? String(params.landmark) : ""
  );

  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // =====================================================
// REVERSE GEOCODE LOCATION → ADDRESS
// =====================================================

const reverseGeocodeLocation = async (
  selectedLatitude,
  selectedLongitude
) => {
  try {
    if (
      selectedLatitude == null ||
      selectedLongitude == null
    ) {
      return;
    }

    const apiKey =
      process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;

    if (!apiKey) {
      Alert.alert(
        "Google Maps Error",
        "Google Maps API key is missing."
      );
      return;
    }

    console.log(
      "📍 REVERSE GEOCODING:",
      selectedLatitude,
      selectedLongitude
    );

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=` +
      `${selectedLatitude},${selectedLongitude}` +
      `&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    console.log(
      "📍 REVERSE GEOCODE STATUS:",
      data.status
    );

    if (
      data.status !== "OK" ||
      !data.results?.length
    ) {
      Alert.alert(
        "Address Not Found",
        "Could not find an address for this location."
      );
      return;
    }

    const formattedAddress =
      data.results[0].formatted_address;

    setLatitude(Number(selectedLatitude));
    setLongitude(Number(selectedLongitude));
    setAddress(formattedAddress);

    console.log(
      "✅ AUTOMATIC DELIVERY ADDRESS:",
      {
        address: formattedAddress,
        latitude: Number(selectedLatitude),
        longitude: Number(selectedLongitude),
      }
    );
  } catch (error) {
    console.error(
      "❌ REVERSE GEOCODING ERROR:",
      error
    );

    Alert.alert(
      "Location Error",
      "Unable to get the delivery address."
    );
  }
};

  // =====================================================
  // SEARCH / EDIT ADDRESS
  // =====================================================

  const searchAddress = async () => {
    if (!address.trim()) {
      Alert.alert(
        "Enter Address",
        "Please enter an address first."
      );
      return;
    }

    try {
      setSearching(true);

      const apiKey =
        process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_KEY;

      if (!apiKey) {
        Alert.alert(
          "Google Maps Error",
          "Google Maps API key is missing."
        );
        return;
      }

      const url =
        `https://maps.googleapis.com/maps/api/geocode/json?address=` +
        encodeURIComponent(address.trim()) +
        `&key=${apiKey}`;

      console.log("🔎 SEARCHING ADDRESS:", address);

      const response = await fetch(url);
      const data = await response.json();

      const encodedPolyline =
  data?.routes?.[0]?.polyline?.encodedPolyline;

const routeCoordinates = encodedPolyline
  ? decodePolyline(encodedPolyline)
  : [];

      console.log("📍 GOOGLE GEOCODE RESPONSE:", data.status);

      if (
        data.status !== "OK" ||
        !data.results ||
        data.results.length === 0
      ) {
        Alert.alert(
          "Address Not Found",
          "Please try a more specific address."
        );
        return;
      }

      const result = data.results[0];

      const newLatitude =
        result.geometry.location.lat;

      const newLongitude =
        result.geometry.location.lng;

      const formattedAddress =
        result.formatted_address;

      // =================================================
      // UPDATE ADDRESS + COORDINATES
      // =================================================

      setAddress(formattedAddress);
      setLatitude(newLatitude);
      setLongitude(newLongitude);

      console.log("✅ LOCATION FOUND:", {
        address: formattedAddress,
        latitude: newLatitude,
        longitude: newLongitude,
      });

      Alert.alert(
        "Location Found",
        "Your delivery location has been updated."
      );
    } catch (error) {
      console.error(
        "❌ Address search error:",
        error
      );

      Alert.alert(
        "Error",
        "Unable to search this address. Please try again."
      );
    } finally {
      setSearching(false);
    }
  };

  // =====================================================
  // CONFIRM + SAVE LOCATION
  // =====================================================

  const confirmAddress = async () => {
    if (!address.trim()) {
      Alert.alert(
        "Address Required",
        "Please enter a delivery address."
      );
      return;
    }

    if (
      latitude === null ||
      longitude === null ||
      Number.isNaN(latitude) ||
      Number.isNaN(longitude)
    ) {
      Alert.alert(
        "Location Required",
        "Please tap 'Find This Location' after entering your address."
      );
      return;
    }

    try {
      setSaving(true);

      // =================================================
      // LOCATION OBJECT
      // =================================================

      const deliveryLocation = {
        address: address.trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        receiverName: receiverName.trim(),
        receiverPhone: phone.trim(),
        landmark: landmark.trim(),
      };

      console.log(
        "💾 SAVING DELIVERY LOCATION:",
        deliveryLocation
      );

      // =================================================
      // SAVE PERMANENTLY ON DEVICE
      // =================================================

      await AsyncStorage.setItem(
        "gonbite_delivery_address",
        JSON.stringify(deliveryLocation)
      );

      console.log(
        "✅ DELIVERY LOCATION SAVED"
      );

      // =================================================
      // GO BACK TO HOME
      // =================================================

     router.back();
    } catch (error) {
      console.error(
        "❌ Failed to save delivery location:",
        error
      );

      Alert.alert(
        "Save Failed",
        "Could not save your delivery location. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFFFF",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* HEADER */}

        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Delivery Address
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "#64748B",
            marginBottom: 24,
          }}
        >
          Choose where you want the food delivered.
        </Text>

        {/* ADDRESS */}

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Search / Edit Address
        </Text>

        <TextInput
          value={address}
          onChangeText={(text) => {
            setAddress(text);

            // If user changes the address,
            // old coordinates should no longer
            // be considered valid.
            setLatitude(null);
            setLongitude(null);
          }}
          placeholder="Enter area, street, landmark, city..."
          placeholderTextColor="#94A3B8"
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: "#111827",
            minHeight: 90,
            textAlignVertical: "top",
            marginBottom: 12,
          }}
        />

        {/* SEARCH BUTTON */}

        <TouchableOpacity
          onPress={searchAddress}
          disabled={searching}
          style={{
            backgroundColor: "#111827",
            padding: 15,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {searching ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "700",
              }}
            >
              🔍 Find This Location
            </Text>
          )}
        </TouchableOpacity>

        {/* SELECTED LOCATION */}

        {latitude !== null &&
          longitude !== null && (
            <View
              style={{
                backgroundColor: "#F8FAFC",
                padding: 15,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: "#111827",
                  marginBottom: 6,
                }}
              >
                📍 Selected Location
              </Text>

              <Text
                style={{
                  fontSize: 13,
                  color: "#64748B",
                }}
              >
                {address}
              </Text>

              <Text
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  marginTop: 6,
                }}
              >
                {latitude.toFixed(6)},{" "}
                {longitude.toFixed(6)}
              </Text>
            </View>
          )}

        {/* RECIPIENT */}

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Recipient Name
        </Text>

        <TextInput
          value={receiverName}
          onChangeText={setReceiverName}
          placeholder="Who should receive the order?"
          placeholderTextColor="#94A3B8"
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: "#111827",
            marginBottom: 16,
          }}
        />

        {/* PHONE */}

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Recipient Phone Number
        </Text>

        <TextInput
          value={phone}
          onChangeText={(text) =>
            setPhone(text.replace(/[^0-9]/g, ""))
          }
          placeholder="10-digit mobile number"
          placeholderTextColor="#94A3B8"
          keyboardType="phone-pad"
          maxLength={10}
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: "#111827",
            marginBottom: 16,
          }}
        />

        {/* LANDMARK */}

        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Landmark (Optional)
        </Text>

        <TextInput
          value={landmark}
          onChangeText={setLandmark}
          placeholder="e.g. Near XYZ School"
          placeholderTextColor="#94A3B8"
          style={{
            borderWidth: 1,
            borderColor: "#CBD5E1",
            borderRadius: 12,
            padding: 14,
            fontSize: 15,
            color: "#111827",
            marginBottom: 28,
          }}
        />

        {/* CONFIRM */}

        <TouchableOpacity
          onPress={confirmAddress}
          disabled={saving}
          style={{
            backgroundColor: "#EF2C1E",
            padding: 17,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 16,
                fontWeight: "700",
              }}
            >
              Confirm Delivery Address
            </Text>
          )}
        </TouchableOpacity>

        {/* BACK */}

        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            padding: 16,
            alignItems: "center",
            marginTop: 8,
          }}
        >
          <Text
            style={{
              color: "#64748B",
              fontSize: 15,
              fontWeight: "600",
            }}
          >
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}