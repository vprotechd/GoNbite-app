import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  // =================================================
  // FETCH ALL ORDERS
  // =================================================

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      console.log("📦 Fetching all admin orders...");

      const res = await api.get("/admin/orders");

      console.log("📦 ADMIN ORDERS RESPONSE:", res.data);

      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res.data?.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        "❌ Fetch orders error:",
        error?.response?.data || error?.message
      );

      if (error?.response?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please login to the admin panel again.",
          [
            {
              text: "OK",
              onPress: async () => {
                router.replace("/admin/login");
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load orders."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // =================================================
  // REFRESH
  // =================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const res = await api.get("/admin/orders");

      if (Array.isArray(res.data)) {
        setOrders(res.data);
      } else if (Array.isArray(res.data?.orders)) {
        setOrders(res.data.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error(
        "❌ Refresh orders error:",
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Error",
        "Failed to refresh orders."
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =================================================
  // STATUS COLOR
  // =================================================

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "#2E7D32";

      case "Cancelled":
        return "#C62828";

      case "Out for Delivery":
        return "#1565C0";

      case "Preparing":
        return "#EF6C00";

      case "Ready for Pickup":
        return "#6A1B9A";

      case "Accepted":
      case "Accepted by Restaurant":
      case "Accepted by Delivery":
        return "#00838F";

      case "Pending":
      default:
        return "#757575";
    }
  };

  // =================================================
  // FORMAT DATE
  // =================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    try {
      return new Date(date).toLocaleString();
    } catch {
      return "N/A";
    }
  };

  // =================================================
  // GET CUSTOMER NAME
  // =================================================

  const getCustomerName = (order) => {
    return (
      order?.user?.name ||
      order?.userName ||
      order?.customer?.name ||
      "Customer"
    );
  };

  // =================================================
  // GET RESTAURANT NAME
  // =================================================

  const getRestaurantName = (order) => {
    return (
      order?.restaurant?.name ||
      order?.restaurantName ||
      "Restaurant"
    );
  };

  // =================================================
  // GET TOTAL
  // =================================================

  const getTotal = (order) => {
    const total =
      order?.totalAmount ??
      order?.total ??
      order?.amount ??
      0;

    return Number(total).toFixed(2);
  };

  // =================================================
  // LOADING
  // =================================================

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />

        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text style={styles.loadingText}>
            Loading orders...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =================================================
  // UI
  // =================================================

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={25}
            color="#222"
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Manage Orders
          </Text>

          <Text style={styles.headerSubtitle}>
            Monitor all customer orders
          </Text>
        </View>

        <View style={styles.orderCount}>
          <Text style={styles.orderCountText}>
            {orders.length}
          </Text>
        </View>
      </View>

      {/* ORDERS */}

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={70}
              color="#BDBDBD"
            />

            <Text style={styles.emptyTitle}>
              No Orders Found
            </Text>

            <Text style={styles.emptyText}>
              There are currently no orders
              available.
            </Text>
          </View>
        ) : (
          orders.map((order, index) => {
            const status =
              order?.status || "Pending";

            const items =
              Array.isArray(order?.items)
                ? order.items
                : [];

            return (
              <View
                key={
                  order?._id ||
                  order?.id ||
                  index
                }
                style={styles.orderCard}
              >
                {/* ORDER HEADER */}

                <View style={styles.orderHeader}>
                  <View>
                    <Text style={styles.orderId}>
                      Order #
                      {String(
                        order?._id ||
                          order?.id ||
                          "N/A"
                      ).slice(-8)}
                    </Text>

                    <Text style={styles.date}>
                      {formatDate(
                        order?.createdAt ||
                          order?.created_at
                      )}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          getStatusColor(status),
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {status}
                    </Text>
                  </View>
                </View>

                {/* CUSTOMER */}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color="#666"
                  />

                  <View style={styles.infoText}>
                    <Text style={styles.label}>
                      Customer
                    </Text>

                    <Text style={styles.value}>
                      {getCustomerName(order)}
                    </Text>
                  </View>
                </View>

                {/* RESTAURANT */}

                <View style={styles.infoRow}>
                  <Ionicons
                    name="restaurant-outline"
                    size={20}
                    color="#666"
                  />

                  <View style={styles.infoText}>
                    <Text style={styles.label}>
                      Restaurant
                    </Text>

                    <Text style={styles.value}>
                      {getRestaurantName(order)}
                    </Text>
                  </View>
                </View>

                {/* ITEMS */}

                <View style={styles.itemsSection}>
                  <Text style={styles.itemsTitle}>
                    Items
                  </Text>

                  {items.length === 0 ? (
                    <Text style={styles.noItems}>
                      No item information
                    </Text>
                  ) : (
                    items.map((item, itemIndex) => (
                      <View
                        key={
                          item?._id ||
                          item?.foodItemId ||
                          itemIndex
                        }
                        style={styles.itemRow}
                      >
                        <Text style={styles.itemName}>
                          {item?.name ||
                            item?.foodName ||
                            "Food Item"}
                        </Text>

                        <Text style={styles.itemQuantity}>
                          × {item?.quantity || 1}
                        </Text>
                      </View>
                    ))
                  )}
                </View>

                {/* PAYMENT */}

                <View style={styles.paymentRow}>
                  <View>
                    <Text style={styles.label}>
                      Payment
                    </Text>

                    <Text style={styles.value}>
                      {order?.paymentMethod ||
                        "N/A"}
                    </Text>
                  </View>

                  <View style={styles.totalContainer}>
                    <Text style={styles.label}>
                      Total
                    </Text>

                    <Text style={styles.total}>
                      ₹{getTotal(order)}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// =================================================
// STYLES
// =================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  headerSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#777",
  },

  orderCount: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5B82E",
    justifyContent: "center",
    alignItems: "center",
  },

  orderCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  content: {
    padding: 15,
    paddingBottom: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
  },

  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 15,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
  },

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  orderId: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  date: {
    marginTop: 4,
    fontSize: 12,
    color: "#888",
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  infoText: {
    marginLeft: 10,
    flex: 1,
  },

  label: {
    fontSize: 11,
    color: "#888",
    marginBottom: 2,
  },

  value: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  itemsSection: {
    marginTop: 4,
    marginBottom: 15,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEEEEE",
  },

  itemsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },

  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#555",
  },

  itemQuantity: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginLeft: 10,
  },

  noItems: {
    fontSize: 13,
    color: "#999",
  },

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  totalContainer: {
    alignItems: "flex-end",
  },

  total: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222",
  },
});