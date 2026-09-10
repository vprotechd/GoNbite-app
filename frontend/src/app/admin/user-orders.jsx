import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useLocalSearchParams } from "expo-router";
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

export default function UserOrdersScreen() {
  const { userId, userName } = useLocalSearchParams();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================
  // ADMIN TOKEN
  // =========================================

  const getAdminToken = async () => {
    const token = await AsyncStorage.getItem("adminToken");

    if (!token) {
      router.replace("/admin/login");
      return null;
    }

    return token;
  };

  // =========================================
  // FETCH USER ORDERS
  // =========================================

  useEffect(() => {
    if (userId) {
      fetchOrders();
    } else {
      setIsLoading(false);
      Alert.alert("Error", "User information is missing.");
    }
  }, [userId]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const token = await getAdminToken();

      if (!token) return;

      /*
       * IMPORTANT:
       * We now use USER ID instead of USER NAME.
       *
       * Example:
       * /admin/user-orders/64abc123...
       */

      const res = await api.get(
        `/admin/user-orders/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const orderData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.orders)
          ? res.data.orders
          : [];

      setOrders(orderData);
    } catch (error) {
      console.error(
        "Fetch User Orders Error:",
        error?.response?.data || error?.message,
      );

      if (error?.response?.status === 401) {
        await AsyncStorage.removeItem("adminToken");
        router.replace("/admin/login");
        return;
      }

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Failed to load user orders.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================
  // REFRESH
  // =========================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const token = await getAdminToken();

      if (!token) return;

      const res = await api.get(
        `/admin/user-orders/${encodeURIComponent(userId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const orderData = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.orders)
          ? res.data.orders
          : [];

      setOrders(orderData);
    } catch (error) {
      console.error(
        "Refresh User Orders Error:",
        error?.response?.data || error?.message,
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to refresh orders.",
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================
  // STATUS COLOR
  // =========================================

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#F5B82E";

      case "Accepted":
        return "#4CAF50";

      case "Accepted by Restaurant":
        return "#4CAF50";

      case "Preparing":
        return "#FFA726";

      case "Ready for Pickup":
        return "#8B5CF6";

      case "Accepted by Delivery":
        return "#6366F1";

      case "Out for Delivery":
        return "#29B6F6";

      case "Delivered":
        return "#16A34A";

      case "Cancelled":
        return "#FF5252";

      default:
        return "#64748B";
    }
  };

  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return `${parsedDate.toLocaleDateString()} at ${parsedDate.toLocaleTimeString()}`;
  };

  // =========================================
  // SAFE PRICE
  // =========================================

  const getItemTotal = (item) => {
    const price = Number(item?.price || 0);
    const quantity = Number(item?.quantity || 0);

    return price * quantity;
  };

  // =========================================
  // SCREEN
  // =========================================

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
            onPress={() => router.replace("/admin/users")}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color="#0B0F14"
            />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {userName || "User"}'s Orders
            </Text>

            <Text style={styles.headerSubtitle}>
              {orders.length}{" "}
              {orders.length === 1 ? "order" : "orders"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={fetchOrders}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="refresh"
              size={21}
              color="#0B0F14"
            />
          </TouchableOpacity>

        </View>

        {/* =====================================
            LOADING
        ====================================== */}

        {isLoading ? (
          <View style={styles.loadingContainer}>

            <ActivityIndicator
              size="large"
              color="#F5B82E"
            />

            <Text style={styles.loadingText}>
              Loading orders...
            </Text>

          </View>
        ) : orders.length === 0 ? (

          /* =====================================
              EMPTY STATE
          ====================================== */

          <View style={styles.emptyState}>

            <View style={styles.emptyIcon}>
              <Ionicons
                name="receipt-outline"
                size={55}
                color="#CBD5E1"
              />
            </View>

            <Text style={styles.emptyTitle}>
              No orders found
            </Text>

            <Text style={styles.emptySubtitle}>
              This user hasn't placed any orders yet.
            </Text>

          </View>
        ) : (

          /* =====================================
              ORDERS LIST
          ====================================== */

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#F5B82E"
              />
            }
          >

            {/* =================================
                SUMMARY
            ================================== */}

            <View style={styles.summaryCard}>

              <View style={styles.summaryIcon}>
                <Ionicons
                  name="receipt"
                  size={22}
                  color="#0B0F14"
                />
              </View>

              <View style={styles.summaryContent}>

                <Text style={styles.summaryTitle}>
                  Order History
                </Text>

                <Text style={styles.summarySubtitle}>
                  Complete order history of{" "}
                  {userName || "this user"}
                </Text>

              </View>

              <View style={styles.summaryCount}>
                <Text style={styles.summaryCountText}>
                  {orders.length}
                </Text>
              </View>

            </View>

            {/* =================================
                ORDER CARDS
            ================================== */}

            {orders.map((order) => {

              const items = Array.isArray(order?.items)
                ? order.items
                : [];

              return (
                <View
                  key={order?._id}
                  style={styles.orderCard}
                >

                  {/* ==============================
                      ORDER HEADER
                  =============================== */}

                  <View style={styles.orderHeader}>

                    <View style={styles.orderHeaderLeft}>

                      <Text style={styles.orderId}>
                        Order #
                        {order?._id
                          ? order._id.slice(-6).toUpperCase()
                          : "------"}
                      </Text>

                      <Text style={styles.orderDate}>
                        {formatDate(order?.createdAt)}
                      </Text>

                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(order?.status),
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {order?.status || "Unknown"}
                      </Text>
                    </View>

                  </View>

                  {/* ==============================
                      RESTAURANT
                  =============================== */}

                  {order?.restaurantId ||
                  order?.restaurantName ? (
                    <View style={styles.restaurantRow}>

                      <View style={styles.restaurantIcon}>
                        <Ionicons
                          name="restaurant-outline"
                          size={16}
                          color="#64748B"
                        />
                      </View>

                      <View style={styles.restaurantContent}>

                        <Text style={styles.restaurantLabel}>
                          Restaurant
                        </Text>

                        <Text
                          style={styles.restaurantName}
                          numberOfLines={1}
                        >
                          {order?.restaurantId?.restaurantName ||
                            order?.restaurantName ||
                            "Restaurant"}
                        </Text>

                      </View>

                    </View>
                  ) : null}

                  {/* ==============================
                      ITEMS
                  =============================== */}

                  <View style={styles.itemsContainer}>

                    <Text style={styles.itemsTitle}>
                      Items
                    </Text>

                    {items.length === 0 ? (
                      <Text style={styles.noItemsText}>
                        No item information available.
                      </Text>
                    ) : (
                      items.map((item, idx) => (
                        <View
                          key={`${order?._id}-${idx}`}
                          style={styles.itemRow}
                        >

                          <View style={styles.itemLeft}>

                            <Text style={styles.itemQuantity}>
                              ×{item?.quantity || 0}
                            </Text>

                            <Text
                              style={styles.itemName}
                              numberOfLines={2}
                            >
                              {item?.name || "Food Item"}
                            </Text>

                          </View>

                          <Text style={styles.itemPrice}>
                            ₹{getItemTotal(item)}
                          </Text>

                        </View>
                      ))
                    )}

                  </View>

                  {/* ==============================
                      DIVIDER
                  =============================== */}

                  <View style={styles.divider} />

                  {/* ==============================
                      TOTAL
                  =============================== */}

                  <View style={styles.totalRow}>

                    <Text style={styles.totalLabel}>
                      Total Amount
                    </Text>

                    <Text style={styles.totalValue}>
                      ₹{Number(order?.totalAmount || 0)}
                    </Text>

                  </View>

                  {/* ==============================
                      PAYMENT
                  =============================== */}

                  <View style={styles.paymentRow}>

                    <View style={styles.paymentIcon}>
                      <Ionicons
                        name="card-outline"
                        size={14}
                        color="#64748B"
                      />
                    </View>

                    <Text style={styles.paymentLabel}>
                      Payment
                    </Text>

                    <Text style={styles.paymentText}>
                      {order?.paymentMethod ||
                        "Not specified"}
                    </Text>

                  </View>

                </View>
              );
            })}

          </ScrollView>
        )}

      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingHorizontal: 18,
    paddingVertical: 13,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F1F5F9",
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 10,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F14",
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

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F1F5F9",
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
    color: "#0B0F14",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  // =========================================
  // SCROLL
  // =========================================

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // =========================================
  // SUMMARY
  // =========================================

  summaryCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 14,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,

    backgroundColor: "#F5B82E",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 11,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  summarySubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
  },

  summaryCount: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,

    backgroundColor: "#081A33",

    alignItems: "center",
    justifyContent: "center",
  },

  summaryCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
  },

  // =========================================
  // ORDER CARD
  // =========================================

  orderCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 16,

    padding: 16,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E2E6EB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 2,
  },

  // =========================================
  // ORDER HEADER
  // =========================================

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",

    marginBottom: 12,
  },

  orderHeaderLeft: {
    flex: 1,
    paddingRight: 10,
  },

  orderId: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
  },

  orderDate: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,

    borderRadius: 12,

    maxWidth: 145,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  // =========================================
  // RESTAURANT
  // =========================================

  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F8FAFC",

    borderRadius: 10,

    padding: 9,

    marginBottom: 13,
  },

  restaurantIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,

    backgroundColor: "#FFFFFF",

    alignItems: "center",
    justifyContent: "center",

    marginRight: 9,
  },

  restaurantContent: {
    flex: 1,
  },

  restaurantLabel: {
    fontSize: 9,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
  },

  restaurantName: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "700",
    marginTop: 2,
  },

  // =========================================
  // ITEMS
  // =========================================

  itemsContainer: {
    paddingTop: 2,
  },

  itemsTitle: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 8,
  },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 7,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "flex-start",

    flex: 1,

    paddingRight: 10,
  },

  itemQuantity: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F5B82E",

    width: 28,
  },

  itemName: {
    flex: 1,

    fontSize: 13,
    color: "#0B0F14",
    fontWeight: "500",
  },

  itemPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B0F14",
  },

  noItemsText: {
    fontSize: 12,
    color: "#94A3B8",
  },

  // =========================================
  // DIVIDER
  // =========================================

  divider: {
    height: 1,
    backgroundColor: "#E2E6EB",
    marginVertical: 12,
  },

  // =========================================
  // TOTAL
  // =========================================

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 10,
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#F5B82E",
  },

  // =========================================
  // PAYMENT
  // =========================================

  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  paymentIcon: {
    marginRight: 5,
  },

  paymentLabel: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
    marginRight: 5,
  },

  paymentText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },

});

