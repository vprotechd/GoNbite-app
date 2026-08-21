import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

const CART_KEY = "cartItems";

export default function LimitedOfferScreen() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState([]);

  // =====================================================
  // LOAD PAGE
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      fetchDishes();
      loadCart();
    }, [])
  );

  // =====================================================
  // FETCH DISHES
  // =====================================================

  const fetchDishes = async () => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const response = await api.get("/restaurant/food", {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      let data = [];

      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (Array.isArray(response.data?.foods)) {
        data = response.data.foods;
      } else if (Array.isArray(response.data?.food)) {
        data = response.data.food;
      } else if (Array.isArray(response.data?.dishes)) {
        data = response.data.dishes;
      } else if (Array.isArray(response.data?.menu)) {
        data = response.data.menu;
      } else if (Array.isArray(response.data?.data)) {
        data = response.data.data;
      }

      const limitedDishes = data.filter((dish) => {
        const price = getOriginalPrice(dish);

        return price > 0 && price < 150;
      });

      setDishes(limitedDishes);
    } catch (error) {
      console.log(
        "LIMITED OFFER FETCH ERROR:",
        error?.response?.data ||
          error?.message ||
          error
      );

      setDishes([]);

      Alert.alert(
        "Unable to Load Offers",
        error?.response?.data?.message ||
          "Unable to load restaurant dishes."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD CART FROM ASYNC STORAGE
  // =====================================================

  const loadCart = async () => {
    try {
      const storedCart =
        await AsyncStorage.getItem(CART_KEY);

      if (storedCart) {
        const parsedCart = JSON.parse(storedCart);

        if (Array.isArray(parsedCart)) {
          setCartItems(parsedCart);
        } else {
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.log("LOAD CART ERROR:", error);
      setCartItems([]);
    }
  };

  // =====================================================
  // SAVE CART
  // =====================================================

  const saveCart = async (cart) => {
    try {
      await AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(cart)
      );

      setCartItems(cart);
    } catch (error) {
      console.log("SAVE CART ERROR:", error);
    }
  };

  // =====================================================
  // GET ORIGINAL PRICE
  // =====================================================

  const getOriginalPrice = (dish) => {
    return Number(
      dish?.price ??
        dish?.amount ??
        dish?.cost ??
        dish?.sellingPrice ??
        dish?.originalPrice ??
        0
    );
  };

  // =====================================================
  // DISCOUNT PRICE
  // =====================================================

  const getDiscountedPrice = (price) => {
    return Math.round((Number(price) || 0) * 0.5);
  };

  // =====================================================
  // DISH NAME
  // =====================================================

  const getDishName = (dish) => {
    return (
      dish?.name ||
      dish?.dishName ||
      dish?.title ||
      dish?.foodName ||
      "Delicious Dish"
    );
  };

  // =====================================================
  // RESTAURANT NAME
  // =====================================================

  const getRestaurantName = (dish) => {
    if (dish?.restaurantName) {
      return dish.restaurantName;
    }

    if (dish?.restaurant?.name) {
      return dish.restaurant.name;
    }

    if (dish?.restaurant?.restaurantName) {
      return dish.restaurant.restaurantName;
    }

    if (dish?.restaurant?.title) {
      return dish.restaurant.title;
    }

    if (dish?.owner?.name) {
      return dish.owner.name;
    }

    if (dish?.restaurantId?.name) {
      return dish.restaurantId.name;
    }

    if (dish?.restaurantId?.restaurantName) {
      return dish.restaurantId.restaurantName;
    }

    if (dish?.restaurant_id?.name) {
      return dish.restaurant_id.name;
    }

    return "Restaurant";
  };

  // =====================================================
  // RESTAURANT ID
  // =====================================================

  const getRestaurantId = (dish) => {
    const restaurant = dish?.restaurant;

    if (typeof restaurant === "object") {
      return (
        restaurant?._id ||
        restaurant?.id ||
        null
      );
    }

    return (
      dish?.restaurantId ||
      dish?.restaurant_id ||
      dish?.ownerId ||
      dish?.restaurant ||
      null
    );
  };

  // =====================================================
  // DISH ID
  // =====================================================

  const getDishId = (dish) => {
    return (
      dish?._id ||
      dish?.id ||
      dish?.foodId ||
      dish?.dishId ||
      null
    );
  };

  // =====================================================
  // IMAGE
  // =====================================================

  const getDishImage = (dish) => {
    const image =
      dish?.image ||
      dish?.imageUrl ||
      dish?.photo ||
      dish?.foodImage ||
      dish?.imagePath ||
      dish?.thumbnail ||
      dish?.restaurant?.image ||
      dish?.restaurant?.imageUrl ||
      null;

    if (!image) {
      return null;
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    const baseURL =
      api?.defaults?.baseURL || "";

    const cleanBaseURL = baseURL.replace(
      /\/api\/?$/,
      ""
    );

    if (image.startsWith("/")) {
      return `${cleanBaseURL}${image}`;
    }

    return `${cleanBaseURL}/${image}`;
  };

  // =====================================================
  // GET QUANTITY FROM CART
  // =====================================================

  const getCartQuantity = (dishId) => {
    const item = cartItems.find(
      (item) => String(item.dishId) === String(dishId)
    );

    return item?.quantity || 0;
  };

  // =====================================================
  // ADD / INCREASE
  // =====================================================

  const increaseQuantity = async (dish) => {
    const dishId = getDishId(dish);

    if (!dishId) {
      Alert.alert(
        "Error",
        "Dish ID is missing."
      );
      return;
    }

    const originalPrice =
      getOriginalPrice(dish);

    const discountedPrice =
      getDiscountedPrice(originalPrice);

    const existingItem = cartItems.find(
      (item) =>
        String(item.dishId) === String(dishId)
    );

    let updatedCart;

    if (existingItem) {
      updatedCart = cartItems.map((item) =>
        String(item.dishId) === String(dishId)
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item
      );
    } else {
      const newItem = {
        dishId: dishId,

        foodId: dishId,

        name: getDishName(dish),

        restaurantId:
          getRestaurantId(dish),

        restaurantName:
          getRestaurantName(dish),

        image: getDishImage(dish),

        originalPrice: originalPrice,

        price: discountedPrice,

        discount: 50,

        isOffer: true,

        quantity: 1,
      };

      updatedCart = [
        ...cartItems,
        newItem,
      ];
    }

    await saveCart(updatedCart);
  };

  // =====================================================
  // DECREASE
  // =====================================================

  const decreaseQuantity = async (dish) => {
    const dishId = getDishId(dish);

    const existingItem = cartItems.find(
      (item) =>
        String(item.dishId) === String(dishId)
    );

    if (!existingItem) {
      return;
    }

    let updatedCart;

    if (existingItem.quantity <= 1) {
      updatedCart = cartItems.filter(
        (item) =>
          String(item.dishId) !== String(dishId)
      );
    } else {
      updatedCart = cartItems.map((item) =>
        String(item.dishId) === String(dishId)
          ? {
              ...item,
              quantity: item.quantity - 1,
            }
          : item
      );
    }

    await saveCart(updatedCart);
  };

  // =====================================================
  // CART ITEM COUNT
  // =====================================================

  const cartCount = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            Limited Time Offer
          </Text>

          <Text style={styles.headerSubtitle}>
            Enjoy your favorite dishes at special prices
          </Text>
        </View>

        {/* CART BUTTON */}

        <TouchableOpacity
          style={styles.headerCart}
          onPress={() => router.push("/cart")}
        >
          <Ionicons
            name="bag-outline"
            size={23}
            color="#F5B82E"
          />

          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>
                {cartCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* OFFER BANNER */}

      <View style={styles.offerBanner}>
        <View>
          <Text style={styles.offerSmall}>
            LIMITED TIME OFFER
          </Text>

          <Text style={styles.offerTitle}>
            20% OFF
          </Text>

          <Text style={styles.offerDescription}>
            Selected dishes below ₹150
          </Text>
        </View>

        <View style={styles.offerIcon}>
          <Ionicons
            name="pricetag"
            size={42}
            color="#F5B82E"
          />
        </View>
      </View>

      {/* CONTENT */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Special Offers
            </Text>

            <Text style={styles.sectionSubtitle}>
              Existing dishes from our restaurants
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {dishes.length}
            </Text>
          </View>
        </View>

        {/* LOADING */}

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="large"
              color="#F5B82E"
            />

            <Text style={styles.loadingText}>
              Loading offers...
            </Text>
          </View>
        ) : dishes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="fast-food-outline"
              size={55}
              color="#94A3B8"
            />

            <Text style={styles.emptyTitle}>
              No offers available
            </Text>

            <Text style={styles.emptyText}>
              No restaurant dishes below ₹150 are
              currently available.
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={fetchDishes}
            >
              <Ionicons
                name="refresh"
                size={16}
                color="#0B0F14"
              />

              <Text style={styles.retryText}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.grid}>
            {dishes.map((dish, index) => {
              const originalPrice =
                getOriginalPrice(dish);

              const discountedPrice =
                getDiscountedPrice(
                  originalPrice
                );

              const image =
                getDishImage(dish);

              const dishName =
                getDishName(dish);

              const restaurantName =
                getRestaurantName(dish);

              const dishId =
                getDishId(dish) ||
                `dish-${index}`;

              const quantity =
                getCartQuantity(dishId);

              return (
                <View
                  key={String(dishId)}
                  style={styles.card}
                >
                  {/* IMAGE */}

                  <View
                    style={
                      styles.imageContainer
                    }
                  >
                    {image ? (
                      <Image
                        source={{
                          uri: image,
                        }}
                        style={
                          styles.dishImage
                        }
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={
                          styles.imagePlaceholder
                        }
                      >
                        <Ionicons
                          name="restaurant-outline"
                          size={40}
                          color="#94A3B8"
                        />

                        <Text
                          style={
                            styles.noImageText
                          }
                        >
                          No Image
                        </Text>
                      </View>
                    )}

                    <View
                      style={
                        styles.discountBadge
                      }
                    >
                      <Text
                        style={
                          styles.discountText
                        }
                      >
                        50% OFF
                      </Text>
                    </View>
                  </View>

                  {/* DETAILS */}

                  <View
                    style={styles.cardContent}
                  >
                    <Text
                      style={styles.dishName}
                      numberOfLines={1}
                    >
                      {dishName}
                    </Text>

                    <View
                      style={
                        styles.restaurantRow
                      }
                    >
                      <Ionicons
                        name="restaurant-outline"
                        size={13}
                        color="#64748B"
                      />

                      <Text
                        style={
                          styles.restaurantName
                        }
                        numberOfLines={1}
                      >
                        {restaurantName}
                      </Text>
                    </View>

                    {/* PRICE */}

                    <View
                      style={styles.priceRow}
                    >
                      <Text
                        style={
                          styles.discountedPrice
                        }
                      >
                        ₹{discountedPrice}
                      </Text>

                      <Text
                        style={
                          styles.originalPrice
                        }
                      >
                        ₹{originalPrice}
                      </Text>

                      <View
                        style={
                          styles.savedBadge
                        }
                      >
                        <Text
                          style={
                            styles.savedText
                          }
                        >
                          Save ₹
                          {originalPrice -
                            discountedPrice}
                        </Text>
                      </View>
                    </View>

                    {/* CART CONTROL */}

                    {quantity === 0 ? (
                      <TouchableOpacity
                        style={
                          styles.orderButton
                        }
                        activeOpacity={0.8}
                        onPress={() =>
                          increaseQuantity(
                            dish
                          )
                        }
                      >
                        <Ionicons
                          name="cart-outline"
                          size={17}
                          color="#0B0F14"
                        />

                        <Text
                          style={
                            styles.orderButtonText
                          }
                        >
                          Add to Cart
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={
                          styles.quantityContainer
                        }
                      >
                        <TouchableOpacity
                          style={
                            styles.quantityButton
                          }
                          onPress={() =>
                            decreaseQuantity(
                              dish
                            )
                          }
                        >
                          <Ionicons
                            name="remove"
                            size={18}
                            color="#0B0F14"
                          />
                        </TouchableOpacity>

                        <Text
                          style={
                            styles.quantityText
                          }
                        >
                          {quantity}
                        </Text>

                        <TouchableOpacity
                          style={
                            styles.quantityButton
                          }
                          onPress={() =>
                            increaseQuantity(
                              dish
                            )
                          }
                        >
                          <Ionicons
                            name="add"
                            size={18}
                            color="#0B0F14"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
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

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    backgroundColor: "#081A33",
    paddingHorizontal: 14,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#102B49",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  headerTextContainer: {
    flex: 1,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
  },

  headerSubtitle: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 3,
  },

  headerCart: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#102B49",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  cartBadge: {
    position: "absolute",
    right: -3,
    top: -3,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  cartBadgeText: {
    color: "#0B0F14",
    fontSize: 10,
    fontWeight: "900",
  },

  offerBanner: {
    margin: 14,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#081A33",
    borderWidth: 1,
    borderColor: "#F5B82E",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  offerSmall: {
    color: "#F5B82E",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  offerTitle: {
    color: "#F5B82E",
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },

  offerDescription: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 2,
  },

  offerIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#102B49",
    alignItems: "center",
    justifyContent: "center",
  },

  content: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  sectionTitle: {
    color: "#0B0F14",
    fontSize: 20,
    fontWeight: "800",
  },

  sectionSubtitle: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 3,
  },

  countBadge: {
    minWidth: 30,
    height: 30,
    paddingHorizontal: 8,
    borderRadius: 15,
    backgroundColor: "#FFF3CC",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    color: "#0B0F14",
    fontSize: 12,
    fontWeight: "800",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48.5%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
  },

  imageContainer: {
    height: 145,
    position: "relative",
    backgroundColor: "#E2E8F0",
  },

  dishImage: {
    width: "100%",
    height: "100%",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  noImageText: {
    color: "#94A3B8",
    fontSize: 10,
    marginTop: 5,
  },

  discountBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    backgroundColor: "#F5B82E",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
  },

  discountText: {
    color: "#0B0F14",
    fontSize: 10,
    fontWeight: "900",
  },

  cardContent: {
    padding: 12,
  },

  dishName: {
    color: "#0B0F14",
    fontSize: 15,
    fontWeight: "800",
  },

  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  restaurantName: {
    flex: 1,
    color: "#64748B",
    fontSize: 11,
    marginLeft: 4,
  },

  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 9,
  },

  discountedPrice: {
    color: "#0B0F14",
    fontSize: 17,
    fontWeight: "900",
    marginRight: 7,
  },

  originalPrice: {
    color: "#94A3B8",
    fontSize: 12,
    textDecorationLine: "line-through",
    marginRight: 7,
  },

  savedBadge: {
    backgroundColor: "#E8F7EE",
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
  },

  savedText: {
    color: "#16803C",
    fontSize: 9,
    fontWeight: "800",
  },

  orderButton: {
    height: 38,
    marginTop: 10,
    borderRadius: 9,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  orderButtonText: {
    color: "#0B0F14",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  // =====================================================
  // QUANTITY
  // =====================================================

  quantityContainer: {
    height: 38,
    marginTop: 10,
    borderRadius: 9,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 5,
  },

  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  quantityText: {
    color: "#0B0F14",
    fontSize: 14,
    fontWeight: "900",
  },

  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },

  loadingText: {
    color: "#64748B",
    marginTop: 10,
    fontSize: 13,
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 25,
  },

  emptyTitle: {
    color: "#0B0F14",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 12,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
    lineHeight: 19,
  },

  retryButton: {
    marginTop: 18,
    height: 42,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  retryText: {
    color: "#0B0F14",
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 6,
  },
});