import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
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
  const updateStatus = async (orderId: string, newStatus: string) => {
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

      Alert.alert("Updated", `Order status changed to "${newStatus}"`);
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
        return "#FF8500";

      case "Accepted":
        return "#FF8500";

      case "Preparing":
        return "#FF9800";

      case "Accepted by Delivery":
        return "#7E57C2";

      case "Out for Delivery":
        return "#29B6F6";

      case "Delivered":
        return "#4CAF50";

      case "Cancelled":
        return "#9E9E9E";

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
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {item.customerName}
            </Text>

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
              {
                backgroundColor: getStatusColor(item.status),
              },
            ]}
          >
            <Text style={styles.statusText}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.itemsContainer}>
          {item.items.map((dish: any, index: number) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemQty}>
                x{dish.quantity}
              </Text>

              <Text
                style={styles.itemName}
                numberOfLines={2}
              >
                {dish.name}
              </Text>

              <Text style={styles.itemPrice}>
                ₹{dish.price * dish.quantity}
              </Text>
            </View>
          ))}
        </View>

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>

          <Text style={styles.totalAmount}>
            ₹{item.totalAmount}
          </Text>
        </View>

        {/* --- ACTION BUTTONS --- */}

        {/* PENDING -> Accept / Reject */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.acceptBtn,
              ]}
              onPress={() =>
                updateStatus(item._id, "Accepted")
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#FFF"
              />

              <Text style={styles.actionBtnText}>
                Accept
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.rejectBtn,
              ]}
              onPress={() =>
                updateStatus(item._id, "Cancelled")
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#FFF"
              />

              <Text style={styles.actionBtnText}>
                Reject
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ACCEPTED -> Start Preparing */}
        {isAccepted && (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              styles.prepareBtn,
              styles.singleActionBtn,
            ]}
            onPress={() =>
              updateStatus(item._id, "Preparing")
            }
            activeOpacity={0.8}
          >
            <Ionicons
              name="restaurant"
              size={20}
              color="#FFF"
            />

            <Text style={styles.actionBtnText}>
              Start Preparing
            </Text>
          </TouchableOpacity>
        )}

        {/* DELIVERY PARTNER ACCEPTED -> FOOD HANDED OVER */}
        {item.status === "Accepted by Delivery" &&
          item.deliveryPartnerId && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.deliveryBtn,
                styles.singleActionBtn,
              ]}
              onPress={() =>
                updateStatus(
                  item._id,
                  "Out for Delivery"
                )
              }
              activeOpacity={0.8}
            >
              <Ionicons
                name="hand-left"
                size={20}
                color="#FFF"
              />

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
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0A1628"
      />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.replace("/restaurant/dashboard")
            }
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#0A1628"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Manage Orders
          </Text>

          <View style={{ width: 32 }} />
        </View>

        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#FF6B35"
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
                colors={["#FF6B35"]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons
                  name="receipt-outline"
                  size={64}
                  color="#D1D5DB"
                />

                <Text style={styles.emptyTitle}>
                  No orders yet
                </Text>

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

  // --- HEADER ---
  header: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Platform.OS === "web" ? 24 : 18,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEF1F5",
  },

  backButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: Platform.OS === "web" ? 20 : 19,
    fontWeight: "800",
    color: "#0A1628",
  },

  // --- LIST ---
  listContent: {
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: Platform.OS === "web" ? 20 : 14,
    paddingVertical: 16,
    paddingBottom: 40,
  },

  // --- ORDER CARD ---
  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Platform.OS === "web" ? 16 : 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8ECF0",
    shadowColor: "#0A1628",
    shadowOffset: {
      width: 0,
      height: 2,
    },
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

  customerInfo: {
    flex: 1,
    paddingRight: 10,
  },

  customerName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0A1628",
  },

  orderTime: {
    fontSize: 12,
    color: "#6B7B8D",
    marginTop: 3,
  },

  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    maxWidth: "55%",
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // --- ITEMS ---
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginBottom: 12,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  itemQty: {
    fontSize: 14,
    color: "#6B7B8D",
    width: 34,
  },

  itemName: {
    flex: 1,
    fontSize: 14,
    color: "#0A1628",
    paddingRight: 10,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0A1628",
    minWidth: 55,
    textAlign: "right",
  },

  // --- TOTAL ---
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
    marginBottom: 15,
  },

  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A1628",
  },

  totalAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FF6B35",
  },

  // --- ACTION BUTTONS ---
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  actionBtn: {
    flex: 1,
    minHeight: 42,
    maxHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 6,
  },

  singleActionBtn: {
    flex: 0,
    alignSelf: "center",
    width: Platform.OS === "web" ? 230 : "78%",
    maxWidth: 260,
  },

  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },

  acceptBtn: {
    backgroundColor: "#4CAF50",
  },

  rejectBtn: {
    backgroundColor: "#FF8500",
  },

  prepareBtn: {
    backgroundColor: "#FF9800",
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
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 20,
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
    lineHeight: 20,
  },
});