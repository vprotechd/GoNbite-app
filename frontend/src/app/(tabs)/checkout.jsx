// import { Ionicons } from "@expo/vector-icons";
// import { router } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Modal,
//   SafeAreaView,
//   ScrollView,
//   StatusBar,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";

// import { useCart } from "../../context/CartContext";
// import api from "../../services/api";


// // ======================================================
// // CHECKOUT SCREEN
// // ======================================================

// export default function CheckoutScreen() {

//   const { cartItems, clearCart } = useCart();

//   const [isLoading, setIsLoading] =
//     useState(false);

//   const [profile, setProfile] =
//     useState(null);

//   const [isProfileLoading, setIsProfileLoading] =
//     useState(true);

//   const [confirmModalVisible, setConfirmModalVisible] =
//     useState(false);

//   const [isConfirming, setIsConfirming] =
//     useState(false);


//   // ====================================================
//   // FETCH PROFILE
//   // ====================================================

//   useEffect(() => {

//     const fetchProfile = async () => {

//       try {

//         const response =
//           await api.get("/auth/profile");

//         setProfile(response.data);

//       } catch (error) {

//         console.error(
//           "Failed to load profile:",
//           error
//         );

//       } finally {

//         setIsProfileLoading(false);

//       }

//     };

//     fetchProfile();

//   }, []);


//   // ====================================================
//   // CALCULATE PRICES
//   // ====================================================

//   const subtotal = cartItems.reduce(
//     (sum, item) =>
//       sum + item.price * item.quantity,
//     0
//   );

//   const deliveryFee =
//     subtotal > 0 ? 40 : 0;

//   const total =
//     subtotal + deliveryFee;


//   // ====================================================
//   // PLACE ORDER
//   // ====================================================

//   const placeOrder = async () => {

//     if (!profile || !profile.address) {

//       Alert.alert(
//         "Missing Address",
//         "Please add a delivery address in your Profile first."
//       );

//       router.push("/(tabs)/profile");

//       return;
//     }


//     if (cartItems.length === 0) {

//       Alert.alert(
//         "Empty Cart",
//         "Your cart is empty. Please add items before placing an order."
//       );

//       return;
//     }


//     setIsConfirming(true);


//     try {

//       const orderData = {

//         restaurantId:
//           cartItems[0]?.restaurantId ||
//           "unknown",

//         items: cartItems.map(
//           ({
//             _id,
//             name,
//             price,
//             quantity,
//           }) => ({
//             _id,
//             name,
//             price,
//             quantity,
//           })
//         ),

//         totalAmount: total,

//         deliveryAddress:
//           profile.address,

//         paymentMethod:
//           "Cash on Delivery",
//       };


//       const response =
//         await api.post(
//           "/orders/create",
//           orderData
//         );


//       console.log(
//         "✅ Order Response:",
//         response.data
//       );


//       // Delay alert slightly
//       // to prevent browser blocking

//       setTimeout(() => {

//         Alert.alert(
//           "✅ Order Confirmed!",
//           `Your order has been sent to the restaurant.\n\n📦 Total: ₹${total}\n💳 Payment: Cash on Delivery`,
//           [
//             {
//               text: "Track Order",

//               onPress: () => {

//                 clearCart();

//                 setConfirmModalVisible(
//                   false
//                 );

//                 router.replace(
//                   "/(tabs)/orders"
//                 );

//               },
//             },
//           ]
//         );

//       }, 300);


//     } catch (error) {

//       console.error(
//         "❌ Order Error:",
//         error
//       );


//       Alert.alert(
//         "Order Failed",
//         error.response?.data?.error ||
//           "Could not place your order. Please try again."
//       );


//     } finally {

//       setIsConfirming(false);

//     }

//   };


//   // ====================================================
//   // CASH ON DELIVERY
//   // ====================================================

//   const handleCashOnDelivery = () => {

//     if (!profile || !profile.address) {

//       Alert.alert(
//         "Missing Address",
//         "Please add a delivery address in your Profile first."
//       );

//       router.push("/(tabs)/profile");

//       return;
//     }


//     if (cartItems.length === 0) {

//       Alert.alert(
//         "Empty Cart",
//         "Your cart is empty. Please add some items first."
//       );

//       return;
//     }


//     router.push({
//       pathname:
//         "/(tabs)/confirm-order",

//       params: {

//         restaurantId:
//           cartItems[0]?.restaurantId,

//         address:
//           profile.address,

//         total: total,

//       },
//     });

//   };


//   // ====================================================
//   // PAY ONLINE
//   // ====================================================

//   const handlePayOnline = () => {

//     if (!profile || !profile.address) {

//       Alert.alert(
//         "Missing Address",
//         "Please add a delivery address in your Profile first."
//       );

//       router.push("/(tabs)/profile");

//       return;
//     }


//     if (cartItems.length === 0) {

//       Alert.alert(
//         "Empty Cart",
//         "Your cart is empty."
//       );

//       return;
//     }


//     router.push({

//       pathname:
//         "/(tabs)/payment",

//       params: {

//         restaurantId:
//           cartItems[0]?.restaurantId ||
//           "unknown",

//         items: JSON.stringify(
//           cartItems.map(
//             ({
//               _id,
//               name,
//               price,
//               quantity,
//             }) => ({
//               _id,
//               name,
//               price,
//               quantity,
//             })
//           )
//         ),

//         total: total,

//         address:
//           profile.address,

//       },

//     });

//   };


//   // ====================================================
//   // RENDER
//   // ====================================================

//   return (

//     <SafeAreaView style={styles.safeArea}>

//       <StatusBar
//         barStyle="light-content"
//         backgroundColor="#081A33"
//       />


