import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api";

import ScanModal from "../../components/ScanModal";
//import VoiceModal from "../../components/VoiceModal";

// ======================================================
// CATEGORIES
// ======================================================

const categories = [
  {
    id: "1",
    name: "Pizza",
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500",
  },
  {
    id: "2",
    name: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500",
  },
  {
    id: "3",
    name: "Biryani",
    image: "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=500",
  },
  {
    id: "4",
    name: "Chinese",
    image: "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=500",
  },
  {
    id: "5",
    name: "Desserts",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500",
  },
  {
    id: "6",
    name: "Drinks",
    image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500",
  },
  {
    id: "7",
    name: "Sushi",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500",
  },
  {
    id: "8",
    name: "Pasta",
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500",
  },
  {
    id: "9",
    name: "Tacos",
    image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500",
  },
  {
    id: "10",
    name: "Sandwiches",
    image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500",
  },
  {
    id: "11",
    name: "Breakfast",
    image: "https://images.unsplash.com/photo-1533089862012-0d15303510ae?w=500",
  },
  {
    id: "12",
    name: "Seafood",
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500",
  },
];

// ======================================================
// HOME SCREEN
// ======================================================

export default function HomeScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [greeting, setGreeting] = useState("Good Morning");

  const [locationQuery, setLocationQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);

  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const [showAllRestaurants, setShowAllRestaurants] = useState(false);

  // ======================================================
  // ORDER FOUND
  // ======================================================

  const handleOrderFound = (data) => {
    console.log("📦 Order found via voice/scan:", data);

    setSearchQuery(data);

    setScanModalVisible(false);
    setVoiceModalVisible(false);
  };

  // ======================================================
  // GREETING
  // ======================================================

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good Morning ☀️");
      } else if (hour >= 12 && hour < 17) {
        setGreeting("Good Afternoon 🌤️");
      } else if (hour >= 17 && hour < 21) {
        setGreeting("Good Evening 🌅");
      } else {
        setGreeting("Good Night 🌙");
      }
    };

    updateGreeting();

    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  // ======================================================
  // FETCH RESTAURANTS
  // ======================================================

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);

        const response = await api.get("/public/restaurants");

        setRestaurants(response.data);
      } catch (error) {
        console.error("Failed to load restaurants:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  // ======================================================
  // CURRENT LOCATION
  // ======================================================

  const getCurrentLocation = async () => {
    setIsGettingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Allow location access to find nearby restaurants.",
        );

        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode.length > 0) {
        const { city, region, subregion } = geocode[0];

        setLocationQuery(city || region || subregion || "Your Area");
      } else {
        setLocationQuery("Current Area");
      }
    } catch (error) {
      console.error("Location Error:", error);

      Alert.alert("Error", "Failed to get current location.");
    } finally {
      setIsGettingLocation(false);
    }
  };

  // ======================================================
  // FILTER RESTAURANTS
  // ======================================================

  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // LOCATION FILTER
    if (locationQuery.trim()) {
      const locWords = locationQuery.toLowerCase().split(" ");

      filtered = filtered.filter((r) => {
        const address = (r.address || "").toLowerCase();

        return locWords.some((word) => address.includes(word));
      });
    }

    // CATEGORY FILTER
    if (selectedCategory) {
      filtered = filtered.filter((restaurant) => {
        return (restaurant.foodItems || []).some(
          (item) =>
            item.category?.toLowerCase() === selectedCategory.toLowerCase(),
        );
      });
    }

    // SEARCH FILTER
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter((restaurant) => {
        const matchName = restaurant.restaurantName
          .toLowerCase()
          .includes(query);

        const matchFood = (restaurant.foodItems || []).some((item) =>
          item.name.toLowerCase().includes(query),
        );

        return matchName || matchFood;
      });
    }

    return filtered;
  }, [locationQuery, searchQuery, selectedCategory, restaurants]);

  // ======================================================
  // CATEGORY
  // ======================================================

  const handleCategoryPress = (categoryName) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryName);
    }
  };

  // ======================================================
  // DISPLAY RESTAURANTS
  // ======================================================

  const displayedRestaurants = showAllRestaurants
    ? filteredRestaurants
    : filteredRestaurants.slice(0, 6);

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.topHeader}>
          <View style={styles.logoContainer}>
            <Image
              source={require("../../../assets/images/Logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={20} color="#F5B82E" />
          </TouchableOpacity>
        </View>

        {/* ==================================================
            MAIN SCROLL
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* GREETING */}

          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{greeting}</Text>

            <Text style={styles.question}>Where do you want to eat today?</Text>
          </View>

          {/* ==================================================
              SMART ORDER BUTTONS
          ================================================== */}

          <View style={styles.smartOrderRow}>
            <TouchableOpacity
              style={styles.smartButton}
              onPress={() => setScanModalVisible(true)}
            >
              <Ionicons name="scan-outline" size={14} color="#F5B82E" />

              <Text style={styles.smartButtonText}>Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.smartButton}
              onPress={() => setVoiceModalVisible(true)}
            >
              <Ionicons name="mic" size={14} color="#F5B82E" />

              <Text style={styles.smartButtonText}>Voice</Text>
            </TouchableOpacity>
          </View>

          {/* ==================================================
              SEARCH
          ================================================== */}

          <View style={styles.searchContainer}>
            {/* LOCATION */}

            <View style={styles.inputBox}>
              <Ionicons
                name="location"
                size={16}
                color="#F5B82E"
                style={styles.inputPrefix}
              />

              <TextInput
                placeholder="Delivery location"
                placeholderTextColor="#64748B"
                style={styles.textInput}
                value={locationQuery}
                onChangeText={setLocationQuery}
              />

              <TouchableOpacity
                onPress={getCurrentLocation}
                style={styles.gpsBtn}
                disabled={isGettingLocation}
              >
                <Ionicons name="locate" size={18} color="#F5B82E" />

                {isGettingLocation && (
                  <ActivityIndicator
                    size="small"
                    color="#F5B82E"
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>

              {locationQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setLocationQuery("")}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={17} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            {/* SEARCH */}

            <View style={styles.inputBox}>
              <Ionicons
                name="search-outline"
                size={16}
                color="#F5B82E"
                style={styles.inputPrefix}
              />

              <TextInput
                placeholder="Search for food or restaurants"
                placeholderTextColor="#64748B"
                style={styles.textInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />

              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  style={styles.clearBtn}
                >
                  <Ionicons name="close-circle" size={17} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ==================================================
              PROMOTION
          ================================================== */}

         <TouchableOpacity
  style={styles.banner}
  activeOpacity={0.9}
  onPress={() => router.push("/(tabs)/limited-offer")}
>
  <View style={styles.bannerContent}>
    <Text style={styles.bannerSmall}>
      LIMITED TIME OFFER
    </Text>

    <Text style={styles.bannerTitle}>
      50% OFF
    </Text>

    <Text style={styles.bannerDescription}>
      On selected dishes
    </Text>

    <View style={styles.bannerButton}>
      <Text style={styles.bannerButtonText}>
        Order Now
      </Text>

      <Ionicons
        name="arrow-forward"
        size={13}
        color="#0B0F14"
      />
    </View>
  </View>

  <View style={styles.bannerShape}>
    <Ionicons
      name="fast-food-outline"
      size={42}
      color="#F5B82E"
    />
  </View>
</TouchableOpacity>

          {/* ==================================================
              CATEGORIES HEADER
          ================================================== */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explore categories</Text>

            <TouchableOpacity
              onPress={() => {
                setSelectedCategory(null);
              }}
            >
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {/* ==================================================
              CATEGORY LIST
          ================================================== */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.name;

              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryItem,
                    isSelected && styles.categoryItemSelected,
                  ]}
                  onPress={() => handleCategoryPress(cat.name)}
                >
                  <View
                    style={[
                      styles.categoryImageContainer,
                      isSelected && styles.categoryImageContainerSelected,
                    ]}
                  >
                    <Image
                      source={{ uri: cat.image }}
                      style={styles.categoryImage}
                    />
                  </View>

                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && styles.categoryNameSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* ==================================================
              RESTAURANT HEADER
          ================================================== */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory
                ? `"${selectedCategory}" Restaurants`
                : "Popular restaurants"}
            </Text>

            <TouchableOpacity
              onPress={() => setShowAllRestaurants(!showAllRestaurants)}
            >
              <Text style={styles.seeAll}>
                {showAllRestaurants ? "Show Less" : "See all"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================================
              LOADING
          ================================================== */}

          {isLoading ? (
            <ActivityIndicator
              size="large"
              color="#F5B82E"
              style={{ marginTop: 20 }}
            />
          ) : displayedRestaurants.length === 0 ? (
            <Text style={styles.noResults}>
              {selectedCategory
                ? `No restaurants found for "${selectedCategory}"`
                : searchQuery.trim() || locationQuery.trim()
                  ? "No results found"
                  : "No restaurants available nearby yet."}
            </Text>
          ) : (
            displayedRestaurants.map((restaurant) => (
              <TouchableOpacity
                key={restaurant._id}
                style={styles.restaurantCard}
                activeOpacity={0.9}
                onPress={() =>
                  router.push({
                    pathname: "/restaurant-menu",

                    params: {
                      name: restaurant.restaurantName,

                      imageUrl: restaurant.imageUrl || "",

                      address: restaurant.address || "",

                      cuisine: restaurant.cuisineType || "",

                      foodItems: JSON.stringify(restaurant.foodItems || []),
                    },
                  })
                }
              >
                {/* ==================================================
                    RESTAURANT IMAGE
                    FULL IMAGE VISIBLE
                ================================================== */}

                <Image
                  source={{
                    uri: restaurant.imageUrl
                      ? `http://localhost:5000${restaurant.imageUrl}`
                      : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
                  }}
                  style={styles.restaurantImage}
                  resizeMode="contain"
                />

                {/* FAVORITE */}

                <TouchableOpacity style={styles.favoriteButton}>
                  <Ionicons name="heart-outline" size={17} color="#F5B82E" />
                </TouchableOpacity>

                {/* RESTAURANT INFO */}

                <View style={styles.restaurantInfo}>
                  <Text style={styles.restaurantName} numberOfLines={1}>
                    {restaurant.restaurantName}
                  </Text>

                  <Text style={styles.cuisine}>
                    {restaurant.cuisineType || "Multi-Cuisine"}
                  </Text>

                  {/* LOCATION */}

                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location-outline"
                      size={12}
                      color="#64748B"
                    />

                    <Text style={styles.restaurantAddress} numberOfLines={1}>
                      {restaurant.address || "Location unavailable"}
                    </Text>
                  </View>

                  {/* FOOD PREVIEW */}

                  {restaurant.foodItems && restaurant.foodItems.length > 0 && (
                    <View style={styles.foodPreviewContainer}>
                      {restaurant.foodItems.slice(0, 2).map((item, idx) => (
                        <View key={idx} style={styles.foodPreviewItem}>
                          <Ionicons
                            name="restaurant"
                            size={10}
                            color="#F5B82E"
                          />

                          <Text
                            style={styles.foodPreviewText}
                            numberOfLines={1}
                          >
                            {item.name} (₹
                            {item.price})
                          </Text>
                        </View>
                      ))}

                      {restaurant.foodItems.length > 2 && (
                        <Text style={styles.moreItemsText}>
                          +{restaurant.foodItems.length - 2} more
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}

          <View style={{ height: 30 }} />
        </ScrollView>

        {/* ==================================================
            MODALS
        ================================================== */}

        <ScanModal
          visible={scanModalVisible}
          onClose={() => setScanModalVisible(false)}
          onOrderFound={handleOrderFound}
        />

        {/* <VoiceModal
          visible={voiceModalVisible}
          onClose={() =>
            setVoiceModalVisible(false)
          }
          onOrderFound={handleOrderFound}
        /> */}
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  // ====================================================
  // MAIN
  // ====================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ====================================================
  // HEADER
  // ====================================================

  topHeader: {
    backgroundColor: "#081A33",

    paddingHorizontal: 10,
    paddingTop: 5,
    paddingBottom: 5,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    position: "relative",

    height: 62,
  },

  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },

  logoImage: {
    width: 125,
    height: 52,
  },

  notificationButton: {
    position: "absolute",

    right: 10,
    top: 14,

    width: 32,
    height: 32,

    borderRadius: 16,

    backgroundColor: "#0D2A4A",

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  // ====================================================
  // SCROLL
  // ====================================================

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 80,
  },

  // ====================================================
  // GREETING
  // ====================================================

  greetingSection: {
    marginTop: 10,
    marginBottom: 8,
  },

  greeting: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F14",
  },

  question: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },

  // ====================================================
  // SMART BUTTONS
  // ====================================================

  smartOrderRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 7,
    marginBottom: 8,
  },

  smartButton: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 13,

    borderWidth: 1,
    borderColor: "#F5B82E",

    gap: 4,
  },

  smartButtonText: {
    color: "#0B0F14",
    fontWeight: "600",
    fontSize: 11,
  },

  // ====================================================
  // SEARCH
  // ====================================================

  searchContainer: {
    gap: 7,
    marginBottom: 8,
  },

  inputBox: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#FFFFFF",

    height: 38,

    borderRadius: 9,

    paddingHorizontal: 9,

    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  inputPrefix: {
    marginRight: 6,
  },

  textInput: {
    flex: 1,

    fontSize: 12,

    color: "#0B0F14",
  },

  clearBtn: {
    padding: 2,
  },

  gpsBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  // ====================================================
  // PROMOTION BANNER
  // ====================================================

  banner: {
    height: 96,

    backgroundColor: "#081A33",

    borderRadius: 14,

    marginTop: 8,

    padding: 12,

    overflow: "hidden",

    flexDirection: "row",

    justifyContent: "space-between",

    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  bannerContent: {
    justifyContent: "center",
  },

  bannerSmall: {
    color: "#F5B82E",

    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.8,
  },

  bannerTitle: {
    color: "#F5B82E",

    fontSize: 19,

    fontWeight: "900",

    marginTop: 2,
  },

  bannerDescription: {
    color: "#FFFFFF",

    fontSize: 10,

    marginTop: 2,
  },

  bannerButton: {
    backgroundColor: "#F5B82E",

    paddingHorizontal: 10,

    height: 28,

    borderRadius: 7,

    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    marginTop: 6,
  },

  bannerButtonText: {
    color: "#0B0F14",

    fontWeight: "700",

    fontSize: 10,

    marginRight: 3,
  },

  bannerShape: {
    width: 48,
    height: 48,

    borderRadius: 24,

    backgroundColor: "rgba(245, 184, 46, 0.1)",

    justifyContent: "center",

    alignItems: "center",

    alignSelf: "center",
  },

  // ====================================================
  // SECTION HEADER
  // ====================================================

  sectionHeader: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginTop: 12,

    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 15,

    fontWeight: "800",

    color: "#0B0F14",
  },

  seeAll: {
    fontSize: 11,

    fontWeight: "700",

    color: "#F5B82E",
  },

  // ====================================================
  // CATEGORIES
  // ====================================================

  categoryContainer: {
    paddingRight: 6,
  },

  categoryItem: {
    width: 58,

    alignItems: "center",

    marginRight: 8,
  },

  categoryItemSelected: {
    transform: [
      {
        scale: 1.05,
      },
    ],
  },

  categoryImageContainer: {
    width: 46,
    height: 46,

    borderRadius: 23,

    backgroundColor: "#FFFFFF",

    overflow: "hidden",

    borderWidth: 2,

    borderColor: "#E2E6EB",
  },

  categoryImageContainerSelected: {
    borderColor: "#F5B82E",

    borderWidth: 3,
  },

  categoryImage: {
    width: "100%",
    height: "100%",
  },

  categoryName: {
    fontSize: 9,

    fontWeight: "600",

    color: "#64748B",

    marginTop: 3,

    textAlign: "center",
  },

  categoryNameSelected: {
    color: "#0B0F14",

    fontWeight: "800",
  },

  // ====================================================
  // RESTAURANT CARD
  // ====================================================

  restaurantCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 12,

    marginBottom: 10,

    overflow: "hidden",

    borderWidth: 1,

    borderColor: "#E2E6EB",

    boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",

    width: "96%",

    maxWidth: 420,

    alignSelf: "center",
  },

  // IMPORTANT:
  // contain = complete image visible
  // instead of cropping with cover.

  restaurantImage: {
    width: "100%",

    aspectRatio: 16 / 9,

    backgroundColor: "#EEF2F6",

    resizeMode: "contain",
  },

  // ====================================================
  // FAVORITE
  // ====================================================

  favoriteButton: {
    position: "absolute",

    right: 8,

    top: 8,

    width: 28,
    height: 28,

    borderRadius: 14,

    backgroundColor: "rgba(8, 26, 51, 0.7)",

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderColor: "#F5B82E",
  },

  // ====================================================
  // RESTAURANT INFO
  // ====================================================

  restaurantInfo: {
    padding: 9,
  },

  restaurantName: {
    fontSize: 14,

    fontWeight: "800",

    color: "#0B0F14",
  },

  cuisine: {
    fontSize: 10,

    color: "#64748B",

    marginTop: 2,
  },

  locationRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 2,
  },

  restaurantAddress: {
    flex: 1,

    fontSize: 9,

    color: "#64748B",

    marginLeft: 3,
  },

  // ====================================================
  // FOOD PREVIEW
  // ====================================================

  foodPreviewContainer: {
    marginTop: 6,

    borderTopWidth: 1,

    borderTopColor: "#E2E6EB",

    paddingTop: 6,
  },

  foodPreviewItem: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 2,
  },

  foodPreviewText: {
    fontSize: 10,

    color: "#0B0F14",

    marginLeft: 4,

    fontWeight: "500",

    flex: 1,
  },

  moreItemsText: {
    fontSize: 10,

    color: "#F5B82E",

    fontWeight: "600",

    marginTop: 2,
  },

  // ====================================================
  // NO RESULTS
  // ====================================================

  noResults: {
    textAlign: "center",

    color: "#64748B",

    marginTop: 20,

    fontSize: 12,
  },

  // ====================================================
  // BOTTOM NAV
  // ====================================================

  bottomNavbar: {
    position: "absolute",

    bottom: 0,

    left: 0,

    right: 0,

    flexDirection: "row",

    justifyContent: "space-around",

    alignItems: "center",

    backgroundColor: "#081A33",

    paddingVertical: 8,

    paddingBottom: 14,

    borderTopWidth: 1,

    borderTopColor: "#F5B82E",

    boxShadow: "0px -2px 10px rgba(0,0,0,0.1)",
  },

  navItem: {
    alignItems: "center",

    justifyContent: "center",
  },

  navText: {
    fontSize: 9,

    color: "#FFFFFF",

    marginTop: 2,

    fontWeight: "500",
  },
});
