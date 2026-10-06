import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// =================================================
// API URL
// =================================================

const API_URL = process.env.EXPO_PUBLIC_API_URL;

// =================================================
// AXIOS INSTANCE
// =================================================

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// =================================================
// REQUEST INTERCEPTOR
// =================================================

api.interceptors.request.use(
  async (config) => {
    try {
      /*
      =================================================
      ADMIN REQUESTS
      =================================================
      */

      if (config.url?.startsWith("/admin")) {
        const adminToken =
          await AsyncStorage.getItem("adminToken");

        console.log(
          "🔐 ADMIN REQUEST:",
          config.method?.toUpperCase(),
          config.url
        );

        console.log(
          "🔑 ADMIN TOKEN:",
          adminToken ? "FOUND" : "NOT FOUND"
        );

        if (adminToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${adminToken}`;
        }
      }

      /*
      =================================================
      RESTAURANT REQUESTS
      =================================================
      */

      else if (config.url?.startsWith("/restaurant")) {
        const restaurantToken =
          await AsyncStorage.getItem("restaurantToken");

        console.log(
          "🔐 RESTAURANT REQUEST:",
          config.method?.toUpperCase(),
          config.url
        );

        console.log(
          "🔑 RESTAURANT TOKEN:",
          restaurantToken ? "FOUND" : "NOT FOUND"
        );

        if (restaurantToken) {
          config.headers = config.headers || {};
          config.headers.Authorization =
            `Bearer ${restaurantToken}`;
        }
      }

      /*
      =================================================
      DELIVERY PARTNER REQUESTS
      =================================================
      */

      else if (config.url?.startsWith("/delivery")) {
        const deliveryToken =
          await AsyncStorage.getItem("deliveryToken");

        console.log(
          "🔐 DELIVERY REQUEST:",
          config.method?.toUpperCase(),
          config.url
        );

        console.log(
          "🔑 DELIVERY TOKEN:",
          deliveryToken ? "FOUND" : "NOT FOUND"
        );

        if (deliveryToken) {
          config.headers = config.headers || {};
          config.headers.Authorization =
            `Bearer ${deliveryToken}`;
        }
      }

      /*
      =================================================
      CUSTOMER REQUESTS
      =================================================
      */

      else {
        const customerToken =
          await AsyncStorage.getItem("token");

        console.log(
          "🔐 CUSTOMER REQUEST:",
          config.method?.toUpperCase(),
          config.url
        );

        console.log(
          "🔑 CUSTOMER TOKEN:",
          customerToken ? "FOUND" : "NOT FOUND"
        );

        if (customerToken) {
          config.headers = config.headers || {};
          config.headers.Authorization =
            `Bearer ${customerToken}`;
        }
      }

      return config;
    } catch (error) {
      console.error(
        "❌ API INTERCEPTOR ERROR:",
        error
      );

      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =================================================
// RESPONSE INTERCEPTOR
// =================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error(
      "❌ API ERROR:",
      error?.response?.status,
      error?.response?.data || error?.message
    );

    return Promise.reject(error);
  }
);

export default api;
