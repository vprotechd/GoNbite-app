import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useCart } from "../../context/CartContext";
import api from "../../services/api";
// import AsyncStorage from "@react-native-async-storage/async-storage";

export default function OrdersScreen() {
  const { addToCart } = useCart();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showReorderPopup, setShowReorderPopup] =
    useState(false);

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      const response =
        await api.get("/orders/my-orders");

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const sortedOrders = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      setOrders(sortedOrders);
    } catch (error) {
      console.error(
        "Failed to load orders:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  // =====================================================
  // STATUS COLOR
  // =====================================================

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#F5B82E";

      case "Accepted":
        return "#4CAF50";

      case "Preparing":
        return "#FFA726";

      case "Out for Delivery":
        return "#29B6F6";

      case "Delivered":
        return "#4CAF50";

      case "Cancelled":
        return "#FF5252";

      default:
        return "#64748B";
    }
  };

  // =====================================================
  // RESTAURANT NAME
  // =====================================================

  const getRestaurantName = (order) => {
    if (
      order?.restaurantId &&
      typeof order.restaurantId === "object"
    ) {
      return (
        order.restaurantId.name ||
        order.restaurantId.restaurantName ||
        "Restaurant"
      );
    }

    return (
      order?.restaurantName ||
      "Restaurant"
    );
  };

  // =====================================================
  // TRACK ORDER
  // =====================================================


// const handleTrackOrder = (order) => {
//   const id = order?._id;

//   if (!id) {
//     Alert.alert("Error", "Order ID not found.");
//     return;
//   }

//   console.log("🚀 Opening CUSTOMER Active Order");
//   console.log("🆔 Order ID:", id);

//   router.push({
//     pathname: "/(tabs)/active-order",
//     params: {
//       orderId: String(id),
//     },
//   });
// };



