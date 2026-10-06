import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import api from "../../services/api";

// =====================================================
// DASHBOARD STATS INTERFACE
// =====================================================

interface DashboardStats {
  walletBalance: number;
  totalDeliveries: number;
  totalEarnings: number;
  isOnline: boolean;
  activeOrder: any | null;
}

// =====================================================
// AVAILABLE ORDER INTERFACE
// =====================================================

interface AvailableOrder {
  _id: string;
  totalAmount: number;

  restaurantId?: {
    restaurantName: string;
    address: string;
    latitude?: number;
    longitude?: number;
  };

  deliveryLocation?: {
    latitude?: number;
    longitude?: number;
  };

  restaurantDistanceKm?: number | null;
  customerDistanceKm?: number | null;
}

// =====================================================
// DELIVERY DASHBOARD
// =====================================================

export default function DeliveryDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    walletBalance: 0,
    totalDeliveries: 0,
    totalEarnings: 0,
    isOnline: false,
    activeOrder: null,
  });

  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);

  // =====================================================
  // FETCH DATA
  // =====================================================

  useEffect(() => {
    fetchData();
  }, []);

  // =====================================================
  // CALCULATE DISTANCE
  // =====================================================

  const calculateDistanceKm = (
    latitude1: number,
    longitude1: number,
    latitude2: number,
    longitude2: number
  ) => {
    const earthRadiusKm = 6371;

    const dLatitude =
      ((latitude2 - latitude1) * Math.PI) / 180;

    const dLongitude =
      ((longitude2 - longitude1) * Math.PI) / 180;

    const lat1 =
      (latitude1 * Math.PI) / 180;

    const lat2 =
      (latitude2 * Math.PI) / 180;

    const a =
      Math.sin(dLatitude / 2) ** 2 +
      Math.cos(lat1) *
        Math.cos(lat2) *
        Math.sin(dLongitude / 2) ** 2;

    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );

    return earthRadiusKm * c;
  };

  // =====================================================
  // GET CURRENT DELIVERY PARTNER LOCATION
  // =====================================================

  const getCurrentPartnerLocation = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log(
          "Delivery partner location permission not granted."
        );

        return null;
      }

      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error(
        "GET PARTNER LOCATION ERROR:",
        error
      );

      return null;
    }
  };

  // =====================================================
  // ADD BOTH DISTANCES TO AVAILABLE ORDERS
  // =====================================================

  const addDistancesToOrders = async (
    availableOrders: AvailableOrder[]
  ) => {
    // Get partner's current location ONCE
    const partnerLocation =
      await getCurrentPartnerLocation();

    // If location unavailable
    if (!partnerLocation) {
      return availableOrders.map((order) => ({
        ...order,
        restaurantDistanceKm: null,
        customerDistanceKm: null,
      }));
    }

    return availableOrders.map((order) => {
      let restaurantDistanceKm:
        | number
        | null = null;

      let customerDistanceKm:
        | number
        | null = null;

      // =================================================
      // PARTNER → RESTAURANT
      // =================================================

      const restaurantLatitude =
        order.restaurantId?.latitude;

      const restaurantLongitude =
        order.restaurantId?.longitude;

      if (
        typeof restaurantLatitude === "number" &&
        typeof restaurantLongitude === "number"
      ) {
        restaurantDistanceKm =
          calculateDistanceKm(
            partnerLocation.latitude,
            partnerLocation.longitude,
            restaurantLatitude,
            restaurantLongitude
          );
      }

      // =================================================
      // PARTNER → CUSTOMER
      // =================================================

      const customerLatitude =
        order.deliveryLocation?.latitude;

      const customerLongitude =
        order.deliveryLocation?.longitude;

      if (
        typeof customerLatitude === "number" &&
        typeof customerLongitude === "number"
      ) {
        customerDistanceKm =
          calculateDistanceKm(
            partnerLocation.latitude,
            partnerLocation.longitude,
            customerLatitude,
            customerLongitude
          );
      }

      return {
        ...order,
        restaurantDistanceKm,
        customerDistanceKm,
      };
    });
  };

  // =====================================================
  // FETCH DATA
  // =====================================================

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch profile first
      const profileRes = await api.get(
        "/delivery/profile"
      );

      // Check if delivery partner is verified
      if (
        !profileRes.data ||
        !profileRes.data.isVerified
      ) {
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      setIsApproved(true);

      // Fetch dashboard stats
      const dashboardRes = await api.get(
        "/delivery/dashboard"
      );

      setStats(dashboardRes.data);

      // Fetch available orders
      const ordersRes = await api.get(
        "/delivery/available-orders"
      );

      // =================================================
      // CALCULATE BOTH DISTANCES
      // =================================================

      const ordersWithDistances =
        await addDistancesToOrders(
          ordersRes.data
        );

      setOrders(ordersWithDistances);
    } catch (error: any) {
      console.error(
        "DELIVERY DASHBOARD ERROR:",
        error
      );

      // If API returns 403, driver is not approved
      if (error.response?.status === 403) {
        setIsApproved(false);
      } else {
        Alert.alert(
          "Error",
          "Failed to load dashboard."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // TOGGLE ONLINE / OFFLINE
  // =====================================================

  const toggleOnline = async () => {
    try {
      const response = await api.put(
        "/delivery/toggle-online"
      );

      setStats((prev) => ({
        ...prev,
        isOnline: response.data.isOnline,
      }));

      // Refresh available orders after
      // online/offline change
      await fetchData();
    } catch (error: any) {
      Alert.alert(
        "Toggle Online Error",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          "Could not toggle status."
      );
    }
  };

  // =====================================================
  // ACCEPT ORDER
  // =====================================================

  const acceptOrder = async (
    id: string,
    restaurantName: string,
    restaurantAddress: string,
    deliveryAddress: string
  ) => {
    try {
      await api.put(
        `/delivery/accept-order/${id}`
      );

      // Refresh dashboard data
      await fetchData();

      // Navigate to Active Order screen
      router.push({
        pathname: "/delivery/active-order",
        params: {
          orderId: id,
          restaurantName,
          restaurantAddress,
          deliveryAddress,
        },
      });
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to accept order."
      );
    }
  };

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateStatus = async (
    id: string,
    status: string
  ) => {
    try {
      await api.put(
        `/delivery/update-status/${id}`,
        {
          status,
        }
      );

      Alert.alert(
        "Updated",
        `Status changed to ${status}`
      );

      fetchData();
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to update status."
      );
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      console.log(
        "========== DELIVERY LOGOUT STARTED =========="
      );

      // Remove delivery partner token
      await AsyncStorage.removeItem(
        "deliveryToken"
      );

      // Verify token has actually been removed
      const tokenCheck =
        await AsyncStorage.getItem(
          "deliveryToken"
        );

      console.log(
        "Delivery token after logout:",
        tokenCheck
          ? "STILL EXISTS"
          : "REMOVED SUCCESSFULLY"
      );

      // Clear dashboard state
      setStats({
        walletBalance: 0,
        totalDeliveries: 0,
        totalEarnings: 0,
        isOnline: false,
        activeOrder: null,
      });

      setOrders([]);
      setIsApproved(null);

      // Redirect to delivery login
      router.replace("/delivery/login");

      console.log(
        "========== REDIRECTED TO DELIVERY LOGIN =========="
      );
    } catch (error) {
      console.error(
        "DELIVERY LOGOUT ERROR:",
        error
      );

      Alert.alert(
        "Logout Error",
        "Failed to logout. Please try again."
      );
    }
  };

  // =====================================================
  // LOADING SCREEN
  // =====================================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#FF8500"
          />
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // PENDING APPROVAL SCREEN
  // =====================================================

  if (isApproved === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View style={styles.container}>
          <View style={styles.approvalContainer}>
            <Ionicons
              name="time-outline"
              size={80}
              color="#FF8500"
            />

            <Text style={styles.approvalTitle}>
              Pending Approval
            </Text>

            <Text style={styles.approvalSubtitle}>
              Your account is currently under
              review by the Admin.
            </Text>

            <Text style={styles.approvalSubtitle}>
              You will be able to accept orders
              once your account is verified.
            </Text>

            {/* LOGOUT */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.logoutBtnText}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // MAIN DASHBOARD
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>
        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            Delivery Dashboard
          </Text>

          <View style={styles.headerActions}>
            {/* REFRESH */}
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={fetchData}
              disabled={isLoading}
            >
              <Ionicons
                name="refresh"
                size={22}
                color="#0B0F14"
              />
            </TouchableOpacity>

            {/* ONLINE / OFFLINE */}
            <TouchableOpacity
              onPress={toggleOnline}
              style={[
                styles.statusBtn,
                stats.isOnline
                  ? styles.onlineBtn
                  : styles.offlineBtn,
              ]}
            >
              <Text style={styles.statusText}>
                {stats.isOnline
                  ? "Online"
                  : "Offline"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
        >
          {/* =================================================
              STATS
          ================================================= */}

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{stats.walletBalance}
              </Text>

              <Text style={styles.statLabel}>
                Wallet
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {stats.totalDeliveries}
              </Text>

              <Text style={styles.statLabel}>
                Deliveries
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                ₹{stats.totalEarnings}
              </Text>

              <Text style={styles.statLabel}>
                Earnings
              </Text>
            </View>
          </View>

          {/* =================================================
              ACTIVE ORDER
          ================================================= */}

          {stats.activeOrder && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.activeCard}
              onPress={() => {
                router.push({
                  pathname:
                    "/delivery/active-order",
                  params: {
                    orderId:
                      stats.activeOrder._id,
                  },
                });
              }}
            >
              <View
                style={
                  styles.activeHeaderRow
                }
              >
                <View>
                  <Text
                    style={
                      styles.activeTitle
                    }
                  >
                    Active Order
                  </Text>

                  <Text
                    style={
                      styles.activeText
                    }
                  >
                    Order #
                    {stats.activeOrder._id.slice(
                      -6
                    )}
                  </Text>

                  <Text
                    style={
                      styles.activeText
                    }
                  >
                    Status:{" "}
                    {stats.activeOrder.status}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={26}
                  color="#FF8500"
                />
              </View>

              <View
                style={styles.trackButton}
              >
                <Ionicons
                  name="navigate-outline"
                  size={20}
                  color="#0B0F14"
                />

                <Text
                  style={
                    styles.trackButtonText
                  }
                >
                  Open Live Tracking
                </Text>
              </View>

              {stats.activeOrder.status ===
                "Out for Delivery" && (
                <TouchableOpacity
                  style={
                    styles.deliveredBtn
                  }
                  onPress={(event) => {
                    event.stopPropagation();

                    updateStatus(
                      stats.activeOrder._id,
                      "Delivered"
                    );
                  }}
                >
                  <Text
                    style={
                      styles.deliveredBtnText
                    }
                  >
                    Mark as Delivered
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}

          {/* =================================================
              AVAILABLE ORDERS
          ================================================= */}

          <Text
            style={styles.sectionTitle}
          >
            New Pickup Requests
          </Text>

          {orders.length === 0 ? (
            <Text
              style={styles.emptyText}
            >
              No orders available right now.
            </Text>
          ) : (
            orders.map((order) => (
              <View
                key={order._id}
                style={styles.orderCard}
              >
                <Text
                  style={
                    styles.orderRestaurant
                  }
                >
                  {order.restaurantId
                    ?.restaurantName ||
                    "Restaurant"}
                </Text>

                <Text
                  style={
                    styles.orderAddress
                  }
                >
                  {order.restaurantId
                    ?.address ||
                    "Address not available"}
                </Text>

                {/* =================================================
                    RESTAURANT DISTANCE
                ================================================= */}

                <View
                  style={styles.distanceRow}
                >
                  <Ionicons
                    name="restaurant-outline"
                    size={17}
                    color="#2563EB"
                  />

                  <Text
                    style={
                      styles.restaurantDistanceText
                    }
                  >
                    {typeof order.restaurantDistanceKm ===
                    "number"
                      ? `Restaurant: ${order.restaurantDistanceKm.toFixed(
                          1
                        )} km`
                      : "Restaurant distance unavailable"}
                  </Text>
                </View>

                {/* =================================================
                    CUSTOMER DISTANCE
                ================================================= */}

                <View
                  style={styles.distanceRow}
                >
                  <Ionicons
                    name="home-outline"
                    size={17}
                    color="#16A34A"
                  />

                  <Text
                    style={
                      styles.customerDistanceText
                    }
                  >
                    {typeof order.customerDistanceKm ===
                    "number"
                      ? `Customer: ${order.customerDistanceKm.toFixed(
                          1
                        )} km`
                      : "Customer distance unavailable"}
                  </Text>
                </View>

                <Text
                  style={styles.orderAmount}
                >
                  ₹{order.totalAmount}
                </Text>

                <View
                  style={styles.actionRow}
                >
                  {/* ACCEPT */}
                  <TouchableOpacity
                    style={
                      styles.acceptBtn
                    }
                    onPress={() =>
                      acceptOrder(
                        order._id,
                        order.restaurantId
                          ?.restaurantName ||
                          "Restaurant",
                        order.restaurantId
                          ?.address ||
                          "Address not available",
                        "Customer Address Placeholder"
                      )
                    }
                  >
                    <Text
                      style={styles.btnText}
                    >
                      Accept
                    </Text>
                  </TouchableOpacity>

                  {/* REJECT */}
                  <TouchableOpacity
                    style={
                      styles.rejectBtn
                    }
                    onPress={() =>
                      console.log(
                        "Rejected"
                      )
                    }
                  >
                    <Text
                      style={styles.btnText}
                    >
                      Reject
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* =================================================
              LOGOUT BUTTON
          ================================================= */}

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color="#FFFFFF"
            />

            <Text
              style={styles.logoutBtnText}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    padding: 20,
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  refreshBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FF8500",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0B0F14",
  },

  statusBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },

  onlineBtn: {
    backgroundColor: "#4CAF50",
  },

  offlineBtn: {
    backgroundColor: "#FF5252",
  },

  statusText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  // ===================================================
  // STATS
  // ===================================================

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  statCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    width: "31%",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F14",
  },

  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },

  // ===================================================
  // ACTIVE ORDER
  // ===================================================

  activeCard: {
    backgroundColor: "#FFF9EF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FF8500",
    marginBottom: 20,
  },

  activeHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  trackButton: {
    marginTop: 14,
    backgroundColor: "#FF8500",
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  trackButtonText: {
    color: "#0B0F14",
    fontWeight: "800",
    fontSize: 14,
  },

  activeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B0F14",
    marginBottom: 8,
  },

  activeText: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },

  deliveredBtn: {
    backgroundColor: "#FF8500",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },

  deliveredBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
  },

  // ===================================================
  // AVAILABLE ORDERS
  // ===================================================

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B0F14",
    marginBottom: 12,
  },

  emptyText: {
    textAlign: "center",
    color: "#64748B",
    marginTop: 20,
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  orderRestaurant: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B0F14",
  },

  orderAddress: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  // ===================================================
  // DISTANCES
  // ===================================================

  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },

  restaurantDistanceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2563EB",
    marginLeft: 5,
  },

  customerDistanceText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#16A34A",
    marginLeft: 5,
  },

  orderAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8500",
    marginTop: 10,
  },

  // ===================================================
  // ACTION BUTTONS
  // ===================================================

  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },

  acceptBtn: {
    flex: 1,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  rejectBtn: {
    flex: 1,
    backgroundColor: "#FF5252",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },

  // ===================================================
  // APPROVAL SCREEN
  // ===================================================

  approvalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  approvalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 16,
    marginBottom: 8,
  },

  approvalSubtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 4,
  },

  // ===================================================
  // LOGOUT
  // ===================================================

  logoutBtn: {
    marginTop: 30,
    marginBottom: 30,
    backgroundColor: "#FF5252",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  logoutBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
});