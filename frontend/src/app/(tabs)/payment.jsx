import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import RazorpayCheckout from "react-native-razorpay";

import { useCart } from "../../context/CartContext";
import api from "../../services/api";

export default function PaymentScreen() {
  const { clearCart } = useCart();

  const {
    restaurantId,
    items,
    total,
    address,
  } = useLocalSearchParams();

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [isRazorpayLoaded, setIsRazorpayLoaded] =
    useState(false);

  // =====================================================
  // PARSE DATA
  // =====================================================

  const parsedItems = items
    ? JSON.parse(items)
    : [];

  const parsedTotal =
    parseFloat(String(total || "0")) || 0;

  // =====================================================
  // LOAD RAZORPAY
  // =====================================================

  useEffect(() => {
    if (Platform.OS === "web") {
      if (
        typeof window !== "undefined" &&
        window.Razorpay
      ) {
        setIsRazorpayLoaded(true);
      } else {
        const script =
          document.createElement("script");

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.onload = () =>
          setIsRazorpayLoaded(true);

        document.body.appendChild(script);
      }
    } else {
      setIsRazorpayLoaded(true);
    }
  }, []);

  // =====================================================
  // HANDLE PAYMENT
  // =====================================================

  const handlePayment = async () => {
    if (!isRazorpayLoaded) {
      Alert.alert(
        "Loading",
        "Payment gateway is still loading. Please wait.",
      );

      return;
    }

    if (parsedTotal <= 0) {
      Alert.alert(
        "Invalid Amount",
        "The payment amount is invalid.",
      );

      return;
    }

    setIsProcessing(true);

    try {
      // =================================================
      // CREATE RAZORPAY ORDER
      // =================================================

      const orderRes = await api.post(
        "/orders/create-razorpay-order",
        {
          amount: parsedTotal,
        },
      );

      const razorpayOrder =
        orderRes.data;

      // =================================================
      // RAZORPAY OPTIONS
      // =================================================

      const options = {
        description: "Food Order",

        currency: "INR",

        key: "rzp_test_TOQf3vNxkjDCbc",

        amount: razorpayOrder.amount,

        order_id: razorpayOrder.id,

        name: "SNAX",

        prefill: {
          email: "user@example.com",
          contact: "9999999999",
        },

        theme: {
          color: "#F5B82E",
        },

       handler: async (response) => {
  console.log(
    "✅ Payment Successful:",
    response,
  );

  // =================================================
  // CLEAR CART AFTER SUCCESSFUL PAYMENT
  // =================================================

  await clearCart();


          // =================================================
          // NAVIGATE AFTER SUCCESS
          // =================================================

          router.push({
            pathname: "/(tabs)/orders",

            params: {
              restaurantId:
                restaurantId || "unknown",

              items: JSON.stringify(
                parsedItems,
              ),

              total: parsedTotal,

              address: String(
                address || "",
              ),

              paymentMethod:
                "Online (Razorpay)",
            },
          });
        },
      };

      // =================================================
      // OPEN RAZORPAY
      // =================================================

      if (Platform.OS === "web") {
        if (
          typeof window !== "undefined" &&
          window.Razorpay
        ) {
          const rzp =
            new window.Razorpay(options);

          rzp.open();
        } else {
          Alert.alert(
            "Error",
            "Razorpay SDK is not available.",
          );
        }
      } else {
        await RazorpayCheckout.open(
          options,
        );
      }
    } catch (error) {
      console.error(
        "Payment Error:",
        error,
      );

      Alert.alert(
        "Payment Failed",
        "Your payment could not be completed.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={19}
              color="#0B0F14"
            />
          </TouchableOpacity>

          <View
            style={styles.headerTitleContainer}
          >
            <Ionicons
              name="card-outline"
              size={16}
              color="#F5B82E"
            />

            <Text
              style={styles.headerTitle}
            >
              Payment
            </Text>
          </View>

          <View
            style={styles.headerSide}
          />

        </View>


        {/* =================================================
            CONTENT
        ================================================= */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* =================================================
              PAYMENT HEADER
          ================================================= */}

          <View
            style={styles.paymentHeader}
          >

            <View
              style={styles.paymentIconCircle}
            >

              <Ionicons
                name="lock-closed-outline"
                size={19}
                color="#F5B82E"
              />

            </View>

            <Text
              style={styles.payText}
            >
              Pay ₹{parsedTotal}
            </Text>

            <Text
              style={styles.subText}
            >
              Secure online payment
            </Text>

          </View>


          {/* =================================================
              PAYMENT CARD
          ================================================= */}

          <View style={styles.card}>

            {/* CARD ICON */}

            <View
              style={styles.cardIconCircle}
            >

              <Ionicons
                name="card-outline"
                size={25}
                color="#F5B82E"
              />

            </View>

            <Text
              style={styles.cardTitle}
            >
              Online Payment
            </Text>

            <Text
              style={styles.cardText}
            >
              UPI / Card / Net Banking
            </Text>


            {/* PAYMENT METHODS */}

            <View
              style={styles.methodsRow}
            >

              <View
                style={styles.methodBox}
              >

                <Ionicons
                  name="phone-portrait-outline"
                  size={15}
                  color="#081A33"
                />

                <Text
                  style={styles.methodText}
                >
                  UPI
                </Text>

              </View>


              <View
                style={styles.methodBox}
              >

                <Ionicons
                  name="card-outline"
                  size={15}
                  color="#081A33"
                />

                <Text
                  style={styles.methodText}
                >
                  Card
                </Text>

              </View>


              <View
                style={styles.methodBox}
              >

                <Ionicons
                  name="globe-outline"
                  size={15}
                  color="#081A33"
                />

                <Text
                  style={styles.methodText}
                >
                  Net Banking
                </Text>

              </View>

            </View>

          </View>


          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <View
            style={styles.summaryCard}
          >

            <View
              style={styles.summaryHeader}
            >

              <Ionicons
                name="receipt-outline"
                size={15}
                color="#F5B82E"
              />

              <Text
                style={styles.summaryTitle}
              >
                Order Summary
              </Text>

            </View>


            {/* ITEMS */}

            {parsedItems.length > 0 ? (
              parsedItems.map(
                (item, index) => (

                  <View
                    key={
                      item._id || index
                    }
                    style={styles.itemRow}
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
                          {item.quantity}x
                        </Text>

                      </View>

                      <Text
                        style={
                          styles.itemName
                        }
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>

                    </View>

                    <Text
                      style={
                        styles.itemPrice
                      }
                    >
                      ₹
                      {item.price *
                        item.quantity}
                    </Text>

                  </View>

                ),
              )
            ) : (
              <Text
                style={styles.noItemsText}
              >
                Order details unavailable
              </Text>
            )}


            <View
              style={styles.divider}
            />


            {/* TOTAL */}

            <View
              style={styles.totalRow}
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

          </View>


          {/* =================================================
              PAY BUTTON
          ================================================= */}

          <TouchableOpacity
            style={[
              styles.payBtn,
              isProcessing &&
                styles.disabledBtn,
            ]}
            onPress={handlePayment}
            disabled={isProcessing}
            activeOpacity={0.85}
          >

            {isProcessing ? (

              <View
                style={styles.loadingRow}
              >

                <ActivityIndicator
                  size="small"
                  color="#0B0F14"
                />

                <Text
                  style={styles.payBtnText}
                >
                  Processing...
                </Text>

              </View>

            ) : (

              <View
                style={styles.payButtonContent}
              >

                <Ionicons
                  name="lock-closed-outline"
                  size={15}
                  color="#0B0F14"
                />

                <Text
                  style={styles.payBtnText}
                >
                  Pay ₹{parsedTotal}
                </Text>

              </View>

            )}

          </TouchableOpacity>


          {/* =================================================
              SECURITY MESSAGE
          ================================================= */}

          <View
            style={styles.secureRow}
          >

            <Ionicons
              name="shield-checkmark-outline"
              size={13}
              color="#64748B"
            />

            <Text
              style={styles.secureText}
            >
              Your payment is securely processed
            </Text>

          </View>


          <View
            style={{ height: 25 }}
          />

        </ScrollView>

      </View>
    </SafeAreaView>
  );
}


// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  // ===================================================
  // MAIN
  // ===================================================

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

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: 10,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 31,

    height: 31,

    borderRadius: 8,

    backgroundColor: "#F5F7FA",

    alignItems: "center",

    justifyContent: "center",
  },

  headerTitleContainer: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  headerTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: "#0B0F14",
  },

  headerSide: {
    width: 31,
  },


  // ===================================================
  // SCROLL
  // ===================================================

  scrollContent: {
    paddingHorizontal: 10,

    paddingTop: 12,

    alignItems: "center",

    paddingBottom: 20,
  },


  // ===================================================
  // PAYMENT HEADER
  // ===================================================

  paymentHeader: {
    alignItems: "center",

    width: "96%",

    marginBottom: 12,
  },

  paymentIconCircle: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor: "#081A33",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 7,
  },

  payText: {
    fontSize: 23,

    fontWeight: "900",

    color: "#0B0F14",
  },

  subText: {
    fontSize: 10,

    color: "#64748B",

    marginTop: 2,
  },


  // ===================================================
  // PAYMENT CARD
  // ===================================================

  card: {
    width: "96%",

    backgroundColor: "#FFFFFF",

    borderRadius: 13,

    padding: 14,

    borderWidth: 1,

    borderColor: "#E2E6EB",

    alignItems: "center",

    marginBottom: 10,

    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",
  },

  cardIconCircle: {
    width: 45,

    height: 45,

    borderRadius: 23,

    backgroundColor: "#081A33",

    alignItems: "center",

    justifyContent: "center",

    marginBottom: 7,
  },

  cardTitle: {
    fontSize: 13,

    fontWeight: "800",

    color: "#0B0F14",
  },

  cardText: {
    fontSize: 9,

    color: "#64748B",

    marginTop: 3,

    marginBottom: 11,
  },


  // ===================================================
  // PAYMENT METHODS
  // ===================================================

  methodsRow: {
    width: "100%",

    flexDirection: "row",

    justifyContent: "space-between",

    gap: 6,
  },

  methodBox: {
    flex: 1,

    minHeight: 34,

    borderRadius: 7,

    backgroundColor: "#F5F7FA",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 4,

    borderWidth: 1,

    borderColor: "#E2E6EB",
  },

  methodText: {
    fontSize: 8,

    fontWeight: "700",

    color: "#081A33",
  },


  // ===================================================
  // ORDER SUMMARY
  // ===================================================

  summaryCard: {
    width: "96%",

    backgroundColor: "#FFFFFF",

    borderRadius: 13,

    padding: 12,

    borderWidth: 1,

    borderColor: "#E2E6EB",

    marginBottom: 10,
  },

  summaryHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    marginBottom: 9,
  },

  summaryTitle: {
    fontSize: 12,

    fontWeight: "800",

    color: "#0B0F14",
  },


  // ===================================================
  // ITEMS
  // ===================================================

  itemRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 6,

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

  noItemsText: {
    fontSize: 9,

    color: "#64748B",

    marginBottom: 5,
  },


  // ===================================================
  // DIVIDER
  // ===================================================

  divider: {
    height: 1,

    backgroundColor: "#E2E6EB",

    marginVertical: 7,
  },


  // ===================================================
  // TOTAL
  // ===================================================

  totalRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",
  },

  totalLabel: {
    fontSize: 11,

    fontWeight: "700",

    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 15,

    fontWeight: "900",

    color: "#F5B82E",
  },


  // ===================================================
  // PAY BUTTON
  // ===================================================

  payBtn: {
    width: "96%",

    height: 42,

    backgroundColor: "#F5B82E",

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",

    marginTop: 2,
  },

  disabledBtn: {
    opacity: 0.6,
  },

  payButtonContent: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 5,
  },

  loadingRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  payBtnText: {
    color: "#0B0F14",

    fontWeight: "800",

    fontSize: 12,
  },


  // ===================================================
  // SECURITY
  // ===================================================

  secureRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 4,

    marginTop: 8,
  },

  secureText: {
    fontSize: 8,

    color: "#64748B",
  },

});