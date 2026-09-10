import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import api from "../../services/api";

export default function ManageOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // --- FETCH ORDERS FROM BACKEND ---
  const fetchOrders = async () => {
    try {
      const response = await api.get("/restaurant/orders");
      setOrders(response.data);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      Alert.alert("Error", "Could not load orders.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

// --- UPDATE ORDER STATUS ---
const updateStatus = async (
  orderId: string,
  newStatus: string
) => {
  try {
    console.log("UPDATING ORDER:", orderId);
    console.log("NEW STATUS:", newStatus);

    const response = await api.put(
      `/restaurant/orders/${orderId}/status`,
      {
        status: newStatus,
      }
    );

    console.log("UPDATE SUCCESS:", response.data);

    await fetchOrders();

    Alert.alert(
      "Updated",
      `Order status changed to "${newStatus}"`
    );

  } catch (error: any) {
    console.error(
      "UPDATE FAILED:",
      error.response?.data || error
    );

    Alert.alert(
      "Error",
      error.response?.data?.error ||
        "Failed to update order status."
    );
  }
};

  // --- HELPER TO GET STATUS COLOR ---
 const getStatusColor = (status: string) => {
  switch (status) {
    case "Pending":
      return "#FF5252"; // Red

    case "Accepted":
      return "#F48E16"; // Orange

    case "Preparing":
      return "#FFA726"; // Light Orange

    case "Accepted by Delivery":
      return "#7E57C2"; // Purple

    case "Out for Delivery":
      return "#29B6F6"; // Blue

    case "Delivered":
      return "#4CAF50"; // Green

    case "Cancelled":
      return "#9E9E9E"; // Grey

    default:
      return "#6B7B8D";
  }
};

  // --- RENDER ORDER CARD ---
  const renderOrder = ({ item }: { item: any }) => {
    const isPending = item.status === "Pending";
    const isAccepted = item.status === "Accepted";
    const isPreparing = item.status === "Preparing";

    return (
      <View style={styles.card}>
        {/* Header: Customer Name & Status Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.customerName}>{item.customerName}</Text>
            <Text style={styles.orderTime}>
              {new Date(item.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        {/* Order Items & Total */}
        <View style={styles.itemsContainer}>
          {item.items.map((dish: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQty}>x{dish.quantity}</Text>
              <Text style={styles.itemName}>{dish.name}</Text>
              <Text style={styles.itemPrice}>
                ₹{dish.price * dish.quantity}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₹{item.totalAmount}</Text>
        </View>

        {/* --- ACTION BUTTONS (Based on Status) --- */}

        {/* 1. PENDING -> Accept or Reject */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn]}
              onPress={() => updateStatus(item._id, "Accepted")}
            >
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.rejectBtn]}
              onPress={() => updateStatus(item._id, "Cancelled")}
            >
              <Ionicons name="close-circle" size={20} color="#FFF" />
              <Text style={styles.actionBtnText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 2. ACCEPTED -> Start Preparing */}
        {isAccepted && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.prepareBtn, { width: "100%" }]}
            onPress={() => updateStatus(item._id, "Preparing")}
          >
            <Ionicons name="restaurant" size={20} color="#FFF" />
            <Text style={styles.actionBtnText}>Start Preparing</Text>
          </TouchableOpacity>
        )}

{/* 3. DELIVERY PARTNER ACCEPTED -> FOOD HANDED OVER */}
{item.status === "Accepted by Delivery" && item.deliveryPartnerId && (
  <TouchableOpacity
    style={[
      styles.actionBtn,
      styles.deliveryBtn,
      { width: "100%" },
    ]}
    onPress={() => updateStatus(item._id, "Out for Delivery")}
  >
    <Ionicons name="hand-left" size={20} color="#FFF" />
    <Text style={styles.actionBtnText}>
      Food Handed Over
    </Text>
  </TouchableOpacity>
)}
 </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />

      <View style={styles.container}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity
           onPress={() => router.replace("/restaurant/dashboard")}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0A1628" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Orders</Text>
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#F48E16"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#F48E16"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No orders yet</Text>
                <Text style={styles.emptySubtitle}>
                  New orders will appear here in real-time.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0A1628",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // --- ORDER CARD STYLES ---
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8ECF0",
    shadowColor: "#0A1628",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0A1628",
  },
  orderTime: {
    fontSize: 12,
    color: "#6B7B8D",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  itemQty: {
    fontSize: 14,
    color: "#6B7B8D",
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#0A1628",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A1628",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A1628",
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F48E16",
  },

  // --- ACTION BUTTONS ---
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  acceptBtn: {
    backgroundColor: "#4CAF50",
  },
  rejectBtn: {
    backgroundColor: "#FF5252",
  },
  prepareBtn: {
    backgroundColor: "#FFA726",
  },
  deliveryBtn: {
    backgroundColor: "#29B6F6",
  },
  deliveredBtn: {
    backgroundColor: "#4CAF50",
  },

  // --- EMPTY STATE ---
  emptyState: {
    alignItems: "center",
    marginTop: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0A1628",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6B7B8D",
    marginTop: 4,
    textAlign: "center",
  },
});
