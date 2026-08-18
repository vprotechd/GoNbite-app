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

// ✅ 1. Define the Dashboard Stats interface
interface DashboardStats {
  walletBalance: number;
  totalDeliveries: number;
  totalEarnings: number;
  isOnline: boolean;
  activeOrder: any | null;
}

// ✅ 2. Define the Available Order interface
interface AvailableOrder {
  _id: string;
  totalAmount: number;
  restaurantId?: {
    restaurantName: string;
    address: string;
  };
}

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // ✅ Fetch the profile first to check if the driver is verified
      const profileRes = await api.get("/delivery/profile");
      
      // If isVerified is false, show the pending approval screen
      if (!profileRes.data.isVerified) {
        setIsApproved(false);
        setIsLoading(false);
        return;
      }

      setIsApproved(true);

      // Fetch Dashboard Stats
      const dashboardRes = await api.get("/delivery/dashboard");
      setStats(dashboardRes.data);

      // Fetch Available Orders
      const ordersRes = await api.get("/delivery/available-orders");
      setOrders(ordersRes.data);
    } catch (error) {
      console.error(error);
      // If the API returns a 403 Forbidden, it means the user is not approved
      if (error.response?.status === 403) {
        setIsApproved(false);
      } else {
        Alert.alert("Error", "Failed to load dashboard.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOnline = async () => {
    try {
      await api.put("/delivery/toggle-online");
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Could not toggle status.");
    }
  };

  const acceptOrder = async (
    id: string,
    restaurantName: string,
    restaurantAddress: string,
    deliveryAddress: string
  ) => {
    try {
      await api.put(`/delivery/accept-order/${id}`);
      // Navigate to the Active Order screen
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
      Alert.alert("Error", "Failed to accept order.");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/delivery/update-status/${id}`, { status });
      Alert.alert("Updated", `Status changed to ${status}`);
      fetchData();
    } catch (error) {
      Alert.alert("Error", "Failed to update status.");
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          onPress: async () => {
            await AsyncStorage.removeItem("deliveryToken");
            router.replace("/delivery/login");
          },
        },
      ]
    );
  };

  // ✅ SHOW PENDING APPROVAL SCREEN
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#081A33" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5B82E" />
        </View>
      </SafeAreaView>
    );
  }

  if (isApproved === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#081A33" />
        <View style={styles.container}>
          <View style={styles.approvalContainer}>
            <Ionicons name="time-outline" size={80} color="#F5B82E" />
            <Text style={styles.approvalTitle}>Pending Approval</Text>
            <Text style={styles.approvalSubtitle}>
              Your account is currently under review by the Admin.
            </Text>
            <Text style={styles.approvalSubtitle}>
              You will be able to accept orders once your account is verified.
            </Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
              <Text style={styles.logoutBtnText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ✅ DASHBOARD VIEW
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Dashboard</Text>
          <TouchableOpacity
            onPress={toggleOnline}
            style={[
              styles.statusBtn,
              stats.isOnline ? styles.onlineBtn : styles.offlineBtn,
            ]}
          >
            <Text style={styles.statusText}>
              {stats.isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* --- STATS --- */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.walletBalance}</Text>
              <Text style={styles.statLabel}>Wallet</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
              <Text style={styles.statLabel}>Deliveries</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{stats.totalEarnings}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>

          {/* --- ACTIVE ORDER --- */}
          {stats.activeOrder && (
            <View style={styles.activeCard}>
              <Text style={styles.activeTitle}>Active Order</Text>
              <Text style={styles.activeText}>
                Order #{stats.activeOrder._id.slice(-6)}
              </Text>
              <Text style={styles.activeText}>
                Status: {stats.activeOrder.status}
              </Text>
              <TouchableOpacity
                style={styles.deliveredBtn}
                onPress={() => updateStatus(stats.activeOrder._id, "Delivered")}
              >
                <Text style={styles.deliveredBtnText}>Mark as Delivered</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* --- AVAILABLE ORDERS --- */}
          <Text style={styles.sectionTitle}>New Pickup Requests</Text>
          {orders.length === 0 ? (
            <Text style={styles.emptyText}>No orders available right now.</Text>
          ) : (
            orders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                <Text style={styles.orderRestaurant}>
                  {order.restaurantId?.restaurantName || "Restaurant"}
                </Text>
                <Text style={styles.orderAddress}>
                  {order.restaurantId?.address || "Address not available"}
                </Text>
                <Text style={styles.orderAmount}>₹{order.totalAmount}</Text>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() =>
                      acceptOrder(
                        order._id,
                        order.restaurantId?.restaurantName || "Restaurant",
                        order.restaurantId?.address || "Address not available",
                        "Customer Address Placeholder"
                      )
                    }
                  >
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() => console.log("Rejected")}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0B0F14" },
  statusBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  onlineBtn: { backgroundColor: "#4CAF50" },
  offlineBtn: { backgroundColor: "#FF5252" },
  statusText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

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
  statValue: { fontSize: 18, fontWeight: "800", color: "#0B0F14" },
  statLabel: { fontSize: 12, color: "#64748B", marginTop: 4 },

  activeCard: {
    backgroundColor: "#FFF9EF",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#F5B82E",
    marginBottom: 20,
  },
  activeTitle: { fontSize: 18, fontWeight: "700", color: "#0B0F14", marginBottom: 8 },
  activeText: { fontSize: 14, color: "#64748B", marginBottom: 4 },
  deliveredBtn: {
    backgroundColor: "#F5B82E",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  deliveredBtnText: { color: "#0B0F14", fontWeight: "700" },

  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0B0F14", marginBottom: 12 },
  emptyText: { textAlign: "center", color: "#64748B", marginTop: 20 },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },
  orderRestaurant: { fontSize: 16, fontWeight: "700", color: "#0B0F14" },
  orderAddress: { fontSize: 13, color: "#64748B", marginTop: 4 },
  orderAmount: { fontSize: 18, fontWeight: "700", color: "#F5B82E", marginTop: 8 },

  actionRow: { flexDirection: "row", gap: 12, marginTop: 12 },
  acceptBtn: { flex: 1, backgroundColor: "#4CAF50", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  rejectBtn: { flex: 1, backgroundColor: "#FF5252", paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  btnText: { color: "#FFFFFF", fontWeight: "700" },

  /* --- NEW APPROVAL SCREEN STYLES --- */
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },

  approvalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  approvalTitle: { fontSize: 26, fontWeight: "800", color: "#0B0F14", marginTop: 16, marginBottom: 8 },
  approvalSubtitle: { fontSize: 15, color: "#64748B", textAlign: "center", lineHeight: 22, marginBottom: 4 },
  
  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#FF5252",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});