import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity, 
  View,
} from "react-native";
import api from "../../services/api";

export default function UserOrdersScreen() {
  const { userId, userName } = useLocalSearchParams();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await api.get(
  `/admin/user-orders/${encodeURIComponent(userName)}`
);
      setOrders(res.data);
    } catch (error) {
      console.error("Fetch Orders Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending": return "#F5B82E";
      case "Accepted": return "#4CAF50";
      case "Preparing": return "#FFA726";
      case "Out for Delivery": return "#29B6F6";
      case "Delivered": return "#4CAF50";
      case "Cancelled": return "#FF5252";
      default: return "#64748B";
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/admin/users")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0B0F14" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{userName || "User"}'s Orders</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#F5B82E" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>This user hasn't placed any orders yet.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {orders.map((order) => (
              <View key={order._id} style={styles.orderCard}>
                
                <View style={styles.orderHeader}>
                  <Text style={styles.orderId}>Order #{order._id.slice(-6)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                    <Text style={styles.statusText}>{order.status}</Text>
                  </View>
                </View>

                <Text style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString()}
                </Text>

                {order.items.map((item, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName}>x{item.quantity} {item.name}</Text>
                    <Text style={styles.itemPrice}>₹{item.price * item.quantity}</Text>
                  </View>
                ))}

                <View style={styles.divider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>₹{order.totalAmount}</Text>
                </View>

                <View style={styles.paymentRow}>
                  <Ionicons name="cash-outline" size={14} color="#64748B" />
                  <Text style={styles.paymentText}>{order.paymentMethod}</Text>
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
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0B0F14" },
  scrollContent: { padding: 20, paddingBottom: 20 },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#0B0F14", marginTop: 12 },
  emptySubtitle: { fontSize: 14, color: "#64748B", marginTop: 4 },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
  },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  orderId: { fontSize: 16, fontWeight: "700", color: "#0B0F14" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  orderDate: { fontSize: 12, color: "#64748B", marginBottom: 12 },

  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  itemName: { fontSize: 14, color: "#0B0F14" },
  itemPrice: { fontSize: 14, fontWeight: "600", color: "#0B0F14" },
  divider: { height: 1, backgroundColor: "#E2E6EB", marginVertical: 12 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#0B0F14" },
  totalValue: { fontSize: 16, fontWeight: "800", color: "#F5B82E" },

  paymentRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  paymentText: { fontSize: 12, color: "#64748B" },
});