//       <View style={styles.container}>


//         {/* ==================================================
//             HEADER
//         ================================================== */}

//         <View style={styles.header}>

//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() =>
//               router.back()
//             }
//           >

//             <Ionicons
//               name="arrow-back"
//               size={19}
//               color="#0B0F14"
//             />

//           </TouchableOpacity>


//           <Text style={styles.headerTitle}>
//             Checkout
//           </Text>


//           <View
//             style={styles.headerSpacer}
//           />

//         </View>


//         {/* ==================================================
//             CONTENT
//         ================================================== */}

//         <ScrollView
//           showsVerticalScrollIndicator={false}
//           contentContainerStyle={
//             styles.scrollContent
//           }
//         >


//           {/* ==================================================
//               DELIVERY ADDRESS
//           ================================================== */}

//           <View
//             style={styles.sectionCard}
//           >

//             <View
//               style={
//                 styles.sectionHeaderRow
//               }
//             >

//               <View
//                 style={
//                   styles.sectionIcon
//                 }
//               >

//                 <Ionicons
//                   name="location"
//                   size={15}
//                   color="#F5B82E"
//                 />

//               </View>


//               <Text
//                 style={styles.sectionTitle}
//               >
//                 Delivery Address
//               </Text>

//             </View>


//             {isProfileLoading ? (

//               <View
//                 style={styles.loadingRow}
//               >

//                 <ActivityIndicator
//                   size="small"
//                   color="#F5B82E"
//                 />

//                 <Text
//                   style={styles.loadingText}
//                 >
//                   Loading address...
//                 </Text>

//               </View>

//             ) : profile?.address ? (

//               <View
//                 style={styles.addressBox}
//               >

//                 <Ionicons
//                   name="location-outline"
//                   size={14}
//                   color="#64748B"
//                 />

//                 <Text
//                   style={styles.addressText}
//                   numberOfLines={3}
//                 >
//                   {profile.address}
//                 </Text>

//               </View>

//             ) : (

//               <TouchableOpacity
//                 style={styles.addAddressBox}
//                 onPress={() =>
//                   router.push(
//                     "/(tabs)/profile"
//                   )
//                 }
//               >

//                 <Ionicons
//                   name="add-circle-outline"
//                   size={15}
//                   color="#F5B82E"
//                 />

//                 <Text
//                   style={
//                     styles.addAddressText
//                   }
//                 >
//                   Add delivery address
//                 </Text>

//               </TouchableOpacity>

//             )}

//           </View>


//           {/* ==================================================
//               ORDER SUMMARY
//           ================================================== */}

//           <View
//             style={styles.sectionCard}
//           >

//             <View
//               style={
//                 styles.sectionHeaderRow
//               }
//             >

//               <View
//                 style={
//                   styles.sectionIcon
//                 }
//               >

//                 <Ionicons
//                   name="receipt-outline"
//                   size={15}
//                   color="#F5B82E"
//                 />

//               </View>


//               <Text
//                 style={styles.sectionTitle}
//               >
//                 Order Summary
//               </Text>

//             </View>


//             {/* CART ITEMS */}

//             {cartItems.map((item) => (

//               <View
//                 key={item._id}
//                 style={styles.itemRow}
//               >

//                 <View
//                   style={
//                     styles.itemInfo
//                   }
//                 >

//                   <Text
//                     style={styles.itemName}
//                     numberOfLines={1}
//                   >
//                     {item.name}
//                   </Text>

//                   <Text
//                     style={styles.itemQty}
//                   >
//                     x {item.quantity}
//                   </Text>

//                 </View>


//                 <Text
//                   style={styles.itemPrice}
//                 >
//                   ₹
//                   {item.price *
//                     item.quantity}
//                 </Text>

//               </View>

//             ))}


//             {/* DIVIDER */}

//             <View
//               style={styles.divider}
//             />


//             {/* SUBTOTAL */}

//             <View
//               style={styles.priceRow}
//             >

//               <Text
//                 style={styles.priceLabel}
//               >
//                 Subtotal
//               </Text>

//               <Text
//                 style={styles.priceValue}
//               >
//                 ₹{subtotal}
//               </Text>

//             </View>


//             {/* DELIVERY */}

//             <View
//               style={styles.priceRow}
//             >

//               <Text
//                 style={styles.priceLabel}
//               >
//                 Delivery Fee
//               </Text>

//               <Text
//                 style={styles.priceValue}
//               >
//                 ₹{deliveryFee}
//               </Text>

//             </View>


//             {/* TOTAL */}

//             <View
//               style={[
//                 styles.priceRow,
//                 styles.totalRow,
//               ]}
//             >

//               <Text
//                 style={styles.totalLabel}
//               >
//                 Total
//               </Text>

//               <Text
//                 style={styles.totalValue}
//               >
//                 ₹{total}
//               </Text>

//             </View>

//           </View>


//           {/* ==================================================
//               PAYMENT METHOD TITLE
//           ================================================== */}

//           <View
//             style={styles.paymentTitleRow}
//           >

//             <Text
//               style={styles.paymentTitle}
//             >
//               Choose Payment Method
//             </Text>

//           </View>


//           {/* ==================================================
//               ACTION BUTTONS
//           ================================================== */}

//           <View
//             style={styles.actionRow}
//           >


//             {/* CASH ON DELIVERY */}

//             <TouchableOpacity
//               style={[
//                 styles.codBtn,
//                 isLoading &&
//                   styles.disabledBtn,
//               ]}
//               onPress={
//                 handleCashOnDelivery
//               }
//               disabled={isLoading}
//               activeOpacity={0.8}
//             >

//               <View
//                 style={styles.actionIcon}
//               >

