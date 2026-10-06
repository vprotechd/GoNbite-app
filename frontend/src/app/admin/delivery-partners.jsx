import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

export default function AdminDeliveryPartners() {
  const [partners, setPartners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { width } = useWindowDimensions();

  // Responsive breakpoints
  const isMobile = width < 600;
  const isTablet = width >= 600 && width < 1024;
  const isDesktop = width >= 1024;

  useEffect(() => {
    fetchPartners();
  }, []);

  // --------------------------------------------------
  // FETCH DELIVERY PARTNERS
  // --------------------------------------------------

  const fetchPartners = async () => {
    try {
      setIsLoading(true);

      const res = await api.get("/admin/delivery-partners");

      setPartners(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(
        "Fetch Delivery Partners Error:",
        error?.response?.data || error?.message,
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to load delivery partners.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // --------------------------------------------------
  // APPROVE PARTNER
  // --------------------------------------------------

  const approvePartner = async (id) => {
    try {
      await api.put(`/admin/approve-delivery-partner/${id}`);

      Alert.alert("Success", "Delivery Partner approved successfully!");

      await fetchPartners();
    } catch (error) {
      console.error(
        "Approve Partner Error:",
        error?.response?.data || error?.message,
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error || "Failed to approve delivery partner.",
      );
    }
  };

  // --------------------------------------------------
  // REMOVE PARTNER
  // --------------------------------------------------

  const rejectPartner = async (id) => {
    Alert.alert(
      "Remove Delivery Partner",
      "Are you sure you want to remove this delivery partner?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/admin/reject-delivery-partner/${id}`);

              Alert.alert(
                "Removed",
                "Delivery Partner removed from the system.",
              );

              await fetchPartners();
            } catch (error) {
              console.error(
                "Remove Partner Error:",
                error?.response?.data || error?.message,
              );

              Alert.alert(
                "Error",
                error?.response?.data?.error ||
                  "Failed to remove delivery partner.",
              );
            }
          },
        },
      ],
    );
  };

  // --------------------------------------------------
  // BACK TO ADMIN DASHBOARD
  // --------------------------------------------------

  const goToDashboard = () => {
    router.replace("/admin");
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.container}>
        {/* HEADER */}
        <View
          style={[
            styles.header,
            isMobile && styles.headerMobile,
            isTablet && styles.headerTablet,
          ]}
        >
          <TouchableOpacity
            onPress={goToDashboard}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#0B0F14" />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text
              style={[
                styles.headerTitle,
                isMobile && styles.headerTitleMobile,
              ]}
              numberOfLines={1}
            >
              Delivery Partners
            </Text>

            <Text style={styles.headerSubtitle}>
              {partners.length}{" "}
              {partners.length === 1 ? "Partner" : "Partners"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={fetchPartners}
            style={styles.refreshButton}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh-outline" size={22} color="#0B0F14" />
          </TouchableOpacity>
        </View>

        {/* LOADING */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8500" />

            <Text style={styles.loadingText}>
              Loading delivery partners...
            </Text>
          </View>
        ) : partners.length === 0 ? (
          /* EMPTY STATE */
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bicycle-outline" size={55} color="#FF8500" />
            </View>

            <Text style={styles.emptyTitle}>No Delivery Partners</Text>

            <Text style={styles.emptySubtitle}>
              No delivery partners have registered yet.
            </Text>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={fetchPartners}
              activeOpacity={0.8}
            >
              <Ionicons name="refresh" size={17} color="#0B0F14" />

              <Text style={styles.refreshBtnText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* PARTNER LIST */
          <ScrollView
            contentContainerStyle={[
              styles.listContent,
              isMobile && styles.listContentMobile,
              isTablet && styles.listContentTablet,
              isDesktop && styles.listContentDesktop,
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View
              style={[
                styles.cardsWrapper,
                isMobile && styles.cardsWrapperMobile,
                isTablet && styles.cardsWrapperTablet,
                isDesktop && styles.cardsWrapperDesktop,
              ]}
            >
              {partners.map((partner) => {
                const isVerified = partner.isVerified === true;

                return (
                  <View
                    key={partner._id}
                    style={[
                      styles.card,
                      isMobile && styles.cardMobile,
                      isTablet && styles.cardTablet,
                      isDesktop && styles.cardDesktop,
                    ]}
                  >
                    {/* PARTNER HEADER */}
                    <View
                      style={[
                        styles.partnerHeader,
                        isMobile && styles.partnerHeaderMobile,
                      ]}
                    >
                      <View style={styles.avatar}>
                        <Ionicons
                          name="bicycle"
                          size={25}
                          color="#0B0F14"
                        />
                      </View>

                      <View style={styles.partnerDetails}>
                        <Text
                          style={styles.partnerName}
                          numberOfLines={1}
                        >
                          {partner.name || "Unknown Partner"}
                        </Text>

                        <View style={styles.infoRow}>
                          <Ionicons
                            name="mail-outline"
                            size={14}
                            color="#64748B"
                          />

                          <Text
                            style={styles.infoText}
                            numberOfLines={1}
                          >
                            {partner.email || "No email"}
                          </Text>
                        </View>

                        <View style={styles.infoRow}>
                          <Ionicons
                            name="call-outline"
                            size={14}
                            color="#64748B"
                          />

                          <Text
                            style={styles.infoText}
                            numberOfLines={1}
                          >
                            {partner.phone || "No phone"}
                          </Text>
                        </View>
                      </View>

                      {/* STATUS */}
                      <View
                        style={[
                          styles.statusBadge,
                          isVerified
                            ? styles.verifiedBadge
                            : styles.pendingBadge,
                          isMobile && styles.statusBadgeMobile,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: isVerified
                                ? "#16A34A"
                                : "#D97706",
                            },
                          ]}
                        />

                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: isVerified
                                ? "#166534"
                                : "#92400E",
                            },
                          ]}
                        >
                          {isVerified ? "Verified" : "Pending"}
                        </Text>
                      </View>
                    </View>

                    {/* VEHICLE INFO */}
                    <View
                      style={[
                        styles.vehicleBox,
                        isMobile && styles.vehicleBoxMobile,
                      ]}
                    >
                      <View style={styles.vehicleItem}>
                        <Ionicons
                          name="car-outline"
                          size={19}
                          color="#FF8500"
                        />

                        <View style={styles.vehicleTextContainer}>
                          <Text style={styles.vehicleLabel}>
                            Vehicle
                          </Text>

                          <Text style={styles.vehicleValue}>
                            {partner.vehicleType || "Not provided"}
                          </Text>
                        </View>
                      </View>

                      {partner.vehicleNumber ? (
                        <View style={styles.vehicleItem}>
                          <Ionicons
                            name="card-outline"
                            size={19}
                            color="#FF8500"
                          />

                          <View style={styles.vehicleTextContainer}>
                            <Text style={styles.vehicleLabel}>
                              Vehicle Number
                            </Text>

                            <Text style={styles.vehicleValue}>
                              {partner.vehicleNumber}
                            </Text>
                          </View>
                        </View>
                      ) : null}
                    </View>

                    {/* STATS */}
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                          <Ionicons
                            name="bicycle-outline"
                            size={17}
                            color="#FF8500"
                          />
                        </View>

                        <View>
                          <Text style={styles.statValue}>
                            {partner.totalDeliveries ?? 0}
                          </Text>

                          <Text style={styles.statLabel}>
                            Deliveries
                          </Text>
                        </View>
                      </View>

                      <View style={styles.statDivider} />

                      <View style={styles.statItem}>
                        <View style={styles.statIcon}>
                          <Ionicons
                            name="cash-outline"
                            size={17}
                            color="#FF8500"
                          />
                        </View>

                        <View>
                          <Text style={styles.statValue}>
                            ₹{partner.totalEarnings ?? 0}
                          </Text>

                          <Text style={styles.statLabel}>
                            Earnings
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ACTION BUTTONS */}
                    <View style={styles.actionRow}>
                      {!isVerified ? (
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() =>
                            approvePartner(partner._id)
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="checkmark-circle-outline"
                            size={18}
                            color="#FFFFFF"
                          />

                          <Text style={styles.btnText}>
                            Approve
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.removeBtn}
                          onPress={() =>
                            rejectPartner(partner._id)
                          }
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#FFFFFF"
                          />

                          <Text style={styles.btnText}>
                            Remove
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ==================================================
  // MAIN
  // ==================================================

  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  // ==================================================
  // HEADER
  // ==================================================

  header: {
    minHeight: 75,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  headerMobile: {
    paddingHorizontal: 12,
    minHeight: 68,
  },

  headerTablet: {
    paddingHorizontal: 24,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  headerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0B0F14",
    textAlign: "center",
  },

  headerTitleMobile: {
    fontSize: 16,
  },

  headerSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
    textAlign: "center",
  },

  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // ==================================================
  // LOADING
  // ==================================================

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },

  // ==================================================
  // EMPTY
  // ==================================================

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
    backgroundColor: "#FFF9E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#0B0F14",
    textAlign: "center",
  },

  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 7,
    maxWidth: 400,
  },

  refreshBtn: {
    marginTop: 20,
    backgroundColor: "#FF8500",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  refreshBtnText: {
    color: "#0B0F14",
    fontSize: 14,
    fontWeight: "700",
  },

  // ==================================================
  // LIST
  // ==================================================

  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  listContentMobile: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 30,
  },

  listContentTablet: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  listContentDesktop: {
    paddingHorizontal: 30,
    paddingTop: 24,
    paddingBottom: 50,
  },

  cardsWrapper: {
    width: "100%",
    alignSelf: "center",
  },

  cardsWrapperMobile: {
    maxWidth: 600,
  },

  cardsWrapperTablet: {
    maxWidth: 760,
  },

  cardsWrapperDesktop: {
    maxWidth: 900,
  },

  // ==================================================
  // CARD
  // ==================================================

  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E2E6EB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },

  cardMobile: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  cardTablet: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  cardDesktop: {
    padding: 20,
    borderRadius: 18,
    marginBottom: 18,
  },

  // ==================================================
  // PARTNER
  // ==================================================

  partnerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
  },

  partnerHeaderMobile: {
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FF6B35",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },

  partnerDetails: {
    flex: 1,
    minWidth: 0,
    paddingRight: 6,
  },

  partnerName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 5,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    minWidth: 0,
  },

  infoText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 6,
    flex: 1,
    minWidth: 0,
  },

  // ==================================================
  // STATUS
  // ==================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 20,
    flexShrink: 0,
    marginLeft: 5,
  },

  statusBadgeMobile: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    marginLeft: 3,
  },

  verifiedBadge: {
    backgroundColor: "#DCFCE7",
  },

  pendingBadge: {
    backgroundColor: "#FEF3C7",
  },

  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },

  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // ==================================================
  // VEHICLE
  // ==================================================

  vehicleBox: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    marginTop: 15,
    padding: 11,
    gap: 20,
    width: "100%",
  },

  vehicleBoxMobile: {
    flexDirection: "column",
    gap: 12,
  },

  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },

  vehicleTextContainer: {
    flex: 1,
    minWidth: 0,
  },

  vehicleLabel: {
    fontSize: 10,
    color: "#94A3B8",
    marginLeft: 8,
  },

  vehicleValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0B0F14",
    marginLeft: 8,
    marginTop: 1,
  },

  // ==================================================
  // STATS
  // ==================================================

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#EEF1F4",
    width: "100%",
  },

  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: 0,
  },

  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FFF9E8",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0B0F14",
  },

  statLabel: {
    fontSize: 10,
    color: "#64748B",
    marginTop: 1,
  },

  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E6EB",
  },

  // ==================================================
  // ACTION
  // ==================================================

  actionRow: {
    marginTop: 14,
    width: "100%",
  },

  approveBtn: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#10B981",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    paddingHorizontal: 12,
  },

  removeBtn: {
    minHeight: 40,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    width: "100%",
    paddingHorizontal: 12,
  },

  btnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },
});