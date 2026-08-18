import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
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


// ======================================================
// DEFAULT COUPON
// ======================================================

const DEFAULT_COUPON_CODE = "SAVE10";


// ======================================================
// CART SCREEN
// ======================================================

export default function CartScreen() {

  // const {
  //   cartItems,
  //   updateQuantity,
  //   removeFromCart,
  // } = useCart();

  const {
  cartItems: rawCartItems,
  updateQuantity,
  removeFromCart,
} = useCart();

const cartItems = Array.isArray(rawCartItems)
  ? rawCartItems.filter(Boolean)
  : [];

  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  const [appliedCoupon, setAppliedCoupon] =
    useState(null);

  const [isApplyingCoupon, setIsApplyingCoupon] =
    useState(false);

  const [couponModalVisible, setCouponModalVisible] =
    useState(false);


  // ====================================================
  // FETCH USER PROFILE
  // ====================================================

  useEffect(() => {

    const fetchProfile = async () => {

      try {

        const response =
          await api.get("/auth/profile");

        setProfile(response.data);

      } catch (error) {

        console.error(
          "Failed to load profile:",
          error
        );

      } finally {

        setIsProfileLoading(false);

      }

    };

    fetchProfile();

  }, []);


  // ====================================================
  // CALCULATE PRICES
  // ====================================================

  // const subtotal = cartItems.reduce(
  //   (sum, item) =>
  //     sum + item.price * item.quantity,
  //   0
  // );

  const subtotal = cartItems.reduce(
  (sum, item) =>
    sum +
    Number(item?.price || 0) *
    Number(item?.quantity || 0),
  0
);

  const deliveryFee =
    subtotal > 0 ? 40 : 0;

  let discountAmount = 0;

  if (appliedCoupon) {

    discountAmount =
      (subtotal *
        appliedCoupon.discountPercentage) /
      100;

  }

  const total =
    subtotal +
    deliveryFee -
    discountAmount;


  // ====================================================
  // REMOVE ITEM
  // ====================================================

  const removeItem = (id) => {

    removeFromCart(id);

  };


  // ====================================================
  // APPLY COUPON
  // ====================================================

  const handleApplyCoupon = async () => {

    setIsApplyingCoupon(true);

    setCouponModalVisible(false);

    try {

      console.log(
        "🚀 Sending coupon code:",
        DEFAULT_COUPON_CODE
      );

      console.log(
        "🚀 Sending totalAmount:",
        subtotal
      );

      const response =
        await api.post(
          "/coupon/verify",
          {
            code: DEFAULT_COUPON_CODE,
            totalAmount: subtotal,
          }
        );

      console.log(
        "✅ Backend Response:",
        response.data
      );

      if (response.data.valid) {

        setAppliedCoupon(response.data);

        Alert.alert(
          "Success",
          response.data.message
        );

      }

    } catch (error) {

      console.error(
        "❌ Coupon Error:",
        error
      );

      console.error(
        "❌ Error response data:",
        error.response?.data
      );

      Alert.alert(
        "Invalid Coupon",
        error.response?.data?.message ||
          "Coupon could not be applied."
      );

      setAppliedCoupon(null);

    } finally {

      setIsApplyingCoupon(false);

    }

  };


  // ====================================================
  // CHECKOUT
  // ====================================================

  const handleCheckout = () => {

    router.push("/(tabs)/checkout");

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
            onPress={() => router.back()}
          >

            <Ionicons
              name="arrow-back"
              size={20}
              color="#0B0F14"
            />

          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            My Cart
          </Text>

          <View style={styles.headerSpacer} />

        </View>


        {/* ==================================================
            CART CONTENT
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* ==================================================
              LOADING
          ================================================== */}

          {isLoading ? (

            <View style={styles.loadingState}>

              <Text style={styles.loadingText}>
                Loading your cart...
              </Text>

            </View>

          ) : cartItems.length === 0 ? (

            /* ==================================================
                EMPTY CART
            ================================================== */

            <View style={styles.emptyState}>

              <Ionicons
                name="cart-outline"
                size={58}
                color="#D1D5DB"
              />

              <Text style={styles.emptyTitle}>
                Your cart is empty
              </Text>

              <Text style={styles.emptySubtitle}>
                Looks like you haven't added
                anything to your cart yet.
              </Text>

              <TouchableOpacity
                style={styles.shopButton}
                onPress={() => router.back()}
              >

                <Text style={styles.shopButtonText}>
                  Start Shopping
                </Text>

              </TouchableOpacity>

            </View>

          ) : (

            /* ==================================================
                CART ITEMS
            ================================================== */

            // cartItems.map((item) => (

            //   <View
            //     key={item._id}
            //     style={styles.cartItemCard}
            //   >
                    cartItems.map((item, index) => (
  <View
    key={item?._id || item?.id || `cart-item-${index}`}
    style={styles.cartItemCard}
  >
                <View
                  style={styles.itemInfoContainer}
                >

                  {/* ITEM HEADER */}

                  <View
                    style={styles.itemHeaderRow}
                  >

                    <Text
                      style={styles.itemName}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        removeItem(item._id)
                      }
                      style={styles.removeIcon}
                    >

                      <Ionicons
                        name="close-circle"
                        size={19}
                        color="#FF5252"
                      />

                    </TouchableOpacity>

                  </View>


                  {/* DESCRIPTION */}

                  <Text
                    style={styles.itemDescription}
                    numberOfLines={1}
                  >
                    {item.description ||
                      "Delicious dish"}
                  </Text>


                  {/* PRICE + QUANTITY */}

                  <View
                    style={styles.itemMetaRow}
                  >

                    <Text
                      style={styles.itemPrice}
                    >
                      ₹{item.price}
                    </Text>


                    {/* QUANTITY */}

                    <View
                      style={
                        styles.quantityContainer
                      }
                    >

                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() =>
                          updateQuantity(
                            item._id,
                            -1
                          )
                        }
                      >

                        <Ionicons
                          name="remove"
                          size={12}
                          color="#F5B82E"
                        />

                      </TouchableOpacity>


                      <Text style={styles.qtyText}>
                        {item.quantity}
                      </Text>


                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() =>
                          updateQuantity(
                            item._id,
                            1
                          )
                        }
                      >

                        <Ionicons
                          name="add"
                          size={12}
                          color="#F5B82E"
                        />

                      </TouchableOpacity>

                    </View>

                  </View>

                </View>

              </View>

            ))

          )}


          {/* Space for checkout footer */}

          <View style={{ height: 250 }} />

        </ScrollView>


        {/* ==================================================
            CHECKOUT FOOTER
        ================================================== */}

        {cartItems.length > 0 && (

          <View
            style={styles.checkoutFooter}
          >

            {/* ==================================================
                ADDRESS
            ================================================== */}

            <View
              style={styles.addressContainer}
            >

              <Ionicons
                name="location"
                size={15}
                color="#F5B82E"
              />


              {isProfileLoading ? (

                <Text
                  style={styles.addressText}
                >
                  Loading address...
                </Text>

              ) : profile?.address ? (

                <Text
                  style={styles.addressText}
                  numberOfLines={1}
                >
                  {profile.address}
                </Text>

              ) : (

                <TouchableOpacity
                  onPress={() =>
                    router.push(
                      "/(tabs)/profile"
                    )
                  }
                >

                  <Text
                    style={
                      styles.addressActionText
                    }
                  >
                    Add delivery address
                  </Text>

                </TouchableOpacity>

              )}

            </View>


            {/* ==================================================
                COUPON
            ================================================== */}

            <View style={styles.couponRow}>

              {appliedCoupon ? (

                <View
                  style={
                    styles.appliedCouponContainer
                  }
                >

                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#4CAF50"
                  />

                  <Text
                    style={
                      styles.appliedCouponText
                    }
                    numberOfLines={1}
                  >
                    {appliedCoupon.code} (
                    {
                      appliedCoupon.discountPercentage
                    }
                    % OFF)
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setAppliedCoupon(null)
                    }
                  >

                    <Ionicons
                      name="close-circle"
                      size={14}
                      color="#FF5252"
                    />

                  </TouchableOpacity>

                </View>

              ) : (

                <TouchableOpacity
                  style={
                    styles.applyCouponBtn
                  }
                  onPress={() =>
                    setCouponModalVisible(true)
                  }
                >

                  <Ionicons
                    name="pricetag-outline"
                    size={14}
                    color="#0B0F14"
                  />

                  <Text
                    style={
                      styles.applyCouponBtnText
                    }
                  >
                    Apply Coupon
                  </Text>

                </TouchableOpacity>

              )}

            </View>


            {/* ==================================================
                PRICE SUMMARY
            ================================================== */}

            <View
              style={styles.priceSummary}
            >

              <View style={styles.priceRow}>

                <Text
                  style={styles.priceLabel}
                >
                  Subtotal
                </Text>

                <Text
                  style={styles.priceValue}
                >
                  ₹{subtotal}
                </Text>

              </View>


              <View style={styles.priceRow}>

                <Text
                  style={styles.priceLabel}
                >
                  Delivery Fee
                </Text>

                <Text
                  style={styles.priceValue}
                >
                  ₹{deliveryFee}
                </Text>

              </View>


              {discountAmount > 0 && (

                <View style={styles.priceRow}>

                  <Text
                    style={styles.discountLabel}
                  >
                    Discount
                  </Text>

                  <Text
                    style={styles.discountValue}
                  >
                    -₹
                    {discountAmount.toFixed(0)}
                  </Text>

                </View>

              )}


              {/* TOTAL */}

              <View
                style={[
                  styles.priceRow,
                  styles.totalRow,
                ]}
              >

                <Text
                  style={styles.totalLabel}
                >
                  Total
                </Text>

                <Text
                  style={styles.totalValue}
                >
                  ₹{total.toFixed(0)}
                </Text>

              </View>

            </View>


            {/* ==================================================
                CHECKOUT BUTTON
            ================================================== */}

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={handleCheckout}
              activeOpacity={0.85}
            >

              <Text
                style={styles.checkoutButtonText}
              >
                Proceed to Checkout
              </Text>

              <Ionicons
                name="arrow-forward"
                size={15}
                color="#0B0F14"
                style={{
                  marginLeft: 5,
                }}
              />

            </TouchableOpacity>

          </View>

        )}

      </View>


      {/* ==================================================
          COUPON MODAL
      ================================================== */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={couponModalVisible}
        onRequestClose={() =>
          setCouponModalVisible(false)
        }
      >

        <View style={styles.modalOverlay}>

          <View style={styles.modalContent}>

            <Text style={styles.modalTitle}>
              Apply Coupon
            </Text>

            <Text style={styles.modalSubtitle}>

              Do you want to apply the promo
              code{" "}

              <Text
                style={{
                  fontWeight: "700",
                }}
              >
                "{DEFAULT_COUPON_CODE}"
              </Text>

              ?

            </Text>


            {/* MODAL BUTTONS */}

            <View style={styles.modalButtons}>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() =>
                  setCouponModalVisible(false)
                }
              >

                <Text
                  style={styles.modalCancelText}
                >
                  Cancel
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={[
                  styles.modalApplyBtn,
                  isApplyingCoupon &&
                    styles.disabledBtn,
                ]}
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >

                <Text
                  style={styles.modalApplyText}
                >
                  {isApplyingCoupon
                    ? "Applying..."
                    : "Apply"}
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

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

    paddingVertical: 9,

    backgroundColor: "#FFFFFF",

    borderBottomWidth: 1,

    borderBottomColor: "#E2E6EB",

    height: 52,
  },

  backButton: {
    width: 32,

    height: 32,

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
    width: 32,
  },


  // ====================================================
  // SCROLL
  // ====================================================

  scrollContent: {
    paddingHorizontal: 10,

    paddingTop: 10,

    paddingBottom: 20,
  },


  // ====================================================
  // LOADING
  // ====================================================

  loadingState: {
    alignItems: "center",

    marginTop: 70,
  },

  loadingText: {
    fontSize: 13,

    color: "#64748B",

    fontWeight: "500",
  },


  // ====================================================
  // EMPTY CART
  // ====================================================

  emptyState: {
    alignItems: "center",

    marginTop: 70,

    paddingHorizontal: 15,
  },

  emptyTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: "#0B0F14",

    marginTop: 10,
  },

  emptySubtitle: {
    fontSize: 12,

    color: "#64748B",

    marginTop: 4,

    textAlign: "center",

    paddingHorizontal: 25,

    lineHeight: 17,
  },

  shopButton: {
    marginTop: 16,

    backgroundColor: "#F5B82E",

    paddingHorizontal: 18,

    paddingVertical: 9,

    borderRadius: 22,
  },

  shopButtonText: {
    color: "#0B0F14",

    fontWeight: "700",

    fontSize: 12,
  },


  // ====================================================
  // CART CARD
  // ====================================================

  cartItemCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 12,

    padding: 10,

    marginBottom: 8,

    borderWidth: 1,

    borderColor: "#E2E6EB",

    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",

    width: "96%",

    alignSelf: "center",
  },

  itemInfoContainer: {
    flex: 1,
  },

  itemHeaderRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: 2,
  },

  itemName: {
    fontSize: 14,

    fontWeight: "800",

    color: "#0B0F14",

    flex: 1,

    marginRight: 5,
  },

  removeIcon: {
    padding: 1,
  },

  itemDescription: {
    fontSize: 10,

    color: "#64748B",

    marginBottom: 6,
  },

  itemMetaRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",
  },

  itemPrice: {
    fontSize: 13,

    fontWeight: "700",

    color: "#F5B82E",
  },


  // ====================================================
  // QUANTITY
  // ====================================================

  quantityContainer: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#F5F7FA",

    borderRadius: 7,

    paddingHorizontal: 3,

    paddingVertical: 3,
  },

  qtyButton: {
    width: 25,

    height: 25,

    borderRadius: 12.5,

    backgroundColor: "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderColor: "#E2E6EB",
  },

  qtyText: {
    fontSize: 12,

    fontWeight: "700",

    color: "#0B0F14",

    marginHorizontal: 9,

    minWidth: 13,

    textAlign: "center",
  },


  // ====================================================
  // CHECKOUT FOOTER
  // ====================================================

  checkoutFooter: {
    position: "absolute",

    bottom: 0,

    left: 0,

    right: 0,

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 10,

    paddingVertical: 9,

    borderTopWidth: 1,

    borderTopColor: "#E2E6EB",

    boxShadow:
      "0px -4px 12px rgba(0,0,0,0.06)",
  },


  // ====================================================
  // ADDRESS
  // ====================================================

  addressContainer: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#FFF1E6",

    padding: 7,

    borderRadius: 8,

    marginBottom: 7,

    borderWidth: 1,

    borderColor: "#F5B82E",

    minHeight: 32,
  },

  addressText: {
    flex: 1,

    fontSize: 10,

    color: "#0B0F14",

    fontWeight: "500",

    marginLeft: 5,
  },

  addressActionText: {
    fontSize: 10,

    color: "#F5B82E",

    fontWeight: "700",

    marginLeft: 5,
  },


  // ====================================================
  // COUPON
  // ====================================================

  couponRow: {
    marginBottom: 7,
  },

  applyCouponBtn: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: "#FFF1E6",

    paddingVertical: 7,

    borderRadius: 7,

    borderWidth: 1,

    borderColor: "#F5B82E",

    borderStyle: "dashed",

    gap: 5,
  },

  applyCouponBtnText: {
    color: "#0B0F14",

    fontWeight: "600",

    fontSize: 11,
  },

  appliedCouponContainer: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    padding: 7,

    backgroundColor: "#E8F5E9",

    borderRadius: 7,

    minHeight: 30,
  },

  appliedCouponText: {
    flex: 1,

    fontSize: 10,

    color: "#0B0F14",

    fontWeight: "600",

    marginLeft: 5,

    marginRight: 5,
  },


  // ====================================================
  // PRICE SUMMARY
  // ====================================================

  priceSummary: {
    marginBottom: 8,
  },

  priceRow: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginBottom: 2,
  },

  priceLabel: {
    fontSize: 10,

    color: "#64748B",
  },

  priceValue: {
    fontSize: 10,

    fontWeight: "600",

    color: "#0B0F14",
  },

  discountLabel: {
    fontSize: 10,

    color: "#4CAF50",
  },

  discountValue: {
    fontSize: 10,

    fontWeight: "600",

    color: "#4CAF50",
  },

  totalRow: {
    marginTop: 4,

    borderTopWidth: 1,

    borderTopColor: "#E2E6EB",

    paddingTop: 5,

    marginBottom: 0,
  },

  totalLabel: {
    fontSize: 14,

    fontWeight: "800",

    color: "#0B0F14",
  },

  totalValue: {
    fontSize: 14,

    fontWeight: "800",

    color: "#F5B82E",
  },


  // ====================================================
  // CHECKOUT BUTTON
  // ====================================================

  checkoutButton: {
    backgroundColor: "#F5B82E",

    borderRadius: 10,

    height: 40,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  checkoutButtonText: {
    color: "#0B0F14",

    fontWeight: "700",

    fontSize: 12,
  },


  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    flex: 1,

    justifyContent: "center",

    alignItems: "center",

    backgroundColor:
      "rgba(0,0,0,0.5)",
  },

  modalContent: {
    backgroundColor: "#FFFFFF",

    width: "88%",

    maxWidth: 380,

    borderRadius: 15,

    padding: 17,

    alignItems: "center",

    boxShadow:
      "0px 4px 12px rgba(0,0,0,0.15)",
  },

  modalTitle: {
    fontSize: 17,

    fontWeight: "800",

    color: "#0B0F14",

    marginBottom: 3,
  },

  modalSubtitle: {
    fontSize: 11,

    color: "#64748B",

    marginBottom: 13,

    textAlign: "center",

    lineHeight: 16,
  },

  modalButtons: {
    flexDirection: "row",

    width: "100%",

    gap: 8,
  },

  modalCancelBtn: {
    flex: 1,

    paddingVertical: 9,

    borderRadius: 8,

    alignItems: "center",

    backgroundColor: "#F5F7FA",
  },

  modalCancelText: {
    color: "#64748B",

    fontWeight: "600",

    fontSize: 12,
  },

  modalApplyBtn: {
    flex: 1,

    paddingVertical: 9,

    borderRadius: 8,

    alignItems: "center",

    backgroundColor: "#F5B82E",
  },

  disabledBtn: {
    opacity: 0.6,
  },

  modalApplyText: {
    color: "#0B0F14",

    fontWeight: "700",

    fontSize: 12,
  },

});