//                 <Ionicons
//                   name="cash-outline"
//                   size={16}
//                   color="#0B0F14"
//                 />

//               </View>

//               <Text
//                 style={styles.codBtnText}
//               >
//                 Cash on Delivery
//               </Text>

//             </TouchableOpacity>


//             {/* PAY ONLINE */}

//             <TouchableOpacity
//               style={[
//                 styles.onlineBtn,
//                 isLoading &&
//                   styles.disabledBtn,
//               ]}
//               onPress={
//                 handlePayOnline
//               }
//               disabled={isLoading}
//               activeOpacity={0.8}
//             >

//               <View
//                 style={styles.onlineIcon}
//               >

//                 <Ionicons
//                   name="card-outline"
//                   size={16}
//                   color="#F5B82E"
//                 />

//               </View>

//               <Text
//                 style={styles.onlineBtnText}
//               >
//                 Pay Online
//               </Text>

//             </TouchableOpacity>

//           </View>


//           {/* BOTTOM SPACE */}

//           <View
//             style={{ height: 25 }}
//           />

//         </ScrollView>

//       </View>


//       {/* ==================================================
//           CONFIRM ORDER MODAL
//       ================================================== */}

//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={confirmModalVisible}
//         onRequestClose={() =>
//           setConfirmModalVisible(false)
//         }
//       >

//         <View
//           style={styles.modalOverlay}
//         >

//           <View
//             style={styles.modalContent}
//           >


//             {/* MODAL HEADER */}

//             <View
//               style={styles.modalHeader}
//             >

//               <View
//                 style={styles.successIcon}
//               >

//                 <Ionicons
//                   name="checkmark-circle"
//                   size={32}
//                   color="#4CAF50"
//                 />

//               </View>


//               <Text
//                 style={styles.modalTitle}
//               >
//                 Confirm Your Order
//               </Text>


//               <Text
//                 style={styles.modalSubtitle}
//               >
//                 Please review your order
//                 details before placing it.
//               </Text>

//             </View>


//             <View
//               style={styles.modalDivider}
//             />


//             {/* MODAL DETAILS */}

//             <View
//               style={styles.modalDetails}
//             >


//               {/* ADDRESS */}

//               <View
//                 style={styles.modalRow}
//               >

//                 <Text
//                   style={styles.modalLabel}
//                 >
//                   Address
//                 </Text>

//                 <Text
//                   style={styles.modalValue}
//                   numberOfLines={2}
//                 >
//                   {profile?.address ||
//                     "Not set"}
//                 </Text>

//               </View>


//               {/* ITEMS */}

//               <View
//                 style={styles.modalRow}
//               >

//                 <Text
//                   style={styles.modalLabel}
//                 >
//                   Items
//                 </Text>

//                 <Text
//                   style={styles.modalValue}
//                 >
//                   {cartItems.length}
//                 </Text>

//               </View>


//               {/* PAYMENT */}

//               <View
//                 style={styles.modalRow}
//               >

//                 <Text
//                   style={styles.modalLabel}
//                 >
//                   Payment
//                 </Text>

//                 <Text
//                   style={styles.modalValue}
//                 >
//                   Cash on Delivery
//                 </Text>

//               </View>


//               {/* TOTAL */}

//               <View
//                 style={[
//                   styles.modalRow,
//                   styles.modalTotalRow,
//                 ]}
//               >

//                 <Text
//                   style={
//                     styles.modalTotalLabel
//                   }
//                 >
//                   Total Amount
//                 </Text>

//                 <Text
//                   style={
//                     styles.modalTotalValue
//                   }
//                 >
//                   ₹{total}
//                 </Text>

//               </View>

//             </View>


//             {/* MODAL BUTTONS */}

//             <View
//               style={styles.modalButtons}
//             >


//               {/* CANCEL */}

//               <TouchableOpacity
//                 style={
//                   styles.modalCancelBtn
//                 }
//                 onPress={() =>
//                   setConfirmModalVisible(
//                     false
//                   )
//                 }
//               >

//                 <Text
//                   style={
//                     styles.modalCancelText
//                   }
//                 >
//                   Cancel
//                 </Text>

//               </TouchableOpacity>


//               {/* CONFIRM */}

//               <TouchableOpacity
//                 style={[
//                   styles.modalConfirmBtn,
//                   isConfirming &&
//                     styles.disabledBtn,
//                 ]}
//                 onPress={placeOrder}
//                 disabled={isConfirming}
//               >

//                 {isConfirming ? (

//                   <ActivityIndicator
//                     color="#0B0F14"
//                     size="small"
//                   />

//                 ) : (

//                   <Text
//                     style={
//                       styles.modalConfirmText
//                     }
//                   >
//                     Confirm Order
//                   </Text>

//                 )}

//               </TouchableOpacity>

//             </View>

//           </View>

//         </View>

//       </Modal>

//     </SafeAreaView>
//   );
// }


// // ======================================================
// // STYLES
// // ======================================================

// const styles = StyleSheet.create({

//   // ====================================================
//   // MAIN
//   // ====================================================

//   safeArea: {
//     flex: 1,
//     backgroundColor: "#081A33",
//   },

//   container: {
//     flex: 1,
//     backgroundColor: "#F5F7FA",
//   },


//   // ====================================================
//   // HEADER
//   // ====================================================

//   header: {
//     flexDirection: "row",

//     justifyContent: "space-between",

//     alignItems: "center",

//     paddingHorizontal: 10,

//     paddingVertical: 8,

//     backgroundColor: "#FFFFFF",

//     borderBottomWidth: 1,

//     borderBottomColor: "#E2E6EB",

//     height: 50,
//   },

