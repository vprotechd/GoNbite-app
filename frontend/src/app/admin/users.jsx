import { Ionicons } from "@expo/vector-icons";
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
  useWindowDimensions,
} from "react-native";

import api from "../../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // =========================================
  // RESPONSIVE SCREEN SIZE
  // =========================================

  const { width } = useWindowDimensions();

  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  // =========================================
  // FETCH USERS
  // =========================================

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);

      const res = await api.get("/admin/all-users");

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(
        "Fetch users error:",
        error?.response?.data || error?.message,
      );

      Alert.alert("Error", "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================
  // PULL TO REFRESH
  // =========================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      const res = await api.get("/admin/all-users");

      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Refresh error:", error);
      Alert.alert("Error", "Failed to refresh users.");
    } finally {
      setRefreshing(false);
    }
  };

  // =========================================
  // TOGGLE USER STATUS
  // =========================================

  const toggleUserStatus = async (id, currentStatus, userName) => {
    const action = currentStatus ? "deactivate" : "activate";

    Alert.alert(
      `${action === "deactivate" ? "Deactivate" : "Activate"} User`,
      `Are you sure you want to ${action} ${userName || "this user"}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: action === "deactivate" ? "Deactivate" : "Activate",
          style: action === "deactivate" ? "destructive" : "default",

          onPress: async () => {
            try {
              await api.put(`/admin/toggle-user/${id}`);

              Alert.alert(
                "Success",
                `User ${
                  action === "deactivate" ? "deactivated" : "activated"
                } successfully.`,
              );

              fetchUsers();
            } catch (error) {
              console.error(
                "Toggle user error:",
                error?.response?.data || error?.message,
              );

              Alert.alert("Error", "Failed to update user status.");
            }
          },
        },
      ],
    );
  };

  // =========================================
  // VIEW USER ORDERS
  // =========================================

  const viewUserOrders = (userId, userName) => {
    router.push({
      pathname: "/admin/user-orders",
      params: {
        userId: userId,
        userName: userName,
      },
    });
  };

  // =========================================
  // USER INITIAL
  // =========================================

  const getInitial = (name) => {
    if (!name) return "U";

    return name.trim().charAt(0).toUpperCase();
  };

  // =========================================
  // USER STATUS
  // =========================================

  const isUserActive = (user) => {
    return user.isActive !== false;
  };

  // =========================================
  // SCREEN
  // =========================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* =====================================
            HEADER
        ====================================== */}

        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
            isTablet && styles.headerTablet,
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace("/admin")}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#0A1628" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.headerTitle,
                isMobile && styles.headerTitleMobile,
              ]}
              numberOfLines={1}
            >
              Manage Users
            </Text>

            <Text
              style={[
                styles.headerSubtitle,
                isMobile && styles.headerSubtitleMobile,
              ]}
              numberOfLines={1}
            >
              View and manage customer accounts
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={fetchUsers}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={21} color="#0A1628" />
          </TouchableOpacity>
        </View>

        {/* =====================================
            LOADING
        ====================================== */}

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />

            <Text style={styles.loadingText}>Loading users...</Text>
          </View>
        ) : users.length === 0 ? (
          /* =====================================
              EMPTY STATE
          ====================================== */

          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="people-outline" size={55} color="#CBD5E1" />
            </View>

            <Text style={styles.emptyTitle}>No Users Found</Text>

            <Text style={styles.emptySubtitle}>
              No customers have registered yet.
            </Text>
          </View>
        ) : (
          /* =====================================
              USER LIST
          ====================================== */

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.listContent,
              isMobile && styles.listContentMobile,
              isTablet && styles.listContentTablet,
              isDesktop && styles.listContentDesktop,
            ]}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#FF6B35"
              />
            }
          >
            {/* USER COUNT */}

            <View
              style={[
                styles.countRow,
                isMobile && styles.countRowMobile,
              ]}
            >
              <Text style={styles.countTitle}>All Users</Text>

              <View style={styles.countBadge}>
                <Text style={styles.countText}>{users.length}</Text>
              </View>
            </View>

            {/* USER CARDS */}

            {users.map((user) => {
              const active = isUserActive(user);

              return (
                <View
                  key={user._id}
                  style={[
                    styles.card,
                    isMobile && styles.cardMobile,
                    isTablet && styles.cardTablet,
                    isDesktop && styles.cardDesktop,
                  ]}
                >
                  {/* =================================
                      USER HEADER
                  ================================== */}

                  <View
                    style={[
                      styles.userHeader,
                      isMobile && styles.userHeaderMobile,
                    ]}
                  >
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor: active
                            ? "#FF6B35"
                            : "#CBD5E1",
                        },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {getInitial(user.name)}
                      </Text>
                    </View>

                    <View style={styles.userMainInfo}>
                      <Text
                        style={[
                          styles.userName,
                          isMobile && styles.userNameMobile,
                        ]}
                        numberOfLines={1}
                      >
                        {user.name || "Unknown User"}
                      </Text>

                      <View style={styles.roleRow}>
                        <Ionicons
                          name="person-outline"
                          size={12}
                          color="#64748B"
                        />

                        <Text style={styles.roleText}>Customer</Text>
                      </View>
                    </View>

                    {/* STATUS */}

                    <View
                      style={[
                        styles.statusBadge,
                        isMobile && styles.statusBadgeMobile,
                        {
                          backgroundColor: active
                            ? "#DCFCE7"
                            : "#FEE2E2",
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: active
                              ? "#16A34A"
                              : "#DC2626",
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: active
                              ? "#15803D"
                              : "#B91C1C",
                          },
                        ]}
                      >
                        {active ? "Active" : "Inactive"}
                      </Text>
                    </View>
                  </View>

                  {/* =================================
                      USER DETAILS
                  ================================== */}

                  <View
                    style={[
                      styles.detailsContainer,
                      isMobile && styles.detailsContainerMobile,
                    ]}
                  >
                    {/* EMAIL */}

                    <View style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Ionicons
                          name="mail-outline"
                          size={16}
                          color="#64748B"
                        />
                      </View>

                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>

                        <Text
                          style={styles.infoText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {user.email || "Not provided"}
                        </Text>
                      </View>
                    </View>

                    {/* PHONE */}

                    <View style={styles.infoRow}>
                      <View style={styles.infoIcon}>
                        <Ionicons
                          name="call-outline"
                          size={16}
                          color="#64748B"
                        />
                      </View>

                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Phone</Text>

                        <Text
                          style={styles.infoText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {user.phone || "No phone number"}
                        </Text>
                      </View>
                    </View>

                    {/* ADDRESS */}

                    {user.address ? (
                      <View style={styles.infoRow}>
                        <View style={styles.infoIcon}>
                          <Ionicons
                            name="location-outline"
                            size={16}
                            color="#64748B"
                          />
                        </View>

                        <View style={styles.infoContent}>
                          <Text style={styles.infoLabel}>Address</Text>

                          <Text
                            style={styles.infoText}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {user.address}
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>

                  {/* =================================
                      ACTION BUTTONS
                  ================================== */}

                  <View
                    style={[
                      styles.actionContainer,
                      isMobile && styles.actionContainerMobile,
                    ]}
                  >
                    {/* VIEW ORDERS */}

                    <TouchableOpacity
                      style={[
                        styles.ordersButton,
                        isMobile && styles.actionButtonMobile,
                      ]}
                      onPress={() =>
                        viewUserOrders(user._id, user.name)
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="receipt-outline"
                        size={16}
                        color="#0A1628"
                      />

                      <Text style={styles.ordersButtonText}>
                        Orders
                      </Text>
                    </TouchableOpacity>

                    {/* ACTIVATE / DEACTIVATE */}

                    <TouchableOpacity
                      style={[
                        styles.statusButton,
                        active
                          ? styles.deactivateButton
                          : styles.activateButton,
                        isMobile && styles.actionButtonMobile,
                      ]}
                      onPress={() =>
                        toggleUserStatus(
                          user._id,
                          active,
                          user.name,
                        )
                      }
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={
                          active
                            ? "ban-outline"
                            : "checkmark-circle-outline"
                        }
                        size={16}
                        color="#FFFFFF"
                      />

                      <Text style={styles.statusButtonText}>
                        {active ? "Deactivate" : "Activate"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // =========================================
  // MAIN
  // =========================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // =========================================
  // HEADER
  // =========================================

  header: {
    height: 75,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerMobile: {
    height: 68,
    paddingHorizontal: 12,
  },

  headerTablet: {
    paddingHorizontal: 22,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },

  headerTitleMobile: {
    fontSize: 17,
  },

  headerSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },

  headerSubtitleMobile: {
    fontSize: 9,
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // =========================================
  // LOADING
  // =========================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },

  // =========================================
  // EMPTY
  // =========================================

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },

  // =========================================
  // LIST
  // =========================================

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  listContentMobile: {
    paddingHorizontal: 12,
    paddingTop: 14,
  },

  listContentTablet: {
    paddingHorizontal: 28,
    alignItems: "center",
  },

  listContentDesktop: {
    paddingHorizontal: 30,
    alignItems: "center",
  },

  countRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  countRowMobile: {
    marginBottom: 12,
  },

  countTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0A1628",
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  countText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0B0F14",
  },

  // =========================================
  // CARD
  // =========================================

  card: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,

    borderWidth: 1,
    borderColor: "#E5E7EB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 3,
  },

  cardMobile: {
    borderRadius: 15,
    marginBottom: 13,
    padding: 13,
  },

  cardTablet: {
    width: "90%",
    maxWidth: 650,
  },

  cardDesktop: {
    width: "100%",
    maxWidth: 680,
  },

  // =========================================
  // USER HEADER
  // =========================================

  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    minWidth: 0,
  },

  userHeaderMobile: {
    marginBottom: 13,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  avatarText: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0B0F14",
  },

  userMainInfo: {
    flex: 1,
    minWidth: 0,
  },

  userName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0A1628",
  },

  userNameMobile: {
    fontSize: 16,
  },

  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },

  roleText: {
    fontSize: 11,
    color: "#64748B",
    marginLeft: 4,
    fontWeight: "600",
  },

  // =========================================
  // STATUS
  // =========================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 8,
    flexShrink: 0,
  },

  statusBadgeMobile: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginLeft: 5,
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // =========================================
  // DETAILS
  // =========================================

  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 13,
  },

  detailsContainerMobile: {
    paddingTop: 11,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 11,
    minWidth: 0,
  },

  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    flexShrink: 0,
  },

  infoContent: {
    flex: 1,
    minWidth: 0,
  },

  infoLabel: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },

  infoText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "500",
  },

  // =========================================
  // ACTIONS
  // =========================================

  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    paddingTop: 5,
  },

  actionContainerMobile: {
    gap: 7,
    paddingTop: 3,
  },

  ordersButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FF6B35",

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 8,
    gap: 5,
  },

  ordersButtonText: {
    color: "#0A1628",
    fontSize: 12,
    fontWeight: "800",
  },

  statusButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 13,
    paddingVertical: 8,

    borderRadius: 8,
    gap: 5,
  },

  actionButtonMobile: {
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  deactivateButton: {
    backgroundColor: "#EF4444",
  },

  activateButton: {
    backgroundColor: "#10B981",
  },

  statusButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});