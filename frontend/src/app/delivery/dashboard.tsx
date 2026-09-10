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
  };
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

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch profile first
      const profileRes = await api.get("/delivery/profile");

      // Check if delivery partner is verified
      if (!profileRes.data || !profileRes.data.isVerified) {
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      setIsApproved(true);

      // Fetch dashboard stats
      const dashboardRes = await api.get("/delivery/dashboard");

      setStats(dashboardRes.data);

      // Fetch available orders
      const ordersRes = await api.get(
        "/delivery/available-orders"
      );

      setOrders(ordersRes.data);
    } catch (error: any) {
      console.error("DELIVERY DASHBOARD ERROR:", error);

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
            color="#F5B82E"
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
              color="#F5B82E"
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
            <View style={styles.activeCard}>

              <Text style={styles.activeTitle}>
                Active Order
              </Text>

              <Text style={styles.activeText}>
                Order #
                {stats.activeOrder._id.slice(-6)}
              </Text>

              <Text style={styles.activeText}>
                Status:{" "}
                {stats.activeOrder.status}
              </Text>

            {stats.activeOrder.status === "Out for Delivery" && (
  <TouchableOpacity
    style={styles.deliveredBtn}
    onPress={() =>
      updateStatus(
        stats.activeOrder._id,
        "Delivered"
      )
    }
  >
    <Text style={styles.deliveredBtnText}>
      Mark as Delivered
    </Text>
  </TouchableOpacity>
)}

            </View>
          )}

          {/* =================================================
              AVAILABLE ORDERS
          ================================================= */}

          <Text style={styles.sectionTitle}>
            New Pickup Requests
          </Text>

          {orders.length === 0 ? (

            <Text style={styles.emptyText}>
              No orders available right now.
            </Text>

          ) : (

            orders.map((order) => (

              <View
                key={order._id}
                style={styles.orderCard}
              >

                <Text
                  style={styles.orderRestaurant}
                >
                  {order.restaurantId
                    ?.restaurantName ||
                    "Restaurant"}
                </Text>

                <Text
                  style={styles.orderAddress}
                >
                  {order.restaurantId?.address ||
                    "Address not available"}
                </Text>

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
                    style={styles.acceptBtn}
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
                    <Text style={styles.btnText}>
                      Accept
                    </Text>
                  </TouchableOpacity>

                  {/* REJECT */}
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() =>
                      console.log("Rejected")
                    }
                  >
                    <Text style={styles.btnText}>
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

            <Text style={styles.logoutBtnText}>
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
    borderColor: "#F5B82E",
    marginBottom: 20,
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
    backgroundColor: "#F5B82E",
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

  orderAmount: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F5B82E",
    marginTop: 8,
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