//   backButton: {
//     width: 31,

//     height: 31,

//     borderRadius: 16,

//     alignItems: "center",

//     justifyContent: "center",

//     backgroundColor: "#F5F7FA",
//   },

//   headerTitle: {
//     fontSize: 17,

//     fontWeight: "800",

//     color: "#0B0F14",
//   },

//   headerSpacer: {
//     width: 31,
//   },


//   // ====================================================
//   // SCROLL
//   // ====================================================

//   scrollContent: {
//     paddingHorizontal: 10,

//     paddingTop: 10,

//     paddingBottom: 25,
//   },


//   // ====================================================
//   // SECTION CARD
//   // ====================================================

//   sectionCard: {
//     backgroundColor: "#FFFFFF",

//     borderRadius: 12,

//     padding: 10,

//     marginBottom: 9,

//     borderWidth: 1,

//     borderColor: "#E2E6EB",

//     width: "96%",

//     alignSelf: "center",

//     boxShadow:
//       "0px 2px 4px rgba(0,0,0,0.04)",
//   },


//   // ====================================================
//   // SECTION HEADER
//   // ====================================================

//   sectionHeaderRow: {
//     flexDirection: "row",

//     alignItems: "center",

//     gap: 6,

//     marginBottom: 7,
//   },

//   sectionIcon: {
//     width: 27,

//     height: 27,

//     borderRadius: 14,

//     backgroundColor:
//       "rgba(245,184,46,0.12)",

//     alignItems: "center",

//     justifyContent: "center",
//   },

//   sectionTitle: {
//     fontSize: 14,

//     fontWeight: "700",

//     color: "#0B0F14",
//   },


//   // ====================================================
//   // LOADING
//   // ====================================================

//   loadingRow: {
//     flexDirection: "row",

//     alignItems: "center",

//     gap: 6,

//     minHeight: 25,
//   },

//   loadingText: {
//     fontSize: 10,

//     color: "#64748B",
//   },


//   // ====================================================
//   // ADDRESS
//   // ====================================================

//   addressBox: {
//     flexDirection: "row",

//     alignItems: "flex-start",

//     backgroundColor: "#F8FAFC",

//     padding: 7,

//     borderRadius: 7,

//     borderWidth: 1,

//     borderColor: "#E2E6EB",

//     gap: 5,
//   },

//   addressText: {
//     flex: 1,

//     fontSize: 10,

//     color: "#64748B",

//     lineHeight: 15,
//   },

//   addAddressBox: {
//     flexDirection: "row",

//     alignItems: "center",

//     backgroundColor: "#FFF9E8",

//     borderRadius: 7,

//     paddingVertical: 8,

//     paddingHorizontal: 8,

//     borderWidth: 1,

//     borderColor: "#F5B82E",

//     borderStyle: "dashed",

//     gap: 5,
//   },

//   addAddressText: {
//     fontSize: 10,

//     color: "#F5B82E",

//     fontWeight: "700",
//   },


//   // ====================================================
//   // ORDER ITEMS
//   // ====================================================

//   itemRow: {
//     flexDirection: "row",

//     justifyContent: "space-between",

//     alignItems: "center",

//     marginBottom: 7,

//     paddingVertical: 2,
//   },

//   itemInfo: {
//     flex: 1,

//     marginRight: 8,
//   },

//   itemName: {
//     fontSize: 11,

//     fontWeight: "600",

//     color: "#0B0F14",
//   },

//   itemQty: {
//     fontSize: 9,

//     color: "#64748B",

//     marginTop: 1,
//   },

//   itemPrice: {
//     fontSize: 11,

//     fontWeight: "700",

//     color: "#0B0F14",
//   },


//   // ====================================================
//   // DIVIDER
//   // ====================================================

//   divider: {
//     height: 1,

//     backgroundColor: "#E2E6EB",

//     marginVertical: 7,
//   },


//   // ====================================================
//   // PRICE
//   // ====================================================

//   priceRow: {
//     flexDirection: "row",

//     justifyContent: "space-between",

//     marginBottom: 4,
//   },

//   priceLabel: {
//     fontSize: 10,

//     color: "#64748B",
//   },

//   priceValue: {
//     fontSize: 10,

//     fontWeight: "600",

//     color: "#0B0F14",
//   },

//   totalRow: {
//     borderTopWidth: 1,

//     borderTopColor: "#E2E6EB",

//     paddingTop: 6,

//     marginTop: 5,

//     marginBottom: 0,
//   },

//   totalLabel: {
//     fontSize: 14,

//     fontWeight: "800",

//     color: "#0B0F14",
//   },

//   totalValue: {
//     fontSize: 14,

//     fontWeight: "800",

//     color: "#F5B82E",
//   },


//   // ====================================================
//   // PAYMENT TITLE
//   // ====================================================

//   paymentTitleRow: {
//     width: "96%",

//     alignSelf: "center",

//     marginTop: 2,

//     marginBottom: 7,
//   },

//   paymentTitle: {
//     fontSize: 13,

//     fontWeight: "800",

//     color: "#0B0F14",
//   },


//   // ====================================================
//   // ACTION BUTTONS
//   // ====================================================

//   actionRow: {
//     flexDirection: "row",

//     width: "96%",

//     alignSelf: "center",

//     gap: 7,

//     marginTop: 2,
//   },

//   codBtn: {
//     flex: 1,

//     backgroundColor: "#F5B82E",

//     borderRadius: 9,

//     height: 42,

//     flexDirection: "row",

//     alignItems: "center",

//     justifyContent: "center",

//     gap: 5,

//     paddingHorizontal: 6,
//   },

//   onlineBtn: {
//     flex: 1,

