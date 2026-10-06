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
  useWindowDimensions,
  View,
} from "react-native";

import api from "../../services/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =================================================
  // RESPONSIVE SCREEN SIZE
  // =================================================

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

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
        error?.response?.data || error?.message,
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
          ],
        );
      } else {
        Alert.alert("Error", "Failed to load orders.");
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
        error?.response?.data || error?.message,
      );

      Alert.alert("Error", "Failed to refresh orders.");
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
    return order?.restaurant?.name || order?.restaurantName || "Restaurant";
  };

  // =================================================
  // GET TOTAL
  // =================================================

  const getTotal = (order) => {
    const total = order?.totalAmount ?? order?.total ?? order?.amount ?? 0;

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
          <ActivityIndicator size="large" color="#FF6B35" />

          <Text style={styles.loadingText}>Loading orders...</Text>
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

      <View
        style={[
          styles.header,
          isTablet && styles.headerTablet,
          isDesktop && styles.headerDesktop,
        ]}
      >
       <TouchableOpacity
  onPress={() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/admin");
    }
  }}
  style={styles.backButton}
  activeOpacity={0.7}
>
  <Ionicons name="arrow-back" size={25} color="#222" />
</TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text
            style={[
              styles.headerTitle,
              isMobile && styles.headerTitleMobile,
            ]}
            numberOfLines={1}
          >
            Manage Orders
          </Text>

          <Text
            style={styles.headerSubtitle}
            numberOfLines={1}
          >
            Monitor all customer orders
          </Text>
        </View>

        <View style={styles.orderCount}>
          <Text style={styles.orderCountText}>{orders.length}</Text>
        </View>
      </View>

      {/* ORDERS */}

      <ScrollView
        contentContainerStyle={[
          styles.content,
          isTablet && styles.contentTablet,
          isDesktop && styles.contentDesktop,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="receipt-outline"
              size={70}
              color="#BDBDBD"
            />

            <Text style={styles.emptyTitle}>No Orders Found</Text>

            <Text style={styles.emptyText}>
              There are currently no orders available.
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.ordersGrid,
              isTablet && styles.ordersGridTablet,
              isDesktop && styles.ordersGridDesktop,
            ]}
          >
            {orders.map((order, index) => {
              const status = order?.status || "Pending";

              const items = Array.isArray(order?.items)
                ? order.items
                : [];

              return (
                <View
                  key={order?._id || order?.id || index}
                  style={[
                    styles.orderCard,
                    isTablet && styles.orderCardTablet,
                    isDesktop && styles.orderCardDesktop,
                  ]}
                >
                  {/* ORDER HEADER */}

                  <View style={styles.orderHeader}>
                    <View style={styles.orderHeaderInfo}>
                      <Text
                        style={styles.orderId}
                        numberOfLines={1}
                      >
                        Order #
                        {String(
                          order?._id || order?.id || "N/A",
                        ).slice(-8)}
                      </Text>

                      <Text
                        style={styles.date}
                        numberOfLines={1}
                      >
                        {formatDate(
                          order?.createdAt ||
                            order?.created_at,
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
                      <Text
                        style={styles.statusText}
                        numberOfLines={1}
                      >
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

                      <Text
                        style={styles.value}
                        numberOfLines={2}
                      >
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

                      <Text
                        style={styles.value}
                        numberOfLines={2}
                      >
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
                          <Text
                            style={styles.itemName}
                            numberOfLines={2}
                          >
                            {item?.name ||
                              item?.foodName ||
                              "Food Item"}
                          </Text>

                          <Text
                            style={styles.itemQuantity}
                          >
                            × {item?.quantity || 1}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  {/* PAYMENT */}

                  <View style={styles.paymentRow}>
                    <View style={styles.paymentInfo}>
                      <Text style={styles.label}>
                        Payment
                      </Text>

                      <Text
                        style={styles.value}
                        numberOfLines={1}
                      >
                        {order?.paymentMethod || "N/A"}
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
            })}
          </View>
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

  // =================================================
  // HEADER
  // =================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },

  headerTablet: {
    paddingHorizontal: 28,
    paddingVertical: 18,
  },

  headerDesktop: {
    paddingHorizontal: 40,
    paddingVertical: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    flexShrink: 0,
  },

  headerTextContainer: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
  },

  headerTitleMobile: {
    fontSize: 19,
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
    backgroundColor: "#FF6B35",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
    flexShrink: 0,
  },

  orderCountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  // =================================================
  // CONTENT
  // =================================================

  content: {
    padding: 15,
    paddingBottom: 40,
  },

  contentTablet: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 50,
  },

  contentDesktop: {
    width: "100%",
    maxWidth: 1250,
    alignSelf: "center",
    paddingHorizontal: 30,
    paddingTop: 28,
    paddingBottom: 60,
  },

  // =================================================
  // ORDERS GRID
  // =================================================

  ordersGrid: {
    width: "100%",
  },

  ordersGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  ordersGridDesktop: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  // =================================================
  // LOADING
  // =================================================

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  // =================================================
  // EMPTY
  // =================================================

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
    paddingHorizontal: 20,
  },

  emptyTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    maxWidth: 400,
  },

  // =================================================
  // ORDER CARD
  // =================================================

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
    shadowColor: "#000",
  },

  orderCardTablet: {
    width: "48.5%",
    marginBottom: 20,
    padding: 18,
  },

  orderCardDesktop: {
    width: "48.5%",
    marginBottom: 24,
    padding: 20,
  },

  // =================================================
  // ORDER HEADER
  // =================================================

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },

  orderHeaderInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
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
    maxWidth: "55%",
    flexShrink: 0,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },

  // =================================================
  // INFORMATION
  // =================================================

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  infoText: {
    marginLeft: 10,
    flex: 1,
    minWidth: 0,
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

  // =================================================
  // ITEMS
  // =================================================

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
    alignItems: "center",
    paddingVertical: 4,
  },

  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#555",
    minWidth: 0,
    paddingRight: 10,
  },

  itemQuantity: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
    marginLeft: 10,
    flexShrink: 0,
  },

  noItems: {
    fontSize: 13,
    color: "#999",
  },

  // =================================================
  // PAYMENT
  // =================================================

  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },

  paymentInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: 10,
  },

  totalContainer: {
    alignItems: "flex-end",
    flexShrink: 0,
  },

  total: {
    fontSize: 19,
    fontWeight: "800",
    color: "#222",
  },
});