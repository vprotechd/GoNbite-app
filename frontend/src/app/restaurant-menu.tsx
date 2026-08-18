import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useCart } from "../context/CartContext";

// Define the shape of a cart item
interface CartItem {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export default function RestaurantMenuScreen() {
  const { name, imageUrl, address, cuisine, foodItems } =
    useLocalSearchParams();
  const items = foodItems ? JSON.parse(foodItems as string) : [];

  const { cartItems, addToCart, updateQuantity } = useCart() as any;

  const totalItems = cartItems.reduce(
    (sum: number, item: any) => sum + item.quantity,
    0,
  );
  const totalPrice = cartItems.reduce(
    (sum: number, item: any) => sum + item.price * item.quantity,
    0,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* --- HEADER --- */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#0B0F14" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Menu</Text>

          <TouchableOpacity
            style={styles.cartIconContainer}
            onPress={() => router.push("/(tabs)/cart")}
          >
            <Ionicons name="cart-outline" size={24} color="#0B0F14" />
            {totalItems > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalItems}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* --- RESTAURANT DETAILS SECTION (Image + Info) --- */}
          <View style={styles.restaurantHeader}>
            {/* Cover Image */}
            <Image
              source={{
                uri: imageUrl
                  ? `http://localhost:5000${imageUrl}`
                  : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900",
              }}
              style={styles.coverImage}
              resizeMode="cover"
            />

            {/* Info Overlay */}
            <View style={styles.restaurantInfoOverlay}>
              <Text style={styles.restaurantName}>{name || "Restaurant"}</Text>
              <Text style={styles.cuisineText}>
                {cuisine || "Multi-Cuisine"}
              </Text>
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color="#FFFFFF" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {address || "Location not available"}
                </Text>
              </View>
            </View>
          </View>

          {/* --- TOP RATED / RECOMMENDED SECTION --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Rated Dishes</Text>
          </View>

          {/* --- DISHES LIST --- */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No dishes available</Text>
              <Text style={styles.emptySubtitle}>
                This restaurant hasn't added any food items to their menu yet.
              </Text>
            </View>
          ) : (
            items.map((item: any) => {
              const cartItem = cartItems.find((i: any) => i._id === item._id);
              const currentQty = cartItem ? cartItem.quantity : 0;

              return (
                <TouchableOpacity
                  key={item._id}
                  style={styles.menuCard}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{
                      uri: item.imageUrl
                        ? `http://localhost:5000${item.imageUrl}`
                        : "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
                    }}
                    style={styles.menuImage}
                  />
                  <View style={styles.menuInfo}>
                    <Text style={styles.menuName}>{item.name}</Text>
                    <Text style={styles.menuDesc} numberOfLines={2}>
                      {item.description || "Freshly prepared with love"}
                    </Text>

                    <View style={styles.menuBottomRow}>
                      <Text style={styles.menuPrice}>₹{item.price}</Text>

                      <View style={styles.quantityContainer}>
                        {currentQty > 0 ? (
                          <>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateQuantity(item._id, -1)}
                            >
                              <Ionicons
                                name="remove"
                                size={16}
                                color="#F5B82E"
                              />
                            </TouchableOpacity>
                            <Text style={styles.qtyText}>{currentQty}</Text>
                            <TouchableOpacity
                              style={styles.qtyBtn}
                              onPress={() => updateQuantity(item._id, 1)}
                            >
                              <Ionicons name="add" size={16} color="#F5B82E" />
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            style={styles.addToCartBtn}
                            onPress={() => addToCart(item)}
                          >
                            <Ionicons
                              name="add-circle"
                              size={28}
                              color="#F5B82E"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { flex: 1, backgroundColor: "#F5F7FA" },

  /* --- HEADER --- */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0B0F14" },
  cartIconContainer: { position: "relative", padding: 4 },
  cartBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    backgroundColor: "#FF5252",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  cartBadgeText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },

  scrollContent: { padding: 20 },

  /* --- RESTAURANT COVER & INFO --- */
  restaurantHeader: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    height: 200,
    backgroundColor: "#E2E6EB",
  },
  coverImage: { width: "100%", height: "100%" },
  restaurantInfoOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(8, 26, 51, 0.8)", // Midnight Navy overlay
  },
  restaurantName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  cuisineText: { fontSize: 14, color: "#F5B82E", fontWeight: "600" },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  locationText: { fontSize: 13, color: "#FFFFFF", opacity: 0.9 },

  /* --- SECTION HEADER --- */
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800", color: "#0B0F14" },

  /* --- EMPTY STATE --- */
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B0F14",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 40,
  },

  /* --- MENU CARD --- */
  menuCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EB",
    boxShadow: "0px 2px 4px rgba(0,0,0,0.04)",
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F5F7FA",
  },
  menuInfo: { flex: 1, marginLeft: 14, justifyContent: "space-between" },
  menuName: { fontSize: 16, fontWeight: "700", color: "#0B0F14" },
  menuDesc: { fontSize: 13, color: "#64748B", marginTop: 2 },
  menuBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  menuPrice: { fontSize: 16, fontWeight: "700", color: "#F5B82E" },

  /* --- QUANTITY CONTROLS --- */
  quantityContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFF1E6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5B82E",
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0B0F14",
    minWidth: 20,
    textAlign: "center",
  },
  addToCartBtn: { padding: 2 },
});