//     backgroundColor: "#0D2A4A",

//     borderRadius: 9,

//     height: 42,

//     flexDirection: "row",

//     alignItems: "center",

//     justifyContent: "center",

//     gap: 5,

//     paddingHorizontal: 6,

//     borderWidth: 1,

//     borderColor: "#F5B82E",
//   },

//   actionIcon: {
//     width: 23,

//     height: 23,

//     borderRadius: 12,

//     backgroundColor:
//       "rgba(255,255,255,0.45)",

//     alignItems: "center",

//     justifyContent: "center",
//   },

//   onlineIcon: {
//     width: 23,

//     height: 23,

//     borderRadius: 12,

//     backgroundColor:
//       "rgba(245,184,46,0.12)",

//     alignItems: "center",

//     justifyContent: "center",
//   },

//   disabledBtn: {
//     opacity: 0.6,
//   },

//   codBtnText: {
//     color: "#0B0F14",

//     fontWeight: "700",

//     fontSize: 10,

//     flexShrink: 1,

//     textAlign: "center",
//   },

//   onlineBtnText: {
//     color: "#FFFFFF",

//     fontWeight: "700",

//     fontSize: 10,

//     flexShrink: 1,

//     textAlign: "center",
//   },


//   // ====================================================
//   // MODAL
//   // ====================================================

//   modalOverlay: {
//     flex: 1,

//     justifyContent: "center",

//     alignItems: "center",

//     backgroundColor:
//       "rgba(0,0,0,0.6)",

//     paddingHorizontal: 10,
//   },

//   modalContent: {
//     backgroundColor: "#FFFFFF",

//     width: "90%",

//     maxWidth: 380,

//     borderRadius: 16,

//     padding: 15,

//     alignItems: "center",

//     boxShadow:
//       "0px 4px 12px rgba(0,0,0,0.15)",
//   },

//   modalHeader: {
//     alignItems: "center",

//     marginBottom: 8,
//   },

//   successIcon: {
//     width: 48,

//     height: 48,

//     borderRadius: 24,

//     backgroundColor: "#E8F5E9",

//     alignItems: "center",

//     justifyContent: "center",

//     marginBottom: 5,
//   },

//   modalTitle: {
//     fontSize: 17,

//     fontWeight: "800",

//     color: "#0B0F14",

//     marginTop: 2,
//   },

//   modalSubtitle: {
//     fontSize: 10,

//     color: "#64748B",

//     textAlign: "center",

//     marginTop: 3,

//     lineHeight: 15,

//     paddingHorizontal: 10,
//   },

//   modalDivider: {
//     width: "100%",

//     height: 1,

//     backgroundColor: "#E2E6EB",

//     marginVertical: 9,
//   },

//   modalDetails: {
//     width: "100%",

//     marginBottom: 10,
//   },

//   modalRow: {
//     flexDirection: "row",

//     justifyContent: "space-between",

//     alignItems: "flex-start",

//     marginBottom: 6,
//   },

//   modalLabel: {
//     fontSize: 10,

//     color: "#64748B",

//     fontWeight: "500",
//   },

//   modalValue: {
//     fontSize: 10,

//     color: "#0B0F14",

//     fontWeight: "600",

//     textAlign: "right",

//     flex: 1,

//     marginLeft: 10,
//   },

//   modalTotalRow: {
//     marginTop: 5,

//     borderTopWidth: 1,

//     borderTopColor: "#E2E6EB",

//     paddingTop: 7,

//     marginBottom: 0,
//   },

//   modalTotalLabel: {
//     fontSize: 12,

//     fontWeight: "700",

//     color: "#0B0F14",
//   },

//   modalTotalValue: {
//     fontSize: 13,

//     fontWeight: "800",

//     color: "#F5B82E",
//   },


//   // ====================================================
//   // MODAL BUTTONS
//   // ====================================================

//   modalButtons: {
//     flexDirection: "row",

//     width: "100%",

//     gap: 7,
//   },

//   modalCancelBtn: {
//     flex: 1,

//     paddingVertical: 9,

//     borderRadius: 8,

//     alignItems: "center",

//     justifyContent: "center",

//     backgroundColor: "#F5F7FA",
//   },

//   modalCancelText: {
//     color: "#64748B",

//     fontWeight: "600",

//     fontSize: 11,
//   },

//   modalConfirmBtn: {
//     flex: 1,

//     paddingVertical: 9,

//     borderRadius: 8,

//     alignItems: "center",

//     justifyContent: "center",

//     backgroundColor: "#F5B82E",
//   },

//   modalConfirmText: {
//     color: "#0B0F14",

//     fontWeight: "700",

//     fontSize: 11,
//   },

// });



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

// ======================================================
// CHECKOUT SCREEN
// ======================================================

