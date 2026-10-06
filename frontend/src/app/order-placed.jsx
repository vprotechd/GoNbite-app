import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OrderPlacedScreen() {
  const {
    orderId,
    total,
    paymentMethod,
  } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* ==================================================
            SUCCESS ICON
        ================================================== */}

        <View style={styles.successCircle}>
          <Ionicons
            name="checkmark"
            size={58}
            color="#FFFFFF"
          />
        </View>

        {/* ==================================================
            TITLE
        ================================================== */}

        <Text style={styles.title}>
          Order Placed!
        </Text>

        <Text style={styles.subtitle}>
          Your order has been placed successfully.
        </Text>

        <Text style={styles.restaurantText}>
          The restaurant will start preparing
          your order shortly.
        </Text>

        {/* ==================================================
            ORDER DETAILS
        ================================================== */}

        <View style={styles.orderCard}>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Order ID
            </Text>

            <Text
              style={styles.detailValue}
              numberOfLines={1}
            >
              {orderId || "Confirmed"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              Payment
            </Text>

            <Text style={styles.detailValue}>
              {paymentMethod ||
                "Cash on Delivery"}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.totalLabel}>
              Total Amount
            </Text>

            <Text style={styles.totalValue}>
              ₹{total || "0"}
            </Text>
          </View>

        </View>

        {/* ==================================================
            COD INFORMATION
        ================================================== */}

        <View style={styles.codInfo}>

          <View style={styles.codIcon}>
            <Ionicons
              name="cash-outline"
              size={21}
              color="#F5B82E"
            />
          </View>

          <View style={styles.codTextContainer}>
            <Text style={styles.codTitle}>
              Cash on Delivery
            </Text>

            <Text style={styles.codSubtitle}>
              Please keep the exact amount ready
              when your order arrives.
            </Text>
          </View>

        </View>

        {/* ==================================================
            VIEW ORDERS
        ================================================== */}

        <TouchableOpacity
          style={styles.ordersButton}
          activeOpacity={0.85}
          onPress={() =>
            router.replace("/(tabs)/orders")
          }
        >
          <Ionicons
            name="receipt-outline"
            size={18}
            color="#0B0F14"
          />

          <Text style={styles.ordersButtonText}>
            View My Orders
          </Text>
        </TouchableOpacity>

        {/* ==================================================
            CONTINUE SHOPPING
        ================================================== */}

        <TouchableOpacity
          style={styles.homeButton}
          activeOpacity={0.8}
          onPress={() =>
            router.replace("/(tabs)")
          }
        >
          <Text style={styles.homeButtonText}>
            Continue Shopping
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 55,
  },

  successCircle: {
    width: 95,
    height: 95,
    borderRadius: 48,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },

  title: {
    fontSize: 25,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 7,
  },

  subtitle: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
    textAlign: "center",
  },

  restaurantText: {
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
    lineHeight: 17,
    maxWidth: 300,
  },

  orderCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginTop: 25,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 28,
  },

  detailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
  },

  detailValue: {
    flex: 1,
    marginLeft: 15,
    textAlign: "right",
    fontSize: 11,
    color: "#0B0F14",
    fontWeight: "700",
  },

  totalLabel: {
    fontSize: 13,
    color: "#0B0F14",
    fontWeight: "800",
  },

  totalValue: {
    fontSize: 16,
    color: "#F5B82E",
    fontWeight: "800",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E6EB",
    marginVertical: 7,
  },

  codInfo: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E8",
    borderWidth: 1,
    borderColor: "#F5B82E",
    borderRadius: 12,
    padding: 11,
    marginTop: 12,
  },

  codIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  codTextContainer: {
    flex: 1,
  },

  codTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 2,
  },

  codSubtitle: {
    fontSize: 10,
    color: "#64748B",
    lineHeight: 14,
  },

  ordersButton: {
    width: "100%",
    height: 45,
    backgroundColor: "#F5B82E",
    borderRadius: 10,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  ordersButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B0F14",
  },

  homeButton: {
    width: "100%",
    height: 43,
    borderRadius: 10,
    marginTop: 9,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  homeButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
  },
});