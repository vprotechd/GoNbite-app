import { Ionicons } from "@expo/vector-icons";
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
import { useCart } from "../../context/CartContext";
import api from "../../services/api";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [allDishes, setAllDishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);

  const { cartItems, addToCart, updateQuantity } = useCart();

  // --------------------------------------------------
  // FETCH DISHES + PROFILE
  // --------------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const res = await api.get("/public/restaurants");

        const flattenedDishes = [];

        res.data.forEach((restaurant) => {
          (restaurant.foodItems || []).forEach((dish) => {
            flattenedDishes.push({
              ...dish,
              restaurantName: restaurant.restaurantName,
              restaurantId: restaurant._id,
            });
          });
        });

        setAllDishes(flattenedDishes);

        const profileRes = await api.get("/auth/profile");
        setProfile(profileRes.data);
      } catch (error) {
        console.error("Failed to load data:", error);

        Alert.alert(
          "Error",
          "Could not load menu items. Please try again.",
        );
      } finally {
        setIsLoading(false);
        setIsProfileLoading(false);
      }
    };

    fetchData();
  }, []);

  // --------------------------------------------------
  // SEARCH FILTER
  // --------------------------------------------------
  const filteredDishes = useMemo(() => {
    if (!searchQuery.trim()) {
      return allDishes;
    }

    const query = searchQuery.toLowerCase().trim();

    return allDishes.filter(
      (item) =>
        item.name?.toLowerCase().includes(query) ||
        item.restaurantName?.toLowerCase().includes(query),
    );
  }, [searchQuery, allDishes]);

  // --------------------------------------------------
  // CART TOTALS
  // --------------------------------------------------
  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* =====================================================
            SEARCH HEADER
        ====================================================== */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#0B0F14"
            />
          </TouchableOpacity>

          <View style={styles.searchInputContainer}>

            <Ionicons
              name="search-outline"
              size={17}
              color="#F5B82E"
            />

            <TextInput
              style={styles.searchInput}
              placeholder="Search dishes or restaurants"
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <Ionicons
                  name="close-circle"
                  size={17}
                  color="#64748B"
                />
              </TouchableOpacity>
            )}

          </View>
        </View>

        {/* =====================================================
            CONTENT
        ====================================================== */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* LOADING */}
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator
                size="large"
                color="#F5B82E"
              />

              <Text style={styles.loadingText}>
                Loading menu items...
              </Text>
            </View>
          ) : (
            <>
              {/* =================================================
                  SEARCH HAS TEXT
              ================================================== */}
              {searchQuery.length > 0 ? (
                <>
                  {/* NO RESULTS */}
                  {filteredDishes.length === 0 ? (
                    <View style={styles.emptyState}>

                      <Ionicons
                        name="search-outline"
                        size={52}
                        color="#D1D5DB"
                      />

                      <Text style={styles.emptyTitle}>
                        No results found
                      </Text>

                      <Text style={styles.emptySubtitle}>
                        We couldn't find anything matching
                      </Text>

                      <Text style={styles.searchKeyword}>
                        "{searchQuery}"
                      </Text>

                    </View>
                  ) : (
                    <View style={styles.resultSection}>

                      {/* =================================================
                          CART SUMMARY
                      ================================================== */}
                      {totalItems > 0 && (
                        <View style={styles.cartSummaryContainer}>

                          <View style={styles.cartSummaryLeft}>

                            <Text
                              style={styles.cartSummaryText}
                              numberOfLines={1}
                            >
                              {totalItems} item
                              {totalItems > 1 ? "s" : ""} • ₹
                              {totalPrice}
                            </Text>

                            {/* ADDRESS */}
                            <View style={styles.addressRow}>

                              <Ionicons
                                name="location"
                                size={12}
                                color="#F5B82E"
                              />

                              {isProfileLoading ? (
                                <Text
                                  style={styles.addressText}
                                  numberOfLines={1}
                                >
                                  Loading address...
                                </Text>
                              ) : profile?.address ? (
                                <Text
                                  style={styles.addressText}
                                  numberOfLines={1}
                                >
                                  {profile.address}
                                </Text>
                              ) : (
                                <TouchableOpacity
                                  onPress={() =>
                                    router.push(
                                      "/(tabs)/profile",
                                    )
                                  }
                                >
                                  <Text
                                    style={
                                      styles.addressActionText
                                    }
                                  >
                                    Add address
                                  </Text>
                                </TouchableOpacity>
                              )}

                            </View>
                          </View>

                          {/* VIEW CART */}
                          <TouchableOpacity
                            style={styles.viewCartBtn}
                            onPress={() =>
                              router.push("/(tabs)/cart")
                            }
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name="cart-outline"
                              size={14}
                              color="#0B0F14"
                            />

                            <Text style={styles.viewCartBtnText}>
                              Cart
                            </Text>
                          </TouchableOpacity>

                        </View>
                      )}

                      {/* RESULTS TITLE */}
                      <View style={styles.resultsHeader}>
                        <Text style={styles.sectionTitle}>
                          Results
                        </Text>

                        <Text style={styles.resultCount}>
                          {filteredDishes.length}
                        </Text>
                      </View>

                      {/* =================================================
                          DISH RESULTS
                      ================================================== */}
                      {filteredDishes.map((item) => {

                        const cartItem = cartItems.find(
                          (i) => i._id === item._id,
                        );

                        const currentQty = cartItem
                          ? cartItem.quantity
                          : 0;

                        return (
                          <View
                            key={item._id}
                            style={styles.dishItem}
                          >

                            {/* DISH IMAGE */}
                            <Image
                              source={{
                                uri: item.imageUrl
                                  ? `http://localhost:5000${item.imageUrl}`
                                  : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
                              }}
                              style={styles.dishImage}
                              resizeMode="cover"
                            />

                            {/* DISH INFORMATION */}
                            <View style={styles.dishInfo}>

                              <Text
                                style={styles.dishName}
                                numberOfLines={1}
                              >
                                {item.name}
                              </Text>

                              <Text
                                style={styles.dishRestaurant}
                                numberOfLines={1}
                              >
                                {item.restaurantName}
                              </Text>

                              <Text style={styles.dishPrice}>
                                ₹{item.price}
                              </Text>

                            </View>

                            {/* =================================================
                                QUANTITY CONTROLS
                            ================================================== */}
                            <View
                              style={styles.quantityContainer}
                            >

                              {currentQty > 0 ? (
                                <>

                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() =>
                                      updateQuantity(
                                        item._id,
                                        -1,
                                      )
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons
                                      name="remove"
                                      size={13}
                                      color="#F5B82E"
                                    />
                                  </TouchableOpacity>

                                  <Text style={styles.qtyText}>
                                    {currentQty}
                                  </Text>

                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() =>
                                      updateQuantity(
                                        item._id,
                                        1,
                                      )
                                    }
                                    activeOpacity={0.7}
                                  >
                                    <Ionicons
                                      name="add"
                                      size={13}
                                      color="#F5B82E"
                                    />
                                  </TouchableOpacity>

                                </>
                              ) : (
                                <TouchableOpacity
                                  style={styles.addBtn}
                                  onPress={() =>
                                    addToCart(item)
                                  }
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name="add-circle"
                                    size={27}
                                    color="#F5B82E"
                                  />
                                </TouchableOpacity>
                              )}

                            </View>

                          </View>
                        );
                      })}

                    </View>
                  )}
                </>
              ) : (
                /* =================================================
                   INITIAL STATE
                ================================================== */
                <View style={styles.initialState}>

                  <View style={styles.initialIconCircle}>
                    <Ionicons
                      name="fast-food-outline"
                      size={42}
                      color="#F5B82E"
                    />
                  </View>

                  <Text style={styles.initialTitle}>
                    Find your flavor
                  </Text>

                  <Text style={styles.initialSubtitle}>
                    Search your favorite dishes or restaurants
                  </Text>

                </View>
              )}
            </>
          )}

          <View style={{ height: 25 }} />

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  // ============================================================
  // MAIN
  // ============================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ============================================================
  // HEADER
  // ============================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },

  searchInputContainer: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#0B0F14",
    marginLeft: 7,
    paddingVertical: 0,
  },

  clearButton: {
    padding: 2,
  },

  // ============================================================
  // SCROLL
  // ============================================================

  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
  },

  // ============================================================
  // LOADING
  // ============================================================

  loadingState: {
    alignItems: "center",
    marginTop: 55,
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontSize: 12,
  },

  // ============================================================
  // EMPTY
  // ============================================================

  emptyState: {
    alignItems: "center",
    marginTop: 55,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0B0F14",
    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
  },

  searchKeyword: {
    fontSize: 12,
    color: "#F5B82E",
    fontWeight: "700",
    marginTop: 3,
    textAlign: "center",
  },

  // ============================================================
  // INITIAL STATE
  // ============================================================

  initialState: {
    alignItems: "center",
    marginTop: 85,
    paddingHorizontal: 35,
  },

  initialIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FFF5D9",
    alignItems: "center",
    justifyContent: "center",
  },

  initialTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 12,
  },

  initialSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 5,
    textAlign: "center",
    lineHeight: 17,
  },

  // ============================================================
  // RESULTS
  // ============================================================

  resultSection: {
    marginTop: 12,
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  resultCount: {
    marginLeft: 7,
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    backgroundColor: "#E9EDF2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },

  // ============================================================
  // CART SUMMARY
  // ============================================================

  cartSummaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E7",
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  cartSummaryLeft: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },

  cartSummaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B0F14",
  },

  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },

  addressText: {
    fontSize: 10,
    color: "#64748B",
    marginLeft: 3,
    flex: 1,
  },

  addressActionText: {
    fontSize: 10,
    color: "#F5B82E",
    fontWeight: "700",
    marginLeft: 3,
  },

  viewCartBtn: {
    backgroundColor: "#F5B82E",
    minWidth: 58,
    height: 29,
    paddingHorizontal: 8,
    borderRadius: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  viewCartBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 11,
  },

  // ============================================================
  // DISH CARD
  // ============================================================

  dishItem: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 11,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E6EB",

    // Keeps the card compact on smaller phones
    minHeight: 76,
  },

  dishImage: {
    width: 54,
    height: 54,
    borderRadius: 9,
    backgroundColor: "#E9EDF2",
  },

  dishInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 9,
    marginRight: 5,
  },

  dishName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F14",
  },

  dishRestaurant: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 2,
  },

  dishPrice: {
    fontSize: 12,
    fontWeight: "800",
    color: "#F5B82E",
    marginTop: 3,
  },

  // ============================================================
  // QUANTITY
  // ============================================================

  quantityContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },

  qtyBtn: {
    width: 23,
    height: 23,
    borderRadius: 7,
    backgroundColor: "#FFF8E7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  qtyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F14",
    minWidth: 18,
    textAlign: "center",
  },

  addBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});