import AsyncStorage from "@react-native-async-storage/async-storage";

const WISHLIST_KEY = "gonbite:wishlist";

const readWishlist = async () => {
  const stored = await AsyncStorage.getItem(WISHLIST_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeWishlist = async (wishlist) => {
  await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  return wishlist;
};

export const getWishlist = async () => readWishlist();

export const addToWishlist = async (restaurant) => {
  if (!restaurant?._id) {
    return readWishlist();
  }

  const wishlist = await readWishlist();
  const exists = wishlist.some(
    (item) => String(item?._id) === String(restaurant._id),
  );

  if (exists) {
    return wishlist;
  }

  return writeWishlist([...wishlist, restaurant]);
};

export const removeFromWishlist = async (restaurantId) => {
  const wishlist = await readWishlist();
  const updatedWishlist = wishlist.filter(
    (item) => String(item?._id) !== String(restaurantId),
  );

  return writeWishlist(updatedWishlist);
};
