import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
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

import { useCart } from "../../context/CartContext";
import api from "../../services/api";


// ======================================================
// CONFIRM ORDER SCREEN
// ======================================================

export default function ConfirmOrderScreen() {

  const {
    cartItems,
    clearCart,
  } = useCart();

  const [isConfirming, setIsConfirming] =
    useState(false);

  const [successVisible, setSuccessVisible] =
    useState(false);


  // ====================================================
  // GET PARAMS
  // ====================================================

  const {
    restaurantId,
    items,
    total,
    address,
    paymentMethod,
  } = useLocalSearchParams();


  // ====================================================
  // PARSE DATA
  // ====================================================

  const parsedItems = items
    ? JSON.parse(items)
    : [];

  const parsedTotal =
    parseFloat(String(total || "0")) || 0;

  const finalItems =
    parsedItems.length > 0
      ? parsedItems
      : cartItems;


  // ====================================================
  // PLACE ORDER
  // ====================================================

  const placeOrder = async () => {

    // --------------------------------------------------
    // EMPTY CART CHECK
    // --------------------------------------------------

    if (finalItems.length === 0) {

      Alert.alert(
        "Empty Cart",
        "Your cart is empty."
      );

      return;
    }


    setIsConfirming(true);


    try {

      // ------------------------------------------------
      // VALID RESTAURANT ID
      // ------------------------------------------------

      const validRestaurantId =
        restaurantId &&
        restaurantId !== "unknown"
          ? String(restaurantId)
          : finalItems[0]?.restaurantId ||
            null;


      if (!validRestaurantId) {

        Alert.alert(
          "Error",
          "Restaurant ID is missing. Please add items again."
        );

        setIsConfirming(false);

        return;
      }


      // ------------------------------------------------
      // ORDER DATA
      // ------------------------------------------------

      const orderData = {

        restaurantId:
          validRestaurantId,

        items: finalItems.map(
          ({
            _id,
            name,
            price,
            quantity,
          }) => ({
            _id,
            name,
            price,
            quantity,
          })
        ),

        totalAmount:
          parsedTotal,

        deliveryAddress:
          String(address || ""),

        paymentMethod:
          String(
            paymentMethod ||
              "Cash on Delivery"
          ),

      };


      // ------------------------------------------------
      // CREATE ORDER
      // ------------------------------------------------

      await api.post(
        "/orders/create",
        orderData
      );


      setIsConfirming(false);

      setSuccessVisible(true);


      // ------------------------------------------------
      // REDIRECT AFTER SUCCESS
      // ------------------------------------------------

      setTimeout(() => {

        setSuccessVisible(false);

        clearCart();

        router.replace(
          "/(tabs)/orders"
        );

      }, 4000);


    } catch (error) {

      console.error(
        "❌ Order Error:",
        error
      );


      Alert.alert(
        "Order Failed",
        "Could not place your order. Please try again."
      );


      setIsConfirming(false);

    }

  };


  // ====================================================
  // RENDER
  // ====================================================

  return (

    <SafeAreaView style={styles.safeArea}>

      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />


      <View style={styles.container}>


        {/* ==================================================
            HEADER
        ================================================== */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >

            <Ionicons
              name="arrow-back"
              size={19}
              color="#0B0F14"
            />

          </TouchableOpacity>


          <Text style={styles.headerTitle}>
            Confirm Order
          </Text>


          <View
            style={styles.headerSpacer}
          />

        </View>


        {/* ==================================================
            PAGE CONTENT
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >


          {/* ==================================================
              REVIEW HEADER
          ================================================== */}

          <View
            style={
              styles.successIconContainer
            }
          >

            <View
              style={
                styles.reviewIconCircle
              }
            >

              <Ionicons
                name="checkmark-circle"
                size={38}
                color="#4CAF50"
              />

            </View>


            <Text
              style={styles.confirmTitle}
            >
              Review Your Order
            </Text>


            <Text
              style={styles.confirmSubtitle}
            >
              Please review your order
              details before placing it.
            </Text>

          </View>


          {/* ==================================================
              ORDER DETAILS
          ================================================== */}

          <View
            style={styles.detailsCard}
          >


            {/* ADDRESS */}

            <View style={styles.row}>

              <View
                style={styles.labelContainer}
              >

                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#F5B82E"
                />

                <Text
                  style={styles.label}
                >
                  Address
                </Text>

              </View>


              <Text
                style={styles.value}
                numberOfLines={3}
              >
                {address || "Not set"}
              </Text>

            </View>


            {/* ITEMS */}

            <View style={styles.row}>

              <View
                style={styles.labelContainer}
              >

                <Ionicons
                  name="restaurant-outline"
                  size={14}
                  color="#F5B82E"
                />

                <Text
                  style={styles.label}
                >
                  Items
                </Text>

              </View>


              <Text
                style={styles.value}
              >
                {finalItems.length}
              </Text>

            </View>


            {/* PAYMENT */}

            <View style={styles.row}>

              <View
                style={styles.labelContainer}
              >

                <Ionicons
                  name="card-outline"
                  size={14}
                  color="#F5B82E"
                />

                <Text
                  style={styles.label}
                >
                  Payment
                </Text>

              </View>


              <Text
                style={styles.value}
                numberOfLines={2}
              >
                {
                  paymentMethod ||
                  "Cash on Delivery"
                }
              </Text>

            </View>

          </View>


          {/* ==================================================
              TOTAL
          ================================================== */}

          <View
            style={styles.totalCard}
          >

            <Text
              style={styles.totalLabel}
            >
              Total Amount
            </Text>


            <Text
              style={styles.totalValue}
            >
              ₹{parsedTotal}
            </Text>

          </View>


          {/* ==================================================
              CONFIRM BUTTON
          ================================================== */}

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isConfirming &&
                styles.disabledBtn,
            ]}
            onPress={placeOrder}
            disabled={isConfirming}
            activeOpacity={0.85}
          >

            {isConfirming ? (

              <>

                <ActivityIndicator
                  color="#0B0F14"
                  size="small"
                />

                <Text
                  style={
                    styles.confirmBtnText
                  }
                >
                  Placing Order...
                </Text>

              </>

            ) : (

              <>

                <Ionicons
                  name="checkmark-circle-outline"
                  size={17}
                  color="#0B0F14"
                />

                <Text
                  style={
                    styles.confirmBtnText
                  }
                >
                  Confirm Order
                </Text>

              </>

            )}

          </TouchableOpacity>


          {/* ==================================================
              CANCEL BUTTON
          ================================================== */}

          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() =>
              router.back()
            }
            activeOpacity={0.8}
          >

            <Ionicons
              name="arrow-back-outline"
              size={14}
              color="#64748B"
            />

            <Text
              style={styles.cancelBtnText}
            >
              Cancel
            </Text>

          </TouchableOpacity>


          {/* BOTTOM SPACE */}

          <View
            style={{ height: 25 }}
          />

        </ScrollView>

      </View>


      {/* ==================================================
          SUCCESS OVERLAY
      ================================================== */}

      {successVisible && (

        <View
          style={
            styles.successModalOverlay
          }
        >

          <View
            style={
              styles.successModalContent
            }
          >


            {/* SUCCESS ICON */}

            <View
              style={
                styles.successIconWrapper
              }
            >

              <Ionicons
                name="checkmark-circle"
                size={48}
                color="#4CAF50"
              />

            </View>


            {/* SUCCESS TITLE */}

            <Text
              style={styles.successTitle}
            >
              Order Confirmed! ✅
            </Text>


            {/* SUCCESS DESCRIPTION */}

            <Text
              style={styles.successSubtitle}
            >
              Your order has been confirmed
              and sent to the restaurant.
            </Text>


            {/* AMOUNT */}

            <View
              style={styles.successAmountBox}
            >

              <Text
                style={styles.successAmountLabel}
              >
                Total Amount
              </Text>

              <Text
                style={styles.successAmount}
              >
                ₹{parsedTotal}
              </Text>

            </View>


            {/* REDIRECT */}

            <Text
              style={styles.successRedirect}
            >
              Redirecting to Orders...
            </Text>


            <ActivityIndicator
              size="small"
              color="#F5B82E"
              style={{
                marginTop: 9,
              }}
            />

          </View>

        </View>

      )}

    </SafeAreaView>

  );

}


// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({

  // ====================================================
  // MAIN
  // ====================================================

  safeArea: {
    flex: 1,

    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,

    backgroundColor: "#F5F7FA",
  },


  // ====================================================
  // HEADER
  // ====================================================

  header: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    paddingHorizontal: 10,

    paddingVertical: 8,

    height: 50,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 31,

    height: 31,

    borderRadius: 16,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#F5F7FA",
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: "#0B0F14",
  },

  headerSpacer: {
    width: 31,
  },


  // ====================================================
  // SCROLL
  // ====================================================

  scrollContent: {
    paddingHorizontal: 10,

    paddingTop: 10,

    paddingBottom: 25,
  },


  // ====================================================
  // REVIEW HEADER
  // ====================================================

  successIconContainer: {
    alignItems: "center",

    width: "96%",

    alignSelf: "center",

    marginTop: 10,

    marginBottom: 12,

    backgroundColor: "#FFFFFF",

    borderRadius: 12,

    paddingVertical: 13,

    paddingHorizontal: 10,

    borderWidth: 1,

    borderColor: "#E2E6EB",

    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",
  },

  reviewIconCircle: {
    width: 54,

    height: 54,

    borderRadius: 27,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#E8F5E9",
  },

  confirmTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: "#0B0F14",

    marginTop: 7,
  },

  confirmSubtitle: {
    fontSize: 10,

    color: "#64748B",

    textAlign: "center",

    marginTop: 3,

    lineHeight: 15,

    paddingHorizontal: 15,
  },


  // ====================================================
  // DETAILS CARD
  // ====================================================

  detailsCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 12,

    padding: 11,

    marginBottom: 9,

    width: "96%",

    alignSelf: "center",

    borderWidth: 1,

    borderColor: "#E2E6EB",

    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",
  },

  row: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "flex-start",

    paddingVertical: 6,

    borderBottomWidth: 1,

    borderBottomColor: "#F1F3F5",
  },

  labelContainer: {
    flexDirection: "row",

    alignItems: "center",

    width: 85,

    gap: 5,
  },

  label: {
    fontSize: 10,

    color: "#64748B",

    fontWeight: "600",
  },

  value: {
    fontSize: 10,

    color: "#0B0F14",

    fontWeight: "600",

    textAlign: "right",

    flex: 1,

    marginLeft: 8,

    lineHeight: 15,
  },


  // ====================================================
  // TOTAL
  // ====================================================

  totalCard: {
    width: "96%",

    alignSelf: "center",

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    backgroundColor: "#FFFFFF",

    borderRadius: 10,

    paddingHorizontal: 11,

    paddingVertical: 10,

    marginBottom: 10,

    borderWidth: 1,

    borderColor: "#E2E6EB",
  },

  totalLabel: {
    fontSize: 13,

    fontWeight: "800",

    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 15,

    fontWeight: "800",

    color: "#F5B82E",
  },


  // ====================================================
  // CONFIRM BUTTON
  // ====================================================

  confirmBtn: {
    width: "96%",

    alignSelf: "center",

    backgroundColor: "#F5B82E",

    borderRadius: 9,

    height: 42,

    justifyContent: "center",

    alignItems: "center",

    flexDirection: "row",

    gap: 5,

    marginBottom: 7,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  confirmBtnText: {
    color: "#0B0F14",

    fontWeight: "700",

    fontSize: 11,
  },


  // ====================================================
  // CANCEL BUTTON
  // ====================================================

  cancelBtn: {
    width: "96%",

    alignSelf: "center",

    height: 38,

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",

    flexDirection: "row",

    gap: 4,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E2E6EB",
  },

  cancelBtnText: {
    color: "#64748B",

    fontWeight: "600",

    fontSize: 10,
  },


  // ====================================================
  // SUCCESS OVERLAY
  // ====================================================

  successModalOverlay: {
    position: "absolute",

    top: 0,

    left: 0,

    right: 0,

    bottom: 0,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:
      "rgba(0,0,0,0.7)",

    zIndex: 999,

    paddingHorizontal: 10,
  },

  successModalContent: {
    backgroundColor: "#FFFFFF",

    width: "88%",

    maxWidth: 380,

    borderRadius: 17,

    padding: 17,

    alignItems: "center",

    boxShadow:
      "0px 5px 15px rgba(0,0,0,0.2)",
  },

  successIconWrapper: {
    width: 68,

    height: 68,

    borderRadius: 34,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#E8F5E9",

    marginBottom: 5,
  },

  successTitle: {
    fontSize: 18,

    fontWeight: "800",

    color: "#0B0F14",

    marginTop: 5,

    textAlign: "center",
  },

  successSubtitle: {
    fontSize: 10,

    color: "#64748B",

    textAlign: "center",

    marginTop: 5,

    lineHeight: 15,

    paddingHorizontal: 12,
  },

  successAmountBox: {
    width: "75%",

    backgroundColor: "#FFF9E8",

    borderWidth: 1,

    borderColor: "#F5B82E",

    borderRadius: 9,

    paddingVertical: 7,

    alignItems: "center",

    marginTop: 10,
  },

  successAmountLabel: {
    fontSize: 9,

    color: "#64748B",

    fontWeight: "500",
  },

  successAmount: {
    fontSize: 18,

    fontWeight: "800",

    color: "#F5B82E",

    marginTop: 1,
  },

  successRedirect: {
    fontSize: 9,

    color: "#64748B",

    marginTop: 12,
  },

});