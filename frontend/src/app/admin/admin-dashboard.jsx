import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";


export default function AdminDashboard() {

  // =========================================================
  // STATES
  // =========================================================

  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [loadingStats, setLoadingStats] =
    useState(false);

  const [refreshing, setRefreshing] =
    useState(false);

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalDeliveryPartners: 0,
    totalOrders: 0,

    pendingRestaurants: 0,
    pendingDeliveryPartners: 0,

    deliveredOrders: 0,
    cancelledOrders: 0,

    totalRevenue: 0,
  });


  // =========================================================
  // CHECK ADMIN AUTHENTICATION
  // =========================================================

  useEffect(() => {
    checkAdminAuth();
  }, []);


  const checkAdminAuth = async () => {

    try {

      const adminToken =
        await AsyncStorage.getItem(
          "adminToken"
        );

      console.log(
        "ADMIN TOKEN FOUND:",
        adminToken
      );


      // -------------------------------------------------------
      // NO TOKEN
      // -------------------------------------------------------

      if (!adminToken) {

        console.log(
          "NO ADMIN TOKEN → REDIRECTING TO ADMIN LOGIN"
        );

        router.replace("/admin/login");

        return;
      }


      // -------------------------------------------------------
      // VERIFY TOKEN WITH BACKEND
      // -------------------------------------------------------

      console.log(
        "VERIFYING ADMIN TOKEN WITH BACKEND..."
      );


      try {

        const response =
          await api.get(
            "/admin/verify",
            {
              headers: {
                Authorization:
                  `Bearer ${adminToken}`,
              },
            }
          );


        console.log(
          "✅ ADMIN TOKEN VERIFIED:",
          response.data
        );


        // -----------------------------------------------------
        // TOKEN VALID
        // -----------------------------------------------------

        setCheckingAuth(false);

        // Load dashboard statistics
        fetchDashboardStats(
          adminToken
        );

      } catch (verifyError) {

        console.log(
          "❌ ADMIN TOKEN VERIFICATION FAILED:",
          verifyError?.response?.data ||
          verifyError?.message
        );


        // -----------------------------------------------------
        // TOKEN INVALID / EXPIRED
        // -----------------------------------------------------

        await AsyncStorage.removeItem(
          "adminToken"
        );

        router.replace(
          "/admin/login"
        );
      }

    } catch (error) {

      console.log(
        "Admin authentication error:",
        error
      );

      await AsyncStorage.removeItem(
        "adminToken"
      );

      router.replace(
        "/admin/login"
      );
    }
  };


  // =========================================================
  // FETCH DASHBOARD STATISTICS
  // =========================================================

  const fetchDashboardStats = async (
    token = null
  ) => {

    try {

      setLoadingStats(true);


      const adminToken =
        token ||
        await AsyncStorage.getItem(
          "adminToken"
        );


      if (!adminToken) {
        return;
      }


      console.log(
        "📊 FETCHING ADMIN DASHBOARD STATS..."
      );


      const response =
        await api.get(
          "/admin/dashboard",
          {
            headers: {
              Authorization:
                `Bearer ${adminToken}`,
            },
          }
        );


      console.log(
        "✅ ADMIN DASHBOARD DATA:",
        response.data
      );


      if (
        response.data &&
        response.data.stats
      ) {

        setStats(
          response.data.stats
        );
      }

    } catch (error) {

      console.log(
        "❌ DASHBOARD STATS ERROR:",
        error?.response?.data ||
        error?.message
      );


      // -------------------------------------------------------
      // TOKEN EXPIRED / UNAUTHORIZED
      // -------------------------------------------------------

      if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {

        await AsyncStorage.removeItem(
          "adminToken"
        );

        router.replace(
          "/admin/login"
        );

        return;
      }

      Alert.alert(
        "Dashboard Error",
        "Unable to load dashboard statistics."
      );

    } finally {

      setLoadingStats(false);
      setRefreshing(false);
    }
  };


  // =========================================================
  // PULL TO REFRESH
  // =========================================================

  const handleRefresh = async () => {

    setRefreshing(true);

    await fetchDashboardStats();
  };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = async () => {

    try {

      await AsyncStorage.removeItem(
        "adminToken"
      );

      router.replace(
        "/admin/login"
      );

    } catch (error) {

      console.log(
        "Logout error:",
        error
      );
    }
  };


  // =========================================================
  // AUTH CHECKING SCREEN
  // =========================================================

  if (checkingAuth) {

    return (
      <SafeAreaView
        style={styles.safeArea}
      >

        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View
          style={
            styles.loadingContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Checking admin authentication...
          </Text>

        </View>

      </SafeAreaView>
    );
  }


  // =========================================================
  // ADMIN DASHBOARD
  // =========================================================

  return (

    <SafeAreaView
      style={styles.safeArea}
    >

      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />


      <ScrollView

        contentContainerStyle={
          styles.container
        }

        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <Text
          style={styles.title}
        >
          Admin Panel
        </Text>


        <Text
          style={styles.subtitle}
        >
          Manage your complete Snax platform
        </Text>


        {/* =================================================
            DASHBOARD STATISTICS
        ================================================= */}

        <View
          style={styles.statsGrid}
        >

          {/* USERS */}

          <View
            style={styles.statCard}
          >

            <Ionicons
              name="people"
              size={30}
              color="#F5B82E"
            />

            <Text
              style={styles.statNumber}
            >
              {loadingStats
                ? "..."
                : stats.totalUsers}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total Users
            </Text>

          </View>


          {/* RESTAURANTS */}

          <View
            style={styles.statCard}
          >

            <Ionicons
              name="storefront"
              size={30}
              color="#F5B82E"
            />

            <Text
              style={styles.statNumber}
            >
              {loadingStats
                ? "..."
                : stats.totalRestaurants}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Restaurants
            </Text>

          </View>


          {/* DELIVERY */}

          <View
            style={styles.statCard}
          >

            <Ionicons
              name="bicycle"
              size={30}
              color="#F5B82E"
            />

            <Text
              style={styles.statNumber}
            >
              {loadingStats
                ? "..."
                : stats.totalDeliveryPartners}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Delivery Partners
            </Text>

          </View>


          {/* ORDERS */}

          <View
            style={styles.statCard}
          >

            <Ionicons
              name="receipt"
              size={30}
              color="#F5B82E"
            />

            <Text
              style={styles.statNumber}
            >
              {loadingStats
                ? "..."
                : stats.totalOrders}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total Orders
            </Text>

          </View>

        </View>


        {/* =================================================
            PENDING APPROVALS
        ================================================= */}

        <View
          style={styles.pendingCard}
        >

          <View
            style={styles.pendingHeader}
          >

            <Ionicons
              name="alert-circle-outline"
              size={25}
              color="#F5B82E"
            />

            <Text
              style={
                styles.pendingTitle
              }
            >
              Pending Approvals
            </Text>

          </View>


          <View
            style={styles.pendingRow}
          >

            <Text
              style={styles.pendingLabel}
            >
              Restaurants
            </Text>

            <Text
              style={styles.pendingNumber}
            >
              {loadingStats
                ? "..."
                : stats.pendingRestaurants}
            </Text>

          </View>


          <View
            style={styles.pendingRow}
          >

            <Text
              style={styles.pendingLabel}
            >
              Delivery Partners
            </Text>

            <Text
              style={styles.pendingNumber}
            >
              {loadingStats
                ? "..."
                : stats.pendingDeliveryPartners}
            </Text>

          </View>

        </View>


        {/* =================================================
            ORDER SUMMARY
        ================================================= */}

        <View
          style={styles.summaryCard}
        >

          <Text
            style={styles.summaryTitle}
          >
            Order Summary
          </Text>


          <View
            style={styles.summaryRow}
          >

            <View
              style={styles.summaryItem}
            >

              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#22C55E"
              />

              <Text
                style={
                  styles.summaryNumber
                }
              >
                {stats.deliveredOrders}
              </Text>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Delivered
              </Text>

            </View>


            <View
              style={styles.summaryItem}
            >

              <Ionicons
                name="close-circle"
                size={24}
                color="#EF4444"
              />

              <Text
                style={
                  styles.summaryNumber
                }
              >
                {stats.cancelledOrders}
              </Text>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Cancelled
              </Text>

            </View>


            <View
              style={styles.summaryItem}
            >

              <Ionicons
                name="cash-outline"
                size={24}
                color="#F5B82E"
              />

              <Text
                style={
                  styles.summaryNumber
                }
              >
                ₹
                {Number(
                  stats.totalRevenue || 0
                ).toLocaleString("en-IN")}
              </Text>

              <Text
                style={
                  styles.summaryLabel
                }
              >
                Revenue
              </Text>

            </View>

          </View>

        </View>


        {/* =================================================
            MANAGE RESTAURANTS
        ================================================= */}

        <View
          style={styles.card}
        >

          <Ionicons
            name="storefront"
            size={40}
            color="#F5B82E"
          />

          <Text
            style={styles.cardTitle}
          >
            Manage Restaurants
          </Text>

          <Text
            style={styles.cardDesc}
          >
            Approve restaurants, manage
            availability and view restaurant
            orders.
          </Text>


          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push(
                "/admin/restaurants"
              )
            }
          >

            <Text
              style={styles.btnText}
            >
              Manage Restaurants
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            MANAGE USERS
        ================================================= */}

        <View
          style={styles.card}
        >

          <Ionicons
            name="people"
            size={40}
            color="#F5B82E"
          />

          <Text
            style={styles.cardTitle}
          >
            Manage Users
          </Text>

          <Text
            style={styles.cardDesc}
          >
            View customer accounts, activate
            or deactivate users and view
            their orders.
          </Text>


          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push(
                "/admin/users"
              )
            }
          >

            <Text
              style={styles.btnText}
            >
              Manage Users
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            DELIVERY PARTNERS
        ================================================= */}

        <View
          style={styles.card}
        >

          <Ionicons
            name="bicycle-outline"
            size={40}
            color="#F5B82E"
          />

          <Text
            style={styles.cardTitle}
          >
            Delivery Partners
          </Text>

          <Text
            style={styles.cardDesc}
          >
            Verify documents, approve delivery
            partners and monitor the delivery
            fleet.
          </Text>


          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push(
                "/admin/delivery-partners"
              )
            }
          >

            <Text
              style={styles.btnText}
            >
              Manage Partners
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            ORDERS
        ================================================= */}

        <View
          style={styles.card}
        >

          <Ionicons
            name="receipt-outline"
            size={40}
            color="#F5B82E"
          />

          <Text
            style={styles.cardTitle}
          >
            Manage Orders
          </Text>

          <Text
            style={styles.cardDesc}
          >
            Monitor orders across customers,
            restaurants and delivery partners.
          </Text>


          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push(
                "/admin/orders"
              )
            }
          >

            <Text
              style={styles.btnText}
            >
              View Orders
            </Text>

          </TouchableOpacity>

        </View>

        <TouchableOpacity
  style={styles.btn}
  onPress={() => router.push("/admin/notifications")}
