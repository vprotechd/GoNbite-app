
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

import {
  getWishlist,
  removeFromWishlist,
} from "../../services/wishlist";

import api from "../../services/api";

// ======================================================
// COLORS
// ======================================================

const COLORS = {
  navy: "#081A33",
  orange: "#FF6638",
  cream: "#FFF9F5",
  text: "#171717",
  muted: "#64748B",
  border: "#E8E8E8",
  white: "#FFFFFF",
  lightOrange: "rgba(255, 102, 56, 0.12)",
};

// ======================================================
// FALLBACK IMAGE
// ======================================================

const FALLBACK_RESTAURANT_IMAGE =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000";

// ======================================================
// IMAGE HELPER
// ======================================================

const getImageUri = (imageUrl) => {
  if (!imageUrl) {
    return FALLBACK_RESTAURANT_IMAGE;
  }

  const value = String(imageUrl).trim();

  if (!value) {
    return FALLBACK_RESTAURANT_IMAGE;
  }

  // Already complete URL
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const baseURL = api.defaults?.baseURL || "";

  const origin = baseURL
    .replace(/\/api\/?$/i, "")
    .replace(/\/$/, "");

  if (!origin) {
    return value;
  }

  return `${origin}${value.startsWith("/") ? value : `/${value}`}`;
};

// ======================================================
// WISHLIST SCREEN
// ======================================================

