import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================================
  // GET ADMIN TOKEN
  // =========================================================

  const getAdminToken = async () => {
    const token =
      await AsyncStorage.getItem("adminToken");

    if (!token) {
      router.replace("/admin/login");
      return null;
    }

    return token;
  };

  // =========================================================
  // FETCH ALL RESTAURANTS
  // =========================================================

  useEffect(() => {
    fetchAllRestaurants();
  }, []);

  const fetchAllRestaurants = async () => {
    try {
      setIsLoading(true);

      const token = await getAdminToken();

      if (!token) {
        return;
      }

      console.log(
        "📡 Fetching all restaurants..."
      );

      const res = await api.get(
        "/admin/all-restaurants",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(
        "✅ Restaurants received:",
        res.data?.length
      );

      setRestaurants(
        Array.isArray(res.data)
          ? res.data
          : []
      );

    } catch (error) {
      console.error(
        "❌ Fetch restaurants error:",
        error?.response?.data ||
        error?.message
      );

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        await AsyncStorage.removeItem(
          "adminToken"
        );

        router.replace("/admin/login");

        return;
      }

      Alert.alert(
        "Error",
        "Failed to load restaurants."
      );

    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // =========================================================
  // REFRESH
  // =========================================================

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchAllRestaurants();
  };

  // =========================================================
  // APPROVE RESTAURANT
  // =========================================================

  const approveRestaurant = async (id) => {
    try {
      const token = await getAdminToken();

      if (!token) {
        return;
      }

      console.log(
        "✅ Approving restaurant:",
        id
      );

      await api.put(
        `/admin/approve-restaurant/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Success",
        "Restaurant approved successfully."
      );

      await fetchAllRestaurants();

    } catch (error) {
      console.error(
        "❌ Approve restaurant error:",
        error?.response?.data ||
        error?.message
      );

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        await AsyncStorage.removeItem(
          "adminToken"
        );

        router.replace("/admin/login");

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to approve restaurant."
      );
    }
  };

  // =========================================================
  // REJECT RESTAURANT
  //
  // IMPORTANT:
  // Backend route is PUT, NOT DELETE.
  // =========================================================

  const rejectRestaurant = async (id) => {
    Alert.alert(
      "Reject Restaurant",
      "Are you sure you want to reject this restaurant?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },

        {
          text: "Reject",
          style: "destructive",

          onPress: async () => {
            try {
              const token =
                await getAdminToken();

              if (!token) {
                return;
              }

              console.log(
                "❌ Rejecting restaurant:",
                id
              );

              await api.put(
                `/admin/reject-restaurant/${id}`,
                {},
                {
                  headers: {
                    Authorization:
                      `Bearer ${token}`,
                  },
                }
              );

              Alert.alert(
                "Rejected",
                "Restaurant has been rejected."
              );

              await fetchAllRestaurants();

            } catch (error) {
              console.error(
                "❌ Reject restaurant error:",
                error?.response?.data ||
                error?.message
              );

              if (
                error?.response?.status ===
                  401 ||
                error?.response?.status ===
                  403
              ) {
                await AsyncStorage.removeItem(
                  "adminToken"
                );

                router.replace(
                  "/admin/login"
                );

                return;
              }

              Alert.alert(
                "Error",
                error?.response?.data?.error ||
                  "Failed to reject restaurant."
              );
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // TOGGLE RESTAURANT ACTIVE / INACTIVE
  // =========================================================

  const toggleRestaurant = async (
    restaurant
  ) => {
    try {
      const token =
        await getAdminToken();

      if (!token) {
        return;
      }

      console.log(
        "🔄 Toggling restaurant:",
        restaurant._id
      );

      await api.put(
        `/admin/toggle-restaurant/${restaurant._id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Updated",
        `Restaurant ${
          restaurant.isAvailable
            ? "deactivated"
            : "activated"
        } successfully.`
      );

      await fetchAllRestaurants();

    } catch (error) {
      console.error(
        "❌ Toggle restaurant error:",
        error?.response?.data ||
        error?.message
      );

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        await AsyncStorage.removeItem(
          "adminToken"
        );

        router.replace("/admin/login");

        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to update restaurant status."
      );
    }
  };

  // =========================================================
  // RESTAURANT STATUS
  // =========================================================

  const getStatusInfo = (
    restaurant
  ) => {
    if (!restaurant.isVerified) {
      return {
        text: "Pending",
        color: "#F59E0B",
      };
    }

    if (
      restaurant.isVerified &&
      restaurant.isAvailable
    ) {
      return {
        text: "Active",
        color: "#10B981",
      };
    }

    return {
      text: "Inactive",
      color: "#EF4444",
    };
  };

  // =========================================================
  // IMAGE URL
  // =========================================================

  const getImageUrl = (
    imageUrl
  ) => {
    if (!imageUrl) {
      return null;
    }

    if (
      imageUrl.startsWith("http://") ||
      imageUrl.startsWith("https://")
    ) {
      return `${imageUrl}?t=${Date.now()}`;
    }

    /*
      IMPORTANT:
      Your api.js has the backend base URL.
      If imageUrl is relative, use the same backend
      host instead of hardcoding localhost.
    */

    const apiBaseUrl =
      api.defaults?.baseURL || "";

    const backendUrl =
      apiBaseUrl.replace(
        /\/api\/?$/,
        ""
      );

    return `${backendUrl}${imageUrl}?t=${Date.now()}`;
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (isLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text
            style={styles.loadingText}
          >
            Loading restaurants...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =========================================================
  // MAIN
  // =========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace("/admin")
            }
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0A1628"
            />
          </TouchableOpacity>

          <View
            style={styles.headerCenter}
          >
            <Text
              style={styles.headerTitle}
            >
              Restaurants
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Manage restaurant registrations
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchAllRestaurants}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh"
              size={21}
              color="#0A1628"
            />
          </TouchableOpacity>

        </View>


        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {restaurants.length === 0 ? (

          <View style={styles.emptyState}>

            <View
              style={styles.emptyIcon}
            >
              <Ionicons
                name="storefront-outline"
                size={55}
                color="#CBD5E1"
              />
            </View>

            <Text
              style={styles.emptyTitle}
            >
              No Restaurants Found
            </Text>

            <Text
              style={styles.emptySubtitle}
            >
              No restaurants have registered yet.
            </Text>

            <TouchableOpacity
              style={styles.emptyRefreshButton}
              onPress={fetchAllRestaurants}
            >
              <Ionicons
                name="refresh"
                size={18}
                color="#0B0F14"
              />

              <Text
                style={
                  styles.emptyRefreshText
                }
              >
                Refresh
              </Text>
            </TouchableOpacity>

          </View>

        ) : (

          <ScrollView
            showsVerticalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.listContent
            }

            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          >

            {/* =================================================
                RESTAURANT COUNT
            ================================================= */}

            <View
              style={styles.countRow}
            >
              <Text
                style={styles.countTitle}
              >
                All Restaurants
              </Text>

              <View
                style={styles.countBadge}
              >
                <Text
                  style={styles.countText}
                >
                  {restaurants.length}
                </Text>
              </View>
            </View>


            {/* =================================================
                RESTAURANTS
            ================================================= */}

            {restaurants.map(
              (restaurant) => {

                const status =
                  getStatusInfo(
                    restaurant
                  );

                const imageUrl =
                  getImageUrl(
                    restaurant.imageUrl
                  );

                return (

                  <View
                    key={restaurant._id}
                    style={styles.card}
                  >

                    {/* =========================================
                        RESTAURANT IMAGE
                    ========================================= */}

                    <View
                      style={
                        styles.imageContainer
                      }
                    >

                      {imageUrl ? (

                        <Image
                          source={{
                            uri: imageUrl,
                          }}
                          style={
                            styles.restaurantImage
                          }
                          resizeMode="cover"
                        />

                      ) : (

                        <View
                          style={
                            styles.noImage
                          }
                        >

                          <Ionicons
                            name="image-outline"
                            size={55}
                            color="#CBD5E1"
                          />

                          <Text
                            style={
                              styles.noImageText
                            }
                          >
                            No restaurant image
                          </Text>

                        </View>
                      )}


                      {/* =======================================
                          STATUS
                      ======================================= */}

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              status.color,
                          },
                        ]}
                      >

                        <View
                          style={
                            styles.statusDot
                          }
                        />

                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {status.text}
                        </Text>

                      </View>

                    </View>


                    {/* =========================================
                        DETAILS
                    ========================================= */}

                    <View
                      style={
                        styles.detailsContainer
                      }
                    >

                      <View
                        style={styles.titleRow}
                      >

                        <Text
                          style={
                            styles.restaurantName
                          }
                          numberOfLines={2}
                        >
                          {restaurant.restaurantName ||
                            "Unnamed Restaurant"}
                        </Text>

                      </View>


                      {/* OWNER */}

                      <View
                        style={styles.infoRow}
                      >

                        <Ionicons
                          name="person-outline"
                          size={17}
                          color="#64748B"
                        />

                        <View
                          style={
                            styles.infoContent
                          }
                        >

                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            Owner
                          </Text>

                          <Text
                            style={
                              styles.infoText
                            }
                            numberOfLines={1}
                          >
                            {restaurant.ownerName ||
                              "Not provided"}
                          </Text>

                        </View>

                      </View>


                      {/* EMAIL */}

                      <View
                        style={styles.infoRow}
                      >

                        <Ionicons
                          name="mail-outline"
                          size={17}
                          color="#64748B"
                        />

                        <View
                          style={
                            styles.infoContent
                          }
                        >

                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            Email
                          </Text>

                          <Text
                            style={
                              styles.infoText
                            }
                            numberOfLines={1}
                          >
                            {restaurant.email ||
                              "Not provided"}
                          </Text>

                        </View>

                      </View>


                      {/* PHONE */}

                      <View
                        style={styles.infoRow}
                      >

                        <Ionicons
                          name="call-outline"
                          size={17}
                          color="#64748B"
                        />

                        <View
                          style={
                            styles.infoContent
                          }
                        >

                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            Phone
                          </Text>

                          <Text
                            style={
                              styles.infoText
                            }
                            numberOfLines={1}
                          >
                            {restaurant.phone ||
                              "Not provided"}
                          </Text>

                        </View>

                      </View>


                      {/* ADDRESS */}

                      <View
                        style={styles.infoRow}
                      >

                        <Ionicons
                          name="location-outline"
                          size={17}
                          color="#64748B"
                        />

                        <View
                          style={
                            styles.infoContent
                          }
                        >

                          <Text
                            style={
                              styles.infoLabel
                            }
                          >
                            Address
                          </Text>

                          <Text
                            style={
                              styles.infoText
                            }
                            numberOfLines={2}
                          >
                            {restaurant.address ||
                              "Not provided"}
                          </Text>

                        </View>

                      </View>


                      {/* =======================================
                          VERIFICATION
                      ======================================= */}

                      <View
                        style={
                          styles.verificationRow
                        }
                      >

                        <Ionicons
                          name={
                            restaurant.isVerified
                              ? "shield-checkmark"
                              : "shield-outline"
                          }
                          size={17}
                          color={
                            restaurant.isVerified
                              ? "#10B981"
                              : "#F59E0B"
                          }
                        />

                        <Text
                          style={[
                            styles.verificationText,
                            {
                              color:
                                restaurant.isVerified
                                  ? "#10B981"
                                  : "#F59E0B",
                            },
                          ]}
                        >
                          {restaurant.isVerified
                            ? "Verified Restaurant"
                            : "Verification Pending"}
                        </Text>

                      </View>

                    </View>


                    {/* =========================================
                        ACTION BUTTONS
                    ========================================= */}

                    <View
                      style={
                        styles.actionContainer
                      }
                    >

                      {/* =====================================
                          PENDING
                      ===================================== */}

                      {!restaurant.isVerified ? (

                        <>

                          <TouchableOpacity
                            style={
                              styles.smallApproveButton
                            }
                            onPress={() =>
                              approveRestaurant(
                                restaurant._id
                              )
                            }
                            activeOpacity={0.8}
                          >

                            <Ionicons
                              name="checkmark"
                              size={16}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.smallButtonText
                              }
                            >
                              Approve
                            </Text>

                          </TouchableOpacity>


                          <TouchableOpacity
                            style={
                              styles.smallRejectButton
                            }
                            onPress={() =>
                              rejectRestaurant(
                                restaurant._id
                              )
                            }
                            activeOpacity={0.8}
                          >

                            <Ionicons
                              name="close"
                              size={16}
                              color="#FFFFFF"
                            />

                            <Text
                              style={
                                styles.smallButtonText
                              }
                            >
                              Reject
                            </Text>

                          </TouchableOpacity>

                        </>

                      ) : (

                        /* =====================================
                           APPROVED
                        ===================================== */

                        <TouchableOpacity
                          style={[
                            styles.smallToggleButton,
                            {
                              backgroundColor:
                                restaurant.isAvailable
                                  ? "#EF4444"
                                  : "#10B981",
                            },
                          ]}
                          onPress={() =>
                            toggleRestaurant(
                              restaurant
                            )
                          }
                          activeOpacity={0.8}
                        >

                          <Ionicons
                            name={
                              restaurant.isAvailable
                                ? "pause-circle-outline"
                                : "play-circle-outline"
                            }
                            size={16}
                            color="#FFFFFF"
                          />

                          <Text
                            style={
                              styles.smallButtonText
                            }
                          >
                            {restaurant.isAvailable
                              ? "Deactivate"
                              : "Activate"}
                          </Text>

                        </TouchableOpacity>

                      )}

                    </View>

                  </View>
                );
              }
            )}

          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
}


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ==================================================
  // HEADER
  // ==================================================

  header: {
    height: 75,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },

  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  // ==================================================
  // LOADING
  // ==================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  // ==================================================
  // EMPTY
  // ==================================================

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#F5F7FA",
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  emptyRefreshButton: {
    marginTop: 20,
    backgroundColor: "#F5B82E",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  emptyRefreshText: {
    color: "#0B0F14",
    fontSize: 13,
    fontWeight: "700",
  },

  // ==================================================
  // LIST
  // ==================================================

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  countTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A1628",
  },

  countBadge: {
    marginLeft: 8,
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: "#0B0F14",
    fontSize: 13,
    fontWeight: "800",
  },

  // ==================================================
  // CARD
  // ==================================================

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.07,
    shadowRadius: 8,

    elevation: 3,
  },

  // ==================================================
  // IMAGE
  // ==================================================

  imageContainer: {
    width: "100%",
    height: 230,
    backgroundColor: "#E2E8F0",
    position: "relative",
  },

  restaurantImage: {
    width: "100%",
    height: "100%",
  },

  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: {
    marginTop: 8,
    color: "#94A3B8",
    fontSize: 13,
  },

  // ==================================================
  // STATUS
  // ==================================================

  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 6,

    borderRadius: 15,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 5,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },

  // ==================================================
  // DETAILS
  // ==================================================

  detailsContainer: {
    padding: 16,
    paddingBottom: 10,
  },

  titleRow: {
    marginBottom: 12,
  },

  restaurantName: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0A1628",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  infoContent: {
    flex: 1,
    marginLeft: 10,
  },

  infoLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 1,
  },

  infoText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },

  // ==================================================
  // VERIFICATION
  // ==================================================

  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  verificationText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: "700",
  },

  // ==================================================
  // ACTIONS
  // ==================================================

  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    gap: 8,
  },

  smallApproveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#10B981",

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 8,
    gap: 5,
  },

  smallRejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EF4444",

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 8,
    gap: 5,
  },

  smallToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 14,
    paddingVertical: 8,

    borderRadius: 8,
    gap: 5,
  },

  smallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

});