>
  <Text style={styles.btnText}>Send Notification</Text>
</TouchableOpacity>


        {/* =================================================
            FESTIVAL / SPECIAL OFFERS
        ================================================= */}

        <View
          style={styles.card}
        >

          <Ionicons
            name="pricetags-outline"
            size={40}
            color="#F5B82E"
          />

          <Text
            style={styles.cardTitle}
          >
            Festival & Special Offers
          </Text>

          <Text
            style={styles.cardDesc}
          >
            Create, edit, activate, deactivate,
            and delete occasional offers for
            festivals and special events.
          </Text>


          <TouchableOpacity
            style={styles.btn}
            onPress={() =>
              router.push(
                "/admin/offers"
              )
            }
          >

            <Text
              style={styles.btnText}
            >
              Manage Offers
            </Text>

          </TouchableOpacity>

        </View>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
        >

          <Ionicons
            name="log-out-outline"
            size={20}
            color="#FFFFFF"
          />

          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>

        </TouchableOpacity>


      </ScrollView>

    </SafeAreaView>
  );
}


// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },


  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },


  loadingText: {
    marginTop: 15,
    fontSize: 15,
    color: "#64748B",
  },


  container: {
    padding: 20,
    alignItems: "center",
    paddingBottom: 40,
  },


  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 5,
  },


  subtitle: {
    fontSize: 14,
    color: "#CBD5E1",
    marginBottom: 25,
    textAlign: "center",
  },


  // ==================================================
  // STATISTICS
  // ==================================================

  statsGrid: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },


  statCard: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },


  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 6,
  },


  statLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 3,
    textAlign: "center",
  },


  // ==================================================
  // PENDING APPROVALS
  // ==================================================

  pendingCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 500,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3,
  },


  pendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },


  pendingTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F14",
    marginLeft: 8,
  },


  pendingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },


  pendingLabel: {
    fontSize: 14,
    color: "#64748B",
  },


  pendingNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#F5B82E",
  },


  // ==================================================
  // ORDER SUMMARY
  // ==================================================

  summaryCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 500,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    elevation: 3,
  },


  summaryTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 15,
  },


  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },


  summaryItem: {
    alignItems: "center",
    flex: 1,
  },


  summaryNumber: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
    marginTop: 5,
  },


  summaryLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },


  // ==================================================
  // MANAGEMENT CARDS
  // ==================================================

  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },


  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0B0F14",
    marginTop: 10,
  },


  cardDesc: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },


  btn: {
    backgroundColor: "#F5B82E",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
  },


  btnText: {
    color: "#0B0F14",
    fontWeight: "700",
  },


  // ==================================================
  // LOGOUT
  // ==================================================

  logoutBtn: {
    marginTop: 25,
    padding: 16,
    backgroundColor: "#FF5252",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },


  logoutText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },

});