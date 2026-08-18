// import { createContext, useContext, useState } from "react";

// const CartContext = createContext(null);

// export const useCart = () => {
//   return useContext(CartContext);
// };

// export const CartProvider = ({ children }) => {
//   const [cartItems, setCartItems] = useState([]);

//   const addToCart = (item) => {
//     setCartItems((prev) => {
//       const existing = prev.find((i) => i._id === item._id);

//       if (existing) {
//         return prev.map((i) =>
//           i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i,
//         );
//       }

//       return [...prev, { ...item, quantity: 1 }];
//     });
//   };

//   const updateQuantity = (id, change) => {
//     setCartItems((prev) =>
//       prev
//         .map((item) => {
//           if (item._id === id) {
//             const newQty = item.quantity + change;

//             if (newQty < 1) {
//               return null;
//             }

//             return {
//               ...item,
//               quantity: newQty,
//             };
//           }

//           return item;
//         })
//         .filter(Boolean),
//     );
//   };

//   const removeFromCart = (id) => {
//     setCartItems((prev) => prev.filter((item) => item._id !== id));
//   };

//   const clearCart = () => {
//     setCartItems([]);
//   };

//   return (
//     <CartContext.Provider
//       value={{
//         cartItems,
//         addToCart,
//         updateQuantity,
//         removeFromCart,
//         clearCart,
//       }}
//     >
//       {children}
//     </CartContext.Provider>
//   );
// };



import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

const CART_KEY = "cartItems";

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(true);

  // =====================================================
  // LOAD CART
  // =====================================================

  useEffect(() => {
    loadCart();
  }, []);

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
      console.error("LOAD CART ERROR:", error);
      setCartItems([]);
    } finally {
      setCartLoading(false);
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
      console.error("SAVE CART ERROR:", error);
    }
  };

  // =====================================================
  // GET ITEM ID
  // =====================================================

  const getItemId = (item) => {
    return (
      item?._id ||
      item?.dishId ||
      item?.foodId ||
      item?.id
    );
  };

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = async (item) => {
    const itemId = getItemId(item);

    if (!itemId) {
      console.error(
        "Cannot add item to cart. ID missing:",
        item
      );
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find(
        (cartItem) =>
          String(getItemId(cartItem)) ===
          String(itemId)
      );

      let updatedCart;

      if (existing) {
        updatedCart = prev.map((cartItem) =>
          String(getItemId(cartItem)) ===
          String(itemId)
            ? {
                ...cartItem,
                quantity:
                  Number(cartItem.quantity || 0) + 1,
              }
            : cartItem
        );
      } else {
        updatedCart = [
          ...prev,
          {
            ...item,

            // IMPORTANT
            _id: itemId,

            dishId:
              item.dishId || itemId,

            foodId:
              item.foodId || itemId,

            quantity: 1,
          },
        ];
      }

      AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(updatedCart)
      ).catch((error) =>
        console.error(
          "SAVE CART ERROR:",
          error
        )
      );

      return updatedCart;
    });
  };

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (id, change) => {
    setCartItems((prev) => {
      const updatedCart = prev
        .map((item) => {
          const itemId = getItemId(item);

          if (
            String(itemId) === String(id)
          ) {
            const newQty =
              Number(item.quantity || 0) +
              change;

            if (newQty < 1) {
              return null;
            }

            return {
              ...item,
              quantity: newQty,
            };
          }

          return item;
        })
        .filter(Boolean);

      AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(updatedCart)
      ).catch((error) =>
        console.error(
          "SAVE CART ERROR:",
          error
        )
      );

      return updatedCart;
    });
  };

  // =====================================================
  // REMOVE FROM CART
  // =====================================================

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const updatedCart = prev.filter(
        (item) =>
          String(getItemId(item)) !==
          String(id)
      );

      AsyncStorage.setItem(
        CART_KEY,
        JSON.stringify(updatedCart)
      ).catch((error) =>
        console.error(
          "SAVE CART ERROR:",
          error
        )
      );

      return updatedCart;
    });
  };

  // =====================================================
  // CLEAR CART
  // =====================================================

  const clearCart = async () => {
    try {
      await AsyncStorage.removeItem(CART_KEY);
      setCartItems([]);
    } catch (error) {
      console.error(
        "CLEAR CART ERROR:",
        error
      );
    }
  };

  // =====================================================
  // CART COUNT
  // =====================================================

  const cartCount = cartItems.reduce(
    (total, item) =>
      total + Number(item.quantity || 0),
    0
  );

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};