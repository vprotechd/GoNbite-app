import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api";

export default function RestaurantDashboard() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
  });

  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("restaurantToken");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const dashboardRes = await api.get("/restaurant/dashboard", {
        headers,
      });

      setStats(dashboardRes.data);

      const profileRes = await api.get("/restaurant/profile", {
        headers,
      });

      setIsAvailable(profileRes.data.isAvailable);
    } catch (e) {
      Alert.alert("Error", "Failed to load dashboard");
    }
  };

  const toggleAvailability = async () => {
    try {
      const token = await AsyncStorage.getItem("restaurantToken");

      await api.put(
        "/restaurant/availability",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setIsAvailable(!isAvailable);
    } catch (error) {
      Alert.alert("Error", "Failed to update availability.");
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("restaurantToken");

      router.replace("/restaurant/login");
    } catch (error) {
      console.error("RESTAURANT LOGOUT ERROR:", error);

      Alert.alert("Error", "Failed to logout.");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mainContent}>
        {/* HEADER */}
        <Text style={styles.greeting}>
          Restaurant Dashboard
        </Text>

        {/* AVAILABILITY */}
        <View style={styles.availabilityRow}>
          <View style={styles.availabilityTextContainer}>
            <Text style={styles.availText}>
              Accepting Orders
            </Text>

            <Text style={styles.availSubText}>
              {isAvailable
                ? "Your restaurant is accepting orders"
                : "Your restaurant is currently offline"}
            </Text>
          </View>

          <Switch
            trackColor={{
              false: "#767577",
              true: "#FF6B35",
            }}
            thumbColor={
              isAvailable ? "#FFFFFF" : "#F4F3F4"
            }
            onValueChange={toggleAvailability}
            value={isAvailable}
          />
        </View>

        {/* STATISTICS */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="receipt-outline"
                size={20}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.cardNumber}>
              {stats.todayOrders}
            </Text>

            <Text style={styles.cardLabel}>
              Today's Orders
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="cash-outline"
                size={20}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.cardNumber}>
              ₹{stats.todayRevenue}
            </Text>

            <Text style={styles.cardLabel}>
              Today's Revenue
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="stats-chart-outline"
                size={20}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.cardNumber}>
              {stats.totalOrders}
            </Text>

            <Text style={styles.cardLabel}>
              Total Orders
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIcon}>
              <Ionicons
                name="wallet-outline"
                size={20}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.cardNumber}>
              ₹{stats.totalRevenue}
            </Text>

            <Text style={styles.cardLabel}>
              Total Revenue
            </Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}
        <Text style={styles.sectionTitle}>
          Quick Actions
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push("/restaurant/food")
            }
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <Ionicons
                name="fast-food"
                size={22}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.actionText}>
              Manage Food
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() =>
              router.push("/restaurant/orders")
            }
            activeOpacity={0.75}
          >
            <View style={styles.actionIconBox}>
              <Ionicons
                name="receipt"
                size={22}
                color="#FF6B35"
              />
            </View>

            <Text style={styles.actionText}>
              Manage Orders
            </Text>
          </TouchableOpacity>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={18}
            color="#FFFFFF"
          />

          <Text style={styles.logoutText}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* =========================
     MAIN CONTAINER
  ========================= */

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  contentContainer: {
    flexGrow: 1,
    paddingBottom: 25,
    alignItems: "center",
  },

  mainContent: {
    width: "100%",
    maxWidth: 1100,
    paddingHorizontal: 16,
  },

  /* =========================
     HEADER
  ========================= */

  greeting: {
    fontSize: 22,
    fontWeight: "800",
    color: "#0A1628",
    marginTop: 16,
    marginBottom: 16,
  },

  /* =========================
     AVAILABILITY
  ========================= */

  availabilityRow: {
    width: "100%",
    minHeight: 62,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 15,
    paddingVertical: 10,

    borderRadius: 12,

    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E8ECF0",
  },

  availabilityTextContainer: {
    flex: 1,
    paddingRight: 10,
  },

  availText: {
    fontWeight: "700",
    fontSize: 14,
    color: "#0A1628",
  },

  availSubText: {
    fontSize: 11,
    color: "#6B7B8D",
    marginTop: 3,
  },

  /* =========================
     STATISTICS
  ========================= */

  grid: {
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",

    width:
      Platform.OS === "web"
        ? "23.8%"
        : "48%",

    minHeight: 115,

    padding: 13,

    borderRadius: 12,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: "#E8ECF0",
  },

  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,

    backgroundColor: "#FFF1F0",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 8,
  },

  cardNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },

  cardLabel: {
    fontSize: 11,
    color: "#6B7B8D",
    marginTop: 3,
  },

  /* =========================
     QUICK ACTIONS
  ========================= */

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0A1628",
    marginBottom: 10,
  },

  actionRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  actionBtn: {
    backgroundColor: "#FFFFFF",

    width:
      Platform.OS === "web"
        ? 210
        : "48%",

    minHeight: 82,

    paddingVertical: 12,
    paddingHorizontal: 10,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E8ECF0",
  },

  actionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,

    backgroundColor: "#FFF1F0",

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 6,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0A1628",
    textAlign: "center",
  },

  /* =========================
     LOGOUT
  ========================= */

  logoutBtn: {
    alignSelf: "center",

    width:
      Platform.OS === "web"
        ? 180
        : "55%",

    maxWidth: 200,
    minWidth: 130,

    height: 40,

    backgroundColor: "#D32F2F",

    borderRadius: 10,

    marginTop: 18,
    marginBottom: 20,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 6,
  },
});