export default function WishlistScreen() {
  const { width: screenWidth } = useWindowDimensions();

  // ======================================================
  // RESPONSIVE
  // ======================================================

  const isMobile = screenWidth < 768;

  const isTablet =
    screenWidth >= 768 && screenWidth < 1200;

  const isDesktop = screenWidth >= 1200;

  const horizontalPadding = isMobile
    ? screenWidth < 380
      ? 14
      : 18
    : isTablet
      ? 28
      : 40;

  const contentMaxWidth = 1400;

  // ======================================================
  // STATE
  // ======================================================

  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // ======================================================
  // LOAD WISHLIST
  // ======================================================

  const loadWishlist = async () => {
    try {
      setIsLoading(true);

      const savedWishlist = await getWishlist();

      setWishlist(
        Array.isArray(savedWishlist)
          ? savedWishlist
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load wishlist:",
        error
      );

      setWishlist([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ======================================================
  // RELOAD WHEN SCREEN GETS FOCUS
  // ======================================================

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [])
  );

  // ======================================================
  // REMOVE FROM WISHLIST
  // ======================================================

  const handleRemove = async (restaurantId) => {
    if (!restaurantId) return;

    try {
      setRemovingId(restaurantId);

      const updatedWishlist =
        await removeFromWishlist(restaurantId);

      setWishlist(
        Array.isArray(updatedWishlist)
          ? updatedWishlist
          : []
      );
    } catch (error) {
      console.error(
        "Failed to remove wishlist item:",
        error
      );
    } finally {
      setRemovingId(null);
    }
  };

  // ======================================================
  // OPEN RESTAURANT
  // ======================================================

  const openRestaurant = (restaurant) => {
    if (!restaurant) return;

    router.push({
      pathname: "/restaurant-menu",
      params: {
        name: restaurant.restaurantName || "",
        imageUrl: restaurant.imageUrl || "",
        address: restaurant.address || "",
        cuisine: restaurant.cuisineType || "",
        foodItems: JSON.stringify(
          restaurant.foodItems || []
        ),
      },
    });
  };

  // ======================================================
  // CARD WIDTH
  // ======================================================

  const getCardWidth = () => {
    if (isDesktop) {
      return "31.9%";
    }

    if (isTablet) {
      return "48.5%";
    }

    return "100%";
  };

  // ======================================================
  // RENDER
  // ======================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.navy}
      />

      <View style={styles.container}>

        {/* ==================================================
            HEADER
        ================================================== */}

        <View
          style={[
            styles.header,
            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={COLORS.white}
            />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Ionicons
              name="heart"
              size={21}
              color={COLORS.orange}
            />

            <Text style={styles.headerTitle}>
              Wishlist
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.countText}>
              {wishlist.length}
            </Text>
          </View>
        </View>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal:
                horizontalPadding,
            },
          ]}
        >
          <View
            style={[
              styles.contentShell,
              {
                maxWidth: contentMaxWidth,
              },
            ]}
          >

            {/* ==================================================
                TITLE
            ================================================== */}

            <View style={styles.titleSection}>
              <Text style={styles.pageTitle}>
                Your Favorite Restaurants
              </Text>

              <Text style={styles.pageSubtitle}>
                Restaurants you have saved for later
              </Text>
            </View>

            {/* ==================================================
                LOADING
            ================================================== */}

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={COLORS.orange}
                />

                <Text style={styles.loadingText}>
                  Loading your wishlist...
                </Text>
              </View>
            ) : wishlist.length === 0 ? (

              /* ==================================================
                  EMPTY WISHLIST
              ================================================== */

              <View style={styles.emptyContainer}>
                <View
                  style={
                    styles.emptyIconContainer
                  }
                >
                  <Ionicons
                    name="heart-outline"
                    size={48}
                    color={COLORS.orange}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  Your wishlist is empty
                </Text>

                <Text
                  style={
                    styles.emptyDescription
                  }
                >
                  Like your favorite restaurants
                  and they will appear here.
                </Text>

                <TouchableOpacity
                  style={styles.exploreButton}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push("/(tabs)/")
                  }
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={17}
                    color={COLORS.white}
                  />

                  <Text
                    style={
                      styles.exploreButtonText
                    }
                  >
                    Explore Restaurants
                  </Text>
                </TouchableOpacity>
              </View>

            ) : (

              /* ==================================================
                  WISHLIST GRID
              ================================================== */

              <View style={styles.restaurantGrid}>
                {wishlist.map((restaurant) => {
                  const imageUri = getImageUri(
                    restaurant?.imageUrl
                  );

                  const restaurantId =
                    restaurant?._id ||
                    restaurant?.id;

                  return (
                    <View
                      key={restaurantId}
                      style={[
                        styles.gridItem,
                        {
                          width: getCardWidth(),
                        },
                      ]}
                    >
                      <View
                        style={
                          styles.restaurantCard
                        }
                      >

                        {/* ==================================================
                            IMAGE
                        ================================================== */}

                        <TouchableOpacity
                          activeOpacity={0.9}
                          onPress={() =>
                            openRestaurant(
                              restaurant
                            )
                          }
                        >
                          <View
                            style={
                              styles.imageWrapper
                            }
                          >
                            <Image
                              source={{
                                uri: imageUri,
                              }}
                              style={
                                styles.restaurantImage
                              }
                              resizeMode="cover"
                              onError={(event) => {
                                console.log(
                                  "Wishlist image failed:",
                                  imageUri
                                );
                              }}
                            />

                            {/* SAVED BADGE */}

                            <View
                              style={
                                styles.savedBadge
                              }
                            >
                              <Ionicons
                                name="heart"
                                size={13}
                                color={
                                  COLORS.white
                                }
                              />

                              <Text
                                style={
                                  styles.savedBadgeText
                                }
                              >
                                Saved
                              </Text>
                            </View>
                          </View>

                          {/* ==================================================
                              INFO
                          ================================================== */}

                          <View
                            style={
                              styles.restaurantInfo
                            }
                          >
                            <Text
                              style={
                                styles.restaurantName
                              }
                              numberOfLines={1}
                            >
                              {restaurant?.restaurantName ||
                                "Restaurant"}
                            </Text>

                            <Text
                              style={
                                styles.cuisine
                              }
                              numberOfLines={1}
                            >
                              {restaurant
                                ?.cuisineType ||
                                "Multi-Cuisine"}
                            </Text>

                            <View
                              style={
                                styles.locationRow
                              }
                            >
                              <Ionicons
                                name="location-outline"
                                size={13}
                                color={
                                  COLORS.muted
                                }
                              />

                              <Text
                                style={
                                  styles.restaurantAddress
                                }
                                numberOfLines={1}
                              >
                                {restaurant
                                  ?.address ||
                                  "Location unavailable"}
                              </Text>
                            </View>

                            {/* FOOD PREVIEW */}

                            {Array.isArray(
                              restaurant?.foodItems
                            ) &&
                              restaurant.foodItems
                                .length > 0 && (
                                <View
                                  style={
                                    styles.foodPreview
                                  }
                                >
                                  {restaurant.foodItems
                                    .slice(0, 2)
                                    .map(
                                      (
                                        item,
                                        index
                                      ) => (
                                        <View
                                          key={
                                            item?._id ||
                                            index
                                          }
                                          style={
                                            styles.foodItem
                                          }
                                        >
                                          <Ionicons
                                            name="restaurant"
                                            size={10}
                                            color={
                                              COLORS.orange
                                            }
                                          />

                                          <Text
                                            style={
                                              styles.foodText
                                            }
                                            numberOfLines={
                                              1
                                            }
                                          >
                                            {item?.name ||
                                              "Food item"}{" "}
                                            {item?.price !=
                                            null
                                              ? `(₹${item.price})`
                                              : ""}
                                          </Text>
                                        </View>
                                      )
                                    )}

                                  {restaurant
                                    .foodItems
                                    .length > 2 && (
                                    <Text
                                      style={
                                        styles.moreItems
                                      }
                                    >
                                      +
                                      {restaurant
                                        .foodItems
                                        .length - 2}{" "}
                                      more
                                    </Text>
                                  )}
                                </View>
                              )}
                          </View>
                        </TouchableOpacity>

                        {/* ==================================================
                            REMOVE HEART
                        ================================================== */}

                        <TouchableOpacity
                          style={
                            styles.removeButton
                          }
                          activeOpacity={0.8}
                          disabled={
                            removingId ===
                            restaurantId
                          }
                          onPress={() =>
                            handleRemove(
                              restaurantId
                            )
                          }
                        >
                          {removingId ===
                          restaurantId ? (
                            <ActivityIndicator
                              size="small"
                              color={
                                COLORS.orange
                              }
                            />
                          ) : (
                            <Ionicons
                              name="heart"
                              size={18}
                              color={
                                COLORS.orange
                              }
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },

  container: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },

  // ====================================================
  // HEADER
  // ====================================================

  header: {
    minHeight: 70,
    backgroundColor: COLORS.navy,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(255,255,255,0.08)",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor:
      "rgba(255,255,255,0.15)",
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "800",
  },

  headerRight: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lightOrange,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.orange,
  },

  countText: {
    color: COLORS.orange,
    fontSize: 13,
    fontWeight: "800",
  },

  // ====================================================
  // SCROLL
  // ====================================================

  scrollContent: {
    paddingTop: 10,
    paddingBottom: 40,
    width: "100%",
  },

  contentShell: {
    width: "100%",
    alignSelf: "center",
  },

  // ====================================================
  // TITLE
  // ====================================================

  titleSection: {
    marginTop: 8,
    marginBottom: 16,
  },

  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },

  pageSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: COLORS.muted,
  },

  // ====================================================
  // EMPTY
  // ====================================================

  emptyContainer: {
    minHeight: 430,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },

  emptyDescription: {
    maxWidth: 360,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    color: COLORS.muted,
    textAlign: "center",
  },

  exploreButton: {
    marginTop: 20,
    minHeight: 42,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: COLORS.orange,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  exploreButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "800",
  },

  // ====================================================
  // GRID
  // ====================================================

  restaurantGrid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },

  gridItem: {
    minWidth: 0,
  },

  // ====================================================
  // CARD
  // ====================================================

  restaurantCard: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
    position: "relative",
  },

  // ====================================================
  // IMAGE
  // ====================================================

  imageWrapper: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#F1F1F1",
    overflow: "hidden",
    position: "relative",
  },

  restaurantImage: {
    width: "100%",
    height: "100%",
  },

  // ====================================================
  // SAVED BADGE
  // ====================================================

  savedBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor:
      "rgba(8,26,51,0.86)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.orange,
  },

  savedBadgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: "700",
  },

  // ====================================================
  // REMOVE BUTTON
  // ====================================================

  removeButton: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      "rgba(8,26,51,0.88)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.orange,
    zIndex: 10,
    elevation: 10,
  },

  // ====================================================
  // INFO
  // ====================================================

  restaurantInfo: {
    padding: 12,
    minWidth: 0,
  },

  restaurantName: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },

  cuisine: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.muted,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    minWidth: 0,
  },

  restaurantAddress: {
    flex: 1,
    minWidth: 0,
    marginLeft: 4,
    fontSize: 9,
    color: COLORS.muted,
  },

  // ====================================================
  // FOOD PREVIEW
  // ====================================================

  foodPreview: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 0,
    marginBottom: 3,
  },

  foodText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 5,
    fontSize: 10,
    color: COLORS.text,
    fontWeight: "500",
  },

  moreItems: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.orange,
    fontWeight: "700",
  },
});