export default function CheckoutScreen() {
  const {
    cartItems: rawCartItems,
    clearCart,
  } = useCart();

  // Safely normalize cart items
  const cartItems = Array.isArray(rawCartItems)
    ? rawCartItems.filter(Boolean)
    : [];

  const [isLoading, setIsLoading] = useState(false);

  const [profile, setProfile] = useState(null);

  const [isProfileLoading, setIsProfileLoading] =
    useState(true);

  const [confirmModalVisible, setConfirmModalVisible] =
    useState(false);

  const [isConfirming, setIsConfirming] =
    useState(false);

  // ====================================================
  // FETCH PROFILE
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

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item?.price || 0) *
        Number(item?.quantity || 0),
    0
  );

  const deliveryFee =
    subtotal > 0 ? 40 : 0;

  const total =
    subtotal + deliveryFee;

  // ====================================================
  // GET SAFE ITEM ID
  // ====================================================

  const getItemId = (item, index = 0) => {
    return (
      item?._id ||
      item?.id ||
      item?.productId ||
      `checkout-item-${index}`
    );
  };

  // ====================================================
  // PLACE ORDER
  // ====================================================

  const placeOrder = async () => {
    if (!profile || !profile.address) {
      Alert.alert(
        "Missing Address",
        "Please add a delivery address in your Profile first."
      );

      router.push("/(tabs)/profile");

      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty. Please add items before placing an order."
      );

      return;
    }

    setIsConfirming(true);

    try {
      const orderData = {
        restaurantId:
          cartItems[0]?.restaurantId ||
          "unknown",

        items: cartItems.map((item) => ({
          _id:
            item?._id ||
            item?.id ||
            item?.productId,

          name:
            item?.name ||
            "Unnamed Item",

          price:
            Number(item?.price || 0),

          quantity:
            Number(item?.quantity || 0),
        })),

        totalAmount: total,

        deliveryAddress:
          profile.address,

        paymentMethod:
          "Cash on Delivery",
      };

      console.log(
        "📦 Sending Order:",
        JSON.stringify(
          orderData,
          null,
          2
        )
      );

      const response =
        await api.post(
          "/orders/create",
          orderData
        );

      console.log(
        "✅ Order Response:",
        response.data
      );

      setTimeout(() => {
        Alert.alert(
          "Order Confirmed!",
          `Your order has been sent to the restaurant.\n\nTotal: ₹${total}\nPayment: Cash on Delivery`,
          [
            {
              text: "Track Order",

              onPress: () => {
                clearCart();

                setConfirmModalVisible(
                  false
                );

                router.replace(
                  "/(tabs)/orders"
                );
              },
            },
          ]
        );
      }, 300);
    } catch (error) {
      console.error(
        "Order Error:",
        error
      );

      console.error(
        "Order Error Response:",
        error?.response?.data
      );

      Alert.alert(
        "Order Failed",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Could not place your order. Please try again."
      );
    } finally {
      setIsConfirming(false);
    }
  };

  // ====================================================
  // CASH ON DELIVERY
  // ====================================================

  const handleCashOnDelivery = () => {
    if (!profile || !profile.address) {
      Alert.alert(
        "Missing Address",
        "Please add a delivery address in your Profile first."
      );

      router.push("/(tabs)/profile");

      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty. Please add some items first."
      );

      return;
    }

    router.push({
      pathname:
        "/(tabs)/confirm-order",

      params: {
        restaurantId:
          cartItems[0]?.restaurantId ||
          "unknown",

        address:
          profile.address,

        total: total,
      },
    });
  };

  // ====================================================
  // PAY ONLINE
  // ====================================================

  const handlePayOnline = () => {
    if (!profile || !profile.address) {
      Alert.alert(
        "Missing Address",
        "Please add a delivery address in your Profile first."
      );

      router.push("/(tabs)/profile");

      return;
    }

    if (cartItems.length === 0) {
      Alert.alert(
        "Empty Cart",
        "Your cart is empty."
      );

      return;
    }

    const paymentItems =
      cartItems.map((item) => ({
        _id:
          item?._id ||
          item?.id ||
          item?.productId,

        name:
          item?.name ||
          "Unnamed Item",

        price:
          Number(item?.price || 0),

        quantity:
          Number(item?.quantity || 0),
      }));

    router.push({
      pathname:
        "/(tabs)/payment",

      params: {
        restaurantId:
          cartItems[0]?.restaurantId ||
          "unknown",

        items:
          JSON.stringify(paymentItems),

        total: total,

        address:
          profile.address,
      },
    });
  };

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
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

          <Text
            style={styles.headerTitle}
          >
            Checkout
          </Text>

          <View
            style={styles.headerSpacer}
          />

        </View>

        {/* ==================================================
            CONTENT
        ================================================== */}

        <ScrollView
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.scrollContent
          }
        >

          {/* ==================================================
              DELIVERY ADDRESS
          ================================================== */}

          <View
            style={styles.sectionCard}
          >

            <View
              style={
                styles.sectionHeaderRow
              }
            >

              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="location"
                  size={15}
                  color="#F5B82E"
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Delivery Address
              </Text>

            </View>

            {isProfileLoading ? (

              <View
                style={
                  styles.loadingRow
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
                  Loading address...
                </Text>
              </View>

            ) : profile?.address ? (

              <View
                style={
                  styles.addressBox
                }
              >
                <Ionicons
                  name="location-outline"
                  size={14}
                  color="#64748B"
                />

                <Text
                  style={
                    styles.addressText
                  }
                  numberOfLines={3}
                >
                  {profile.address}
                </Text>
              </View>

            ) : (

              <TouchableOpacity
                style={
                  styles.addAddressBox
                }
                onPress={() =>
                  router.push(
                    "/(tabs)/profile"
                  )
                }
              >
                <Ionicons
                  name="add-circle-outline"
                  size={15}
                  color="#F5B82E"
                />

                <Text
                  style={
                    styles.addAddressText
                  }
                >
                  Add delivery address
                </Text>
              </TouchableOpacity>

            )}

          </View>

          {/* ==================================================
              ORDER SUMMARY
          ================================================== */}

          <View
            style={styles.sectionCard}
          >

            <View
              style={
                styles.sectionHeaderRow
              }
            >

              <View
                style={
                  styles.sectionIcon
                }
              >
                <Ionicons
                  name="receipt-outline"
                  size={15}
                  color="#F5B82E"
                />
              </View>

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Order Summary
              </Text>

            </View>

            {/* CART ITEMS */}

            {cartItems.length === 0 ? (

              <View
                style={
                  styles.emptyCartBox
                }
              >
                <Ionicons
                  name="cart-outline"
                  size={25}
                  color="#CBD5E1"
                />

                <Text
                  style={
                    styles.emptyCartText
                  }
                >
                  Your cart is empty
                </Text>
              </View>

            ) : (

              cartItems.map(
                (item, index) => {

                  const itemId =
                    getItemId(
                      item,
                      index
                    );

                  const itemPrice =
                    Number(
                      item?.price || 0
                    );

                  const itemQuantity =
                    Number(
                      item?.quantity || 0
                    );

                  return (
                    <View
                      key={itemId}
                      style={
                        styles.itemRow
                      }
                    >

                      <View
                        style={
                          styles.itemInfo
                        }
                      >

                        <Text
                          style={
                            styles.itemName
                          }
                          numberOfLines={1}
                        >
                          {item?.name ||
                            "Unnamed Item"}
                        </Text>

                        <Text
                          style={
                            styles.itemQty
                          }
                        >
                          x{" "}
                          {itemQuantity}
                        </Text>

                      </View>

                      <Text
                        style={
                          styles.itemPrice
                        }
                      >
                        ₹
                        {itemPrice *
                          itemQuantity}
                      </Text>

                    </View>
                  );
                }
              )

            )}

            {/* DIVIDER */}

            <View
              style={styles.divider}
            />

            {/* SUBTOTAL */}

            <View
              style={styles.priceRow}
            >

              <Text
                style={
                  styles.priceLabel
                }
              >
                Subtotal
              </Text>

              <Text
                style={
                  styles.priceValue
                }
              >
                ₹{subtotal}
              </Text>

            </View>

            {/* DELIVERY */}

            <View
              style={styles.priceRow}
            >

              <Text
                style={
                  styles.priceLabel
                }
              >
                Delivery Fee
              </Text>

              <Text
                style={
                  styles.priceValue
                }
              >
                ₹{deliveryFee}
              </Text>

            </View>

            {/* TOTAL */}

            <View
              style={[
                styles.priceRow,
                styles.totalRow,
              ]}
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
                ₹{total}
              </Text>

            </View>

          </View>

          {/* ==================================================
              PAYMENT METHOD TITLE
          ================================================== */}

          <View
            style={
              styles.paymentTitleRow
            }
          >
            <Text
              style={
                styles.paymentTitle
              }
            >
              Choose Payment Method
            </Text>
          </View>

          {/* ==================================================
              ACTION BUTTONS
          ================================================== */}

          <View
            style={styles.actionRow}
          >

            {/* CASH ON DELIVERY */}

            <TouchableOpacity
              style={[
                styles.codBtn,
                isLoading &&
                  styles.disabledBtn,
              ]}
              onPress={
                handleCashOnDelivery
              }
              disabled={isLoading}
              activeOpacity={0.8}
            >

              <View
                style={
                  styles.actionIcon
                }
              >
                <Ionicons
                  name="cash-outline"
                  size={16}
                  color="#0B0F14"
                />
              </View>

              <Text
                style={
                  styles.codBtnText
                }
              >
                Cash on Delivery
              </Text>

            </TouchableOpacity>

            {/* PAY ONLINE */}

            <TouchableOpacity
              style={[
                styles.onlineBtn,
                isLoading &&
                  styles.disabledBtn,
              ]}
              onPress={
                handlePayOnline
              }
              disabled={isLoading}
              activeOpacity={0.8}
            >

              <View
                style={
                  styles.onlineIcon
                }
              >
                <Ionicons
                  name="card-outline"
                  size={16}
                  color="#F5B82E"
                />
              </View>

              <Text
                style={
                  styles.onlineBtnText
                }
              >
                Pay Online
              </Text>

            </TouchableOpacity>

          </View>

          {/* BOTTOM SPACE */}

          <View
            style={{ height: 25 }}
          />

        </ScrollView>

      </View>

      {/* ==================================================
          CONFIRM ORDER MODAL
      ================================================== */}

      <Modal
        animationType="slide"
        transparent={true}
        visible={
          confirmModalVisible
        }
        onRequestClose={() =>
          setConfirmModalVisible(
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
              styles.modalContent
            }
          >

            {/* MODAL HEADER */}

            <View
              style={
                styles.modalHeader
              }
            >

              <View
                style={
                  styles.successIcon
                }
              >
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color="#4CAF50"
                />
              </View>

              <Text
                style={
                  styles.modalTitle
                }
              >
                Confirm Your Order
              </Text>

              <Text
                style={
                  styles.modalSubtitle
                }
              >
                Please review your
                order details before
                placing it.
              </Text>

            </View>

            <View
              style={
                styles.modalDivider
              }
            />

            {/* MODAL DETAILS */}

            <View
              style={
                styles.modalDetails
              }
            >

              {/* ADDRESS */}

              <View
                style={
                  styles.modalRow
                }
              >

                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  Address
                </Text>

                <Text
                  style={
                    styles.modalValue
                  }
                  numberOfLines={2}
                >
                  {profile?.address ||
                    "Not set"}
                </Text>

              </View>

              {/* ITEMS */}

              <View
                style={
                  styles.modalRow
                }
              >

                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  Items
                </Text>

                <Text
                  style={
                    styles.modalValue
                  }
                >
                  {cartItems.length}
                </Text>

              </View>

              {/* PAYMENT */}

              <View
                style={
                  styles.modalRow
                }
              >

                <Text
                  style={
                    styles.modalLabel
                  }
                >
                  Payment
                </Text>

                <Text
                  style={
                    styles.modalValue
                  }
                >
                  Cash on Delivery
                </Text>

              </View>

              {/* TOTAL */}

              <View
                style={[
                  styles.modalRow,
                  styles.modalTotalRow,
                ]}
              >

                <Text
                  style={
                    styles.modalTotalLabel
                  }
                >
                  Total Amount
                </Text>

                <Text
                  style={
                    styles.modalTotalValue
                  }
                >
                  ₹{total}
                </Text>

              </View>

            </View>

            {/* MODAL BUTTONS */}

            <View
              style={
                styles.modalButtons
              }
            >

              {/* CANCEL */}

              <TouchableOpacity
                style={
                  styles.modalCancelBtn
                }
                onPress={() =>
                  setConfirmModalVisible(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.modalCancelText
                  }
                >
                  Cancel
                </Text>

              </TouchableOpacity>

              {/* CONFIRM */}

              <TouchableOpacity
                style={[
                  styles.modalConfirmBtn,
                  isConfirming &&
                    styles.disabledBtn,
                ]}
                onPress={placeOrder}
                disabled={isConfirming}
              >

                {isConfirming ? (

                  <ActivityIndicator
                    color="#0B0F14"
                    size="small"
                  />

                ) : (

                  <Text
                    style={
                      styles.modalConfirmText
                    }
                  >
                    Confirm Order
                  </Text>

                )}

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
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
    height: 50,
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
  // SECTION CARD
  // ====================================================

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    width: "96%",
    alignSelf: "center",
    boxShadow:
      "0px 2px 4px rgba(0,0,0,0.04)",
  },

  // ====================================================
  // SECTION HEADER
  // ====================================================

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },

  sectionIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor:
      "rgba(245,184,46,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0F14",
  },

  // ====================================================
  // LOADING
  // ====================================================

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 25,
  },

  loadingText: {
    fontSize: 10,
    color: "#64748B",
  },

  // ====================================================
  // ADDRESS
  // ====================================================

  addressBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    padding: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    gap: 5,
  },

  addressText: {
    flex: 1,
    fontSize: 10,
    color: "#64748B",
    lineHeight: 15,
  },

  addAddressBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E8",
    borderRadius: 7,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#F5B82E",
    borderStyle: "dashed",
    gap: 5,
  },

  addAddressText: {
    fontSize: 10,
    color: "#F5B82E",
    fontWeight: "700",
  },

  // ====================================================
  // EMPTY CART
  // ====================================================

  emptyCartBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },

  emptyCartText: {
    marginTop: 5,
    fontSize: 10,
    color: "#64748B",
  },

  // ====================================================
  // ORDER ITEMS
  // ====================================================

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
    paddingVertical: 2,
  },

  itemInfo: {
    flex: 1,
    marginRight: 8,
  },

  itemName: {
    fontSize: 11,
    fontWeight: "600",
    color: "#0B0F14",
  },

  itemQty: {
    fontSize: 9,
    color: "#64748B",
    marginTop: 1,
  },

  itemPrice: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0B0F14",
  },

  // ====================================================
  // DIVIDER
  // ====================================================

  divider: {
    height: 1,
    backgroundColor: "#E2E6EB",
    marginVertical: 7,
  },

  // ====================================================
  // PRICE
  // ====================================================

  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
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

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#E2E6EB",
    paddingTop: 6,
    marginTop: 5,
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
  // PAYMENT TITLE
  // ====================================================

  paymentTitleRow: {
    width: "96%",
    alignSelf: "center",
    marginTop: 2,
    marginBottom: 7,
  },

  paymentTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B0F14",
  },

  // ====================================================
  // ACTION BUTTONS
  // ====================================================

  actionRow: {
    flexDirection: "row",
    width: "96%",
    alignSelf: "center",
    gap: 7,
    marginTop: 2,
  },

  codBtn: {
    flex: 1,
    backgroundColor: "#F5B82E",
    borderRadius: 9,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
  },

  onlineBtn: {
    flex: 1,
    backgroundColor: "#0D2A4A",
    borderRadius: 9,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  actionIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor:
      "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },

  onlineIcon: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor:
      "rgba(245,184,46,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  disabledBtn: {
    opacity: 0.6,
  },

  codBtnText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 10,
    flexShrink: 1,
    textAlign: "center",
  },

  onlineBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 10,
    flexShrink: 1,
    textAlign: "center",
  },

  // ====================================================
  // MODAL
  // ====================================================

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor:
      "rgba(0,0,0,0.6)",
    paddingHorizontal: 10,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxWidth: 380,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    boxShadow:
      "0px 4px 12px rgba(0,0,0,0.15)",
  },

  modalHeader: {
    alignItems: "center",
    marginBottom: 8,
  },

  successIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 5,
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 2,
  },

  modalSubtitle: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
    marginTop: 3,
    lineHeight: 15,
    paddingHorizontal: 10,
  },

  modalDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E2E6EB",
    marginVertical: 9,
  },

  modalDetails: {
    width: "100%",
    marginBottom: 10,
  },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },

  modalLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "500",
  },

  modalValue: {
    fontSize: 10,
    color: "#0B0F14",
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },

  modalTotalRow: {
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#E2E6EB",
    paddingTop: 7,
    marginBottom: 0,
  },

  modalTotalLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B0F14",
  },

  modalTotalValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#F5B82E",
  },

  // ====================================================
  // MODAL BUTTONS
  // ====================================================

  modalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 7,
  },

  modalCancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F7FA",
  },

  modalCancelText: {
    color: "#64748B",
    fontWeight: "600",
    fontSize: 11,
  },

  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5B82E",
  },

  modalConfirmText: {
    color: "#0B0F14",
    fontWeight: "700",
    fontSize: 11,
  },
});