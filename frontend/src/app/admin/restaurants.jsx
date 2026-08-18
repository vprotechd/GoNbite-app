import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

  useEffect(() => {
    fetchAllRestaurants();
  }, []);

  const fetchAllRestaurants = async () => {
    try {
      setIsLoading(true);

      const res = await api.get("/admin/all-restaurants");

      setRestaurants(res.data);
    } catch (error) {
      console.error(
        "Fetch restaurants error:",
        error?.response?.data || error?.message,
      );

      Alert.alert("Error", "Failed to load restaurants.");
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------
  // APPROVE RESTAURANT
  // -----------------------------------------
  const approveRestaurant = async (id) => {
    try {
      await api.put(`/admin/approve-restaurant/${id}`);

      Alert.alert("Success", "Restaurant approved successfully.");

      fetchAllRestaurants();
    } catch (error) {
      console.error("Approve error:", error);

      Alert.alert("Error", "Failed to approve restaurant.");
    }
  };

  // -----------------------------------------
  // REJECT / REMOVE RESTAURANT
  // -----------------------------------------
  const rejectRestaurant = async (id) => {
    Alert.alert(
      "Remove Restaurant",
      "Are you sure you want to remove this restaurant?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/reject-restaurant/${id}`);

              Alert.alert(
                "Removed",
                "Restaurant removed from the system.",
              );

              fetchAllRestaurants();
            } catch (error) {
              console.error("Remove error:", error);

              Alert.alert("Error", "Failed to remove restaurant.");
            }
          },
        },
      ],
    );
  };

  // -----------------------------------------
  // STATUS
  // -----------------------------------------
  const getStatusColor = (isVerified) => {
    return isVerified ? "#10B981" : "#F59E0B";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* =====================================
            HEADER
        ====================================== */}
        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/admin")}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#0A1628"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              Restaurants
            </Text>

            <Text style={styles.headerSubtitle}>
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

        {/* =====================================
            CONTENT
        ====================================== */}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#F5B82E"
            />

            <Text style={styles.loadingText}>
              Loading restaurants...
            </Text>
          </View>
        ) : restaurants.length === 0 ? (
          <View style={styles.emptyState}>

            <View style={styles.emptyIcon}>
              <Ionicons
                name="storefront-outline"
                size={55}
                color="#CBD5E1"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No Restaurants Found
            </Text>

            <Text style={styles.emptySubtitle}>
              No restaurants have registered yet.
            </Text>

          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >

            {/* RESTAURANT COUNT */}

            <View style={styles.countRow}>
              <Text style={styles.countTitle}>
                All Restaurants
              </Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>
                  {restaurants.length}
                </Text>
              </View>
            </View>

            {restaurants.map((restaurant) => (

              <View
                key={restaurant._id}
                style={styles.card}
              >

                {/* =================================
                    FULL RESTAURANT IMAGE
                ================================== */}

                <View style={styles.imageContainer}>

                  {restaurant.imageUrl ? (
                    <Image
                      source={{
                        uri: restaurant.imageUrl.startsWith("http")
                          ? `${restaurant.imageUrl}?t=${Date.now()}`
                          : `http://localhost:5000${restaurant.imageUrl}?t=${Date.now()}`,
                      }}
                      style={styles.restaurantImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.noImage}>

                      <Ionicons
                        name="image-outline"
                        size={55}
                        color="#CBD5E1"
                      />

                      <Text style={styles.noImageText}>
                        No restaurant image
                      </Text>

                    </View>
                  )}

                  {/* STATUS ON IMAGE */}

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(
                          restaurant.isVerified,
                        ),
                      },
                    ]}
                  >
                    <View style={styles.statusDot} />

                    <Text style={styles.statusText}>
                      {restaurant.isVerified
                        ? "Approved"
                        : "Pending"}
                    </Text>
                  </View>

                </View>

                {/* =================================
                    RESTAURANT DETAILS
                ================================== */}

                <View style={styles.detailsContainer}>

                  <View style={styles.titleRow}>

                    <Text
                      style={styles.restaurantName}
                      numberOfLines={2}
                    >
                      {restaurant.restaurantName ||
                        "Unnamed Restaurant"}
                    </Text>

                  </View>

                  {/* OWNER */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="person-outline"
                      size={17}
                      color="#64748B"
                    />

                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Owner
                      </Text>

                      <Text
                        style={styles.infoText}
                        numberOfLines={1}
                      >
                        {restaurant.ownerName || "Not provided"}
                      </Text>
                    </View>

                  </View>

                  {/* EMAIL */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="mail-outline"
                      size={17}
                      color="#64748B"
                    />

                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Email
                      </Text>

                      <Text
                        style={styles.infoText}
                        numberOfLines={1}
                      >
                        {restaurant.email || "Not provided"}
                      </Text>
                    </View>

                  </View>

                  {/* PHONE */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="call-outline"
                      size={17}
                      color="#64748B"
                    />

                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Phone
                      </Text>

                      <Text
                        style={styles.infoText}
                        numberOfLines={1}
                      >
                        {restaurant.phone || "Not provided"}
                      </Text>
                    </View>

                  </View>

                  {/* ADDRESS */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="location-outline"
                      size={17}
                      color="#64748B"
                    />

                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>
                        Address
                      </Text>

                      <Text
                        style={styles.infoText}
                        numberOfLines={2}
                      >
                        {restaurant.address || "Not provided"}
                      </Text>
                    </View>

                  </View>

                </View>

                {/* =================================
                    SMALL ACTION BUTTONS
                ================================== */}

                <View style={styles.actionContainer}>

                  {!restaurant.isVerified ? (
                    <>
                      {/* APPROVE */}

                      <TouchableOpacity
                        style={styles.smallApproveButton}
                        onPress={() =>
                          approveRestaurant(restaurant._id)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text style={styles.smallButtonText}>
                          Approve
                        </Text>
                      </TouchableOpacity>

                      {/* REJECT */}

                      <TouchableOpacity
                        style={styles.smallRejectButton}
                        onPress={() =>
                          rejectRestaurant(restaurant._id)
                        }
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name="close"
                          size={16}
                          color="#FFFFFF"
                        />

                        <Text style={styles.smallButtonText}>
                          Reject
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* REMOVE */

                    <TouchableOpacity
                      style={styles.smallRemoveButton}
                      onPress={() =>
                        rejectRestaurant(restaurant._id)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#FFFFFF"
                      />

                      <Text style={styles.smallButtonText}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  )}

                </View>

              </View>

            ))}

          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  // =========================================
  // MAIN
  // =========================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // =========================================
  // HEADER
  // =========================================

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

  // =========================================
  // LOADING
  // =========================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  // =========================================
  // EMPTY
  // =========================================

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
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

  // =========================================
  // LIST
  // =========================================

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

  // =========================================
  // CARD
  // =========================================

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

  // =========================================
  // FULL IMAGE
  // =========================================

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

  // =========================================
  // STATUS
  // =========================================

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

  // =========================================
  // DETAILS
  // =========================================

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

  // =========================================
  // SMALL BUTTONS
  // =========================================

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

  smallRemoveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#EF4444",

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