const handleTrackOrder = (order) => {
  const id = order?._id;

  console.log("🔥 TRACK ORDER PRESSED");
  console.log("📦 FULL ORDER:", order);
  console.log("🆔 ORDER ID:", id);

  if (!id) {
    Alert.alert("Error", "Order ID not found.");
    return;
  }

  console.log("🚀 Opening CUSTOMER Active Order");
  console.log("🆔 Sending Order ID:", String(id));

  router.push({
    pathname: "/(tabs)/active-order",
    params: {
      orderId: String(id),
    },
  });
};
  // =====================================================
  // OPEN REVIEW SCREEN
  // =====================================================

  const handleGiveReview = (order) => {
    if (!order?._id) {
      Alert.alert(
        "Review Error",
        "Order information is missing."
      );
      return;
    }

    if (order.status !== "Delivered") {
      Alert.alert(
        "Review Not Available",
        "You can give a review only after your order has been delivered."
      );
      return;
    }

    router.push({
      pathname: "/(tabs)/review-order",
      params: {
        orderId: String(order._id),

        restaurantId:
          typeof order.restaurantId ===
          "object"
            ? String(
                order.restaurantId?._id ||
                  ""
              )
            : String(
                order.restaurantId || ""
              ),

        restaurantName:
          getRestaurantName(order),
      },
    });
  };

  // =====================================================
  // REORDER
  // =====================================================

  const handleReorder = (order) => {
    if (
      !order?.items ||
      order.items.length === 0
    ) {
      Alert.alert(
        "Reorder Failed",
        "This order has no items to reorder."
      );
      return;
    }

    try {
      const restaurantId =
        typeof order.restaurantId ===
        "object"
          ? order.restaurantId?._id
          : order.restaurantId;

      if (!restaurantId) {
        Alert.alert(
          "Reorder Failed",
          "Restaurant information is missing from this order."
        );
        return;
      }

      order.items.forEach(
        (item) => {
          addToCart({
            _id:
              item.foodItemId ||
              item._id,

            foodItemId:
              item.foodItemId ||
              item._id,

            name: item.name,

            price:
              Number(item.price) || 0,

            quantity:
              Number(item.quantity) || 1,

            imageUrl:
              item.imageUrl || "",

            restaurantId:
              restaurantId,
          });
        }
      );

      setShowReorderPopup(true);

      setTimeout(() => {
        setShowReorderPopup(false);

        router.push(
          "/(tabs)/cart"
        );
      }, 1500);

    } catch (error) {
      console.error(
        "REORDER ERROR:",
        error
      );

      Alert.alert(
        "Reorder Failed",
        "Unable to add the items to your cart."
      );
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <View
            style={styles.headerSide}
          />

          <View
            style={
              styles.headerTitleContainer
            }
          >
            <Ionicons
              name="receipt-outline"
              size={17}
              color="#F5B82E"
            />

            <Text
              style={
                styles.headerTitle
              }
            >
              My Orders
            </Text>
          </View>

          <View
            style={styles.headerSide}
          />

        </View>

        {/* =================================================
            ORDERS LIST
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* =================================================
              LOADING
          ================================================= */}

          {isLoading ? (

            <View
              style={
                styles.loadingContainer
              }
            >
              <ActivityIndicator
                size="small"
                color="#F5B82E"
              />

              <Text
                style={
                  styles.loadingText
                }
              >
                Loading orders...
              </Text>
            </View>

          ) : orders.length === 0 ? (

            /* =================================================
                EMPTY STATE
            ================================================= */

            <View
              style={
                styles.emptyState
              }
            >
              <View
                style={
                  styles.emptyIconCircle
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={34}
                  color="#CBD5E1"
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No orders yet
              </Text>

              <Text
                style={
                  styles.emptySubtitle
                }
              >
                Start ordering your favorite food!
              </Text>

              <TouchableOpacity
                style={
                  styles.orderBtn
                }
                onPress={() =>
                  router.replace(
                    "/(tabs)"
                  )
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="home-outline"
                  size={15}
                  color="#0B0F14"
                />

                <Text
                  style={
                    styles.orderBtnText
                  }
                >
                  Go to Home
                </Text>
              </TouchableOpacity>

            </View>

          ) : (

            /* =================================================
                ORDER CARDS
            ================================================= */

            orders.map(
              (
                order,
                index
              ) => {

                const isLatest =
                  index === 0;

                const isDelivered =
                  order.status ===
                  "Delivered";

                const isActive =
                  order.status !==
                    "Delivered" &&
                  order.status !==
                    "Cancelled";

                return (
                  <View
                    key={String(
                      order._id
                    )}
                    style={[
                      styles.orderCard,

                      isLatest &&
                        styles.latestOrderCard,
                    ]}
                  >

                    {/* =================================================
                        NEW BADGE
                    ================================================= */}

                    {isLatest && (
                      <View
                        style={
                          styles.latestBadge
                        }
                      >
                        <Ionicons
                          name="sparkles"
                          size={10}
                          color="#0B0F14"
                        />

                        <Text
                          style={
                            styles.latestBadgeText
                          }
                        >
                          New
                        </Text>
                      </View>
                    )}

                    {/* =================================================
                        ORDER HEADER
                    ================================================= */}

                    <View
                      style={
                        styles.orderHeader
                      }
                    >

                      <View
                        style={
                          styles.orderTitleContainer
                        }
                      >
                        <Ionicons
                          name="receipt-outline"
                          size={15}
                          color="#F5B82E"
                        />

                        <Text
                          style={
                            styles.restaurantName
                          }
                          numberOfLines={1}
                        >
                          Order #
                          {String(
                            order._id
                          ).slice(-6)}
                        </Text>
                      </View>

                      {/* STATUS */}

                      <View
                        style={[
                          styles.statusBadge,

                          {
                            backgroundColor:
                              getStatusColor(
                                order.status
                              ),
                          },
                        ]}
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {order.status}
                        </Text>
                      </View>

                    </View>

                    {/* =================================================
                        DATE
                    ================================================= */}

                    <View
                      style={
                        styles.dateRow
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={11}
                        color="#64748B"
                      />

                      <Text
                        style={
                          styles.orderDate
                        }
                      >
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleDateString()
                          : "N/A"}{" "}
                        at{" "}
                        {order.createdAt
                          ? new Date(
                              order.createdAt
                            ).toLocaleTimeString()
                          : "N/A"}
                      </Text>
                    </View>

                    {/* =================================================
                        ITEMS
                    ================================================= */}

                    <View
                      style={
                        styles.itemsContainer
                      }
                    >
                      {(
                        order.items ||
                        []
                      ).map(
                        (
                          item,
                          idx
                        ) => (

                          <View
                            key={idx}
                            style={
                              styles.itemRow
                            }
                          >

                            <View
                              style={
                                styles.itemLeft
                              }
                            >

                              <View
                                style={
                                  styles.quantityBadge
                                }
                              >
                                <Text
                                  style={
                                    styles.quantityText
                                  }
                                >
                                  {
                                    item.quantity
                                  }x
                                </Text>
                              </View>

                              <Text
                                style={
                                  styles.itemName
                                }
                                numberOfLines={
                                  1
                                }
                              >
                                {
                                  item.name
                                }
                              </Text>

                            </View>

                            <Text
                              style={
                                styles.itemPrice
                              }
                            >
                              ₹
                              {(
                                Number(
                                  item.price
                                ) || 0
                              ) *
                                (
                                  Number(
                                    item.quantity
                                  ) || 0
                                )}
                            </Text>

                          </View>

                        )
                      )}
                    </View>

                    {/* =================================================
                        DIVIDER
                    ================================================= */}

                    <View
                      style={
                        styles.divider
                      }
                    />

                    {/* =================================================
                        TOTAL
                    ================================================= */}

                    <View
                      style={
                        styles.totalRow
                      }
                    >
                      <Text
                        style={
                          styles.totalLabel
                        }
                      >
                        Total
                      </Text>

                      <Text
                        style={
                          styles.totalValue
                        }
                      >
                        ₹
                        {Number(
                          order.totalAmount
                        ) || 0}
                      </Text>
                    </View>

                    {/* =================================================
                        PAYMENT
                    ================================================= */}

                    <View
                      style={
                        styles.footerRow
                      }
                    >
                      <View
                        style={
                          styles.paymentIcon
                        }
                      >
                        <Ionicons
                          name="cash-outline"
                          size={12}
                          color="#64748B"
                        />
                      </View>

                      <Text
                        style={
                          styles.paymentText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {order.paymentMethod ||
                          "Cash on Delivery"}
                      </Text>
                    </View>

                    {/* =================================================
                        TRACK ORDER
                    ================================================= */}

                    {isActive && (

                      <TouchableOpacity
                        style={
                          styles.trackBtn
                        }
                        onPress={() =>
                          handleTrackOrder(
                            order
                          )
                        }
                        activeOpacity={
                          0.85
                        }
                      >
                        <Ionicons
                          name="navigate-outline"
                          size={14}
                          color="#0B0F14"
                        />

                        <Text
                          style={
                            styles.trackBtnText
                          }
                        >
                          Track Order
                        </Text>
                      </TouchableOpacity>

                    )}

                    {/* =================================================
                        REVIEW
                    ================================================= */}

                    {isDelivered && (

                      <TouchableOpacity
                        style={
                          styles.reviewBtn
                        }
                        onPress={() =>
                          handleGiveReview(
                            order
                          )
                        }
                        activeOpacity={
                          0.85
                        }
                      >
                        <Ionicons
                          name="star-outline"
                          size={15}
                          color="#0B0F14"
                        />

                        <Text
                          style={
                            styles.reviewBtnText
                          }
                        >
                          Give Review
                        </Text>
                      </TouchableOpacity>

                    )}

                    {/* =================================================
                        REORDER
                    ================================================= */}

                    <TouchableOpacity
                      style={
                        styles.reorderBtn
                      }
                      onPress={() =>
                        handleReorder(
                          order
                        )
                      }
                      activeOpacity={
                        0.85
                      }
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={14}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.reorderBtnText
                        }
                      >
                        Reorder
                      </Text>
                    </TouchableOpacity>

                  </View>
                );
              }
            )
          )}

          <View
            style={{
              height: 25,
            }}
          />

        </ScrollView>

        {/* =================================================
            REORDER SUCCESS POPUP
        ================================================= */}

        <Modal
          visible={
            showReorderPopup
          }
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() =>
            setShowReorderPopup(
              false
            )
          }
        >

          <View
            style={
              styles.modalOverlay
            }
          >

            <View
              style={
                styles.reorderModal
              }
            >

              {/* SUCCESS ICON */}

              <View
                style={
                  styles.successCircle
                }
              >
                <Ionicons
                  name="checkmark"
                  size={38}
                  color="#FFFFFF"
                />
              </View>

              {/* TITLE */}

              <Text
                style={
                  styles.modalTitle
                }
              >
                Order Added!
              </Text>

              {/* DESCRIPTION */}

              <Text
                style={
                  styles.modalSubtitle
                }
              >
                Your previous order has
                been added to your cart
                successfully.
              </Text>

              {/* CART BOX */}

              <View
                style={
                  styles.cartInfoBox
                }
              >
                <Ionicons
                  name="cart-outline"
                  size={20}
                  color="#F5B82E"
                />

                <Text
                  style={
                    styles.cartInfoText
                  }
                >
                  Redirecting to Cart...
                </Text>
              </View>

              <ActivityIndicator
                size="small"
                color="#F5B82E"
                style={{
                  marginTop: 18,
                }}
              />

            </View>

          </View>

        </Modal>

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
  },

  // ===================================================
  // HEADER
  // ===================================================

  header: {
    height: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  headerSide: {
    width: 31,
  },

  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
  },

  // ===================================================
  // SCROLL
  // ===================================================

  scrollContent: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },

  // ===================================================
  // LOADING
  // ===================================================

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 45,
  },

  loadingText: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 7,
  },

  // ===================================================
  // EMPTY
  // ===================================================

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 70,
    paddingHorizontal: 15,
  },

  emptyIconCircle: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 3,
    textAlign: "center",
  },

  orderBtn: {
    marginTop: 14,
    backgroundColor: "#F5B82E",
    height: 38,
    paddingHorizontal: 17,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  orderBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 10,
  },

  // ===================================================
  // ORDER CARD
  // ===================================================

  orderCard: {
    width: "96%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 11,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E6EB",

    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",
  },

  latestOrderCard: {
    borderColor: "#F5B82E",
    borderWidth: 1.5,
    backgroundColor: "#FFFCF5",
  },

  latestBadge: {
    position: "absolute",
    top: -7,
    right: 11,
    backgroundColor: "#F5B82E",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },

  latestBadgeText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 8,
  },

  // ===================================================
  // ORDER HEADER
  // ===================================================

  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    paddingRight: 1,
  },

  orderTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 5,
  },

  restaurantName: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F14",
    flex: 1,
  },

  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    marginLeft: 7,
    maxWidth: 115,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },

  // ===================================================
  // DATE
  // ===================================================

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 9,
  },

  orderDate: {
    fontSize: 9,
    color: "#64748B",
  },

  // ===================================================
  // ITEMS
  // ===================================================

  itemsContainer: {
    marginTop: 1,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
    minHeight: 20,
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },

  quantityBadge: {
    backgroundColor: "#F5F7FA",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginRight: 5,
  },

  quantityText: {
    fontSize: 8,
    color: "#64748B",
    fontWeight: "700",
  },

  itemName: {
    fontSize: 10,
    color: "#0B0F14",
    flex: 1,
  },

  itemPrice: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0B0F14",
  },

  // ===================================================
  // DIVIDER
  // ===================================================

  divider: {
    height: 1,
    backgroundColor: "#E2E6EB",
    marginVertical: 8,
  },

  // ===================================================
  // TOTAL
  // ===================================================

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },

  totalLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#F5B82E",
  },

  // ===================================================
  // PAYMENT
  // ===================================================

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },

  paymentIcon: {
    width: 21,
    height: 21,
    borderRadius: 6,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    justifyContent: "center",
  },

  paymentText: {
    fontSize: 9,
    color: "#64748B",
    flex: 1,
  },

  // ===================================================
  // TRACK
  // ===================================================

  trackBtn: {
    width: "100%",
    height: 36,
    backgroundColor: "#F5B82E",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginBottom: 7,
  },

  trackBtnText: {
    color: "#0B0F14",
    fontWeight: "800",
    fontSize: 10,
  },

  // ===================================================
  // REVIEW
  // ===================================================

  reviewBtn: {
    width: "100%",
    height: 36,
    backgroundColor: "#F5B82E",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    marginBottom: 7,
  },

  reviewBtnText: {
    color: "#0B0F14",
    fontWeight: "800",
    fontSize: 10,
  },

  // ===================================================
  // REORDER
  // ===================================================

  reorderBtn: {
    width: "100%",
    height: 36,
    backgroundColor: "#081A33",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  reorderBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
  },

  // ===================================================
  // MODAL
  // ===================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  reorderModal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 25,
    paddingVertical: 28,
    alignItems: "center",
  },

  successCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#0B0F14",
    textAlign: "center",
  },

  modalSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 10,
  },

  cartInfoBox: {
    width: "100%",
    backgroundColor: "#FFFCF5",
    borderWidth: 1,
    borderColor: "#F5B82E",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },

  cartInfoText: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
});
