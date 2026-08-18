import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Platform } from "react-native";

let API_URL = "http://localhost:5000/api";

if (Platform.OS === "web") {
  API_URL = "http://localhost:5000/api";
} else if (Platform.OS === "android") {
  API_URL = "http://localhost:5000/api";
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  if (config.url?.startsWith("/restaurant")) {
    const restaurantToken = await AsyncStorage.getItem("restaurantToken");

    if (restaurantToken) {
      config.headers.Authorization = `Bearer ${restaurantToken}`;
    }
  } else {
    const customerToken = await AsyncStorage.getItem("token");

    if (customerToken) {
      config.headers.Authorization = `Bearer ${customerToken}`;
    }
  }

  return config;
});

export default api;
