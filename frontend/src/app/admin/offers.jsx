import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";

const API_URL = "http://localhost:5000/api/api/admin/offers";

const emptyForm = {
  name: "",
  festival: "",
  code: "",
  discountType: "percentage",
  discountValue: "",
  minimumOrder: "",
  maximumDiscount: "",
  startDate: "",
  endDate: "",
  description: "",
  isActive: true,
};

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const getToken = async () => {
    // Use the key where your admin login stores its token.
    return await AsyncStorage.getItem("adminToken");
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load offers");
      }

      setOffers(data.offers || []);
    } catch (error) {
      console.error("Fetch offers:", error);

      Alert.alert(
        "Error",
        error.message || "Unable to load offers"
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, [])
  );

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setEditingOffer(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEditModal = (offer) => {
    setEditingOffer(offer);

    setForm({
      name: offer.name || "",
      festival: offer.festival || "",
      code: offer.code || "",
      discountType: offer.discountType || "percentage",
      discountValue: String(offer.discountValue ?? ""),
      minimumOrder: String(offer.minimumOrder ?? ""),
      maximumDiscount:
        offer.maximumDiscount === null ||
        offer.maximumDiscount === undefined
          ? ""
          : String(offer.maximumDiscount),
      startDate: formatDateForInput(offer.startDate),
      endDate: formatDateForInput(offer.endDate),
      description: offer.description || "",
      isActive: offer.isActive,
    });

    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingOffer(null);
    setForm(emptyForm);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      Alert.alert("Validation", "Offer name is required.");
      return false;
    }

    if (!form.festival.trim()) {
      Alert.alert("Validation", "Festival / occasion is required.");
      return false;
    }

    if (!form.code.trim()) {
      Alert.alert("Validation", "Offer code is required.");
      return false;
    }

    if (!form.discountValue) {
      Alert.alert("Validation", "Discount value is required.");
      return false;
    }

    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      Alert.alert(
        "Validation",
        "Percentage discount cannot be greater than 100%."
      );
      return false;
    }

    if (!form.startDate) {
      Alert.alert("Validation", "Start date is required.");
      return false;
    }

    if (!form.endDate) {
      Alert.alert("Validation", "End date is required.");
      return false;
    }

    if (
      new Date(form.endDate) <= new Date(form.startDate)
    ) {
      Alert.alert(
        "Validation",
        "End date must be after start date."
      );
      return false;
    }

    return true;
  };

  const saveOffer = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const token = await getToken();

      const payload = {
        name: form.name.trim(),
        festival: form.festival.trim(),
        code: form.code.trim().toUpperCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minimumOrder: Number(form.minimumOrder || 0),
        maximumDiscount:
          form.maximumDiscount === ""
            ? null
            : Number(form.maximumDiscount),
        startDate: form.startDate,
        endDate: form.endDate,
        description: form.description.trim(),
        isActive: form.isActive,
      };

      const url = editingOffer
        ? `${API_URL}/${editingOffer._id}`
        : API_URL;

      const method = editingOffer ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save offer");
      }

      Alert.alert(
        "Success",
        editingOffer
          ? "Offer updated successfully."
          : "Offer created successfully."
      );

      closeModal();
      fetchOffers();
    } catch (error) {
      console.error("Save offer:", error);

      Alert.alert(
        "Error",
        error.message || "Unable to save offer."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (offer) => {
    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/${offer._id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to update status"
        );
      }

      fetchOffers();
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Unable to update offer status."
      );
    }
  };

  const confirmToggle = (offer) => {
    const action = offer.isActive
      ? "deactivate"
      : "activate";

    Alert.alert(
      `${action.charAt(0).toUpperCase()}${action.slice(1)} Offer`,
      `Are you sure you want to ${action} "${offer.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => toggleStatus(offer),
        },
      ]
    );
  };

  const deleteOffer = async (offer) => {
    try {
      const token = await getToken();

      const response = await fetch(
        `${API_URL}/${offer._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete offer"
        );
      }

      Alert.alert("Deleted", "Offer deleted successfully.");

      fetchOffers();
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "Unable to delete offer."
      );
    }
  };

  const confirmDelete = (offer) => {
    Alert.alert(
      "Delete Offer",
      `Are you sure you want to permanently delete "${offer.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteOffer(offer),
        },
      ]
    );
  };

  const getOfferStatus = (offer) => {
    const now = new Date();
    const start = new Date(offer.startDate);
    const end = new Date(offer.endDate);

    if (now > end) {
      return "EXPIRED";
    }

    if (now < start) {
      return "UPCOMING";
    }

    if (offer.isActive) {
      return "ACTIVE";
    }

    return "INACTIVE";
  };

  const renderOffer = ({ item }) => {
    const status = getOfferStatus(item);

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.offerTitleContainer}>
            <Text style={styles.offerName}>
              {item.name}
            </Text>

            <Text style={styles.festival}>
              {item.festival}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              status === "ACTIVE" && styles.activeBadge,
              status === "INACTIVE" && styles.inactiveBadge,
              status === "EXPIRED" && styles.expiredBadge,
              status === "UPCOMING" && styles.upcomingBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Ionicons
            name="pricetag-outline"
            size={18}
            color="#F5B82E"
          />

          <Text style={styles.codeText}>
            {item.code}
          </Text>
        </View>

        <Text style={styles.discountText}>
          {item.discountType === "percentage"
            ? `${item.discountValue}% OFF`
            : `₹${item.discountValue} OFF`}
        </Text>

        <Text style={styles.dateText}>
          {formatDisplayDate(item.startDate)} -{" "}
          {formatDisplayDate(item.endDate)}
        </Text>

        {item.minimumOrder > 0 && (
          <Text style={styles.infoText}>
            Minimum order: ₹{item.minimumOrder}
          </Text>
        )}

        {item.maximumDiscount !== null &&
          item.maximumDiscount !== undefined && (
            <Text style={styles.infoText}>
              Maximum discount: ₹{item.maximumDiscount}
            </Text>
          )}

        {item.description ? (
          <Text style={styles.description}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openEditModal(item)}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.actionText}>
              Edit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusButton,
              item.isActive
                ? styles.deactivateButton
                : styles.activateButton,
            ]}
            onPress={() => confirmToggle(item)}
            disabled={status === "EXPIRED"}
          >
            <Ionicons
              name={
                item.isActive
                  ? "pause-circle-outline"
                  : "play-circle-outline"
              }
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.actionText}>
              {item.isActive
                ? "Deactivate"
                : "Activate"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDelete(item)}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.actionText}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Festival Offers
          </Text>

          <Text style={styles.headerSubtitle}>
            Manage special & seasonal offers
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={openAddModal}
        >
          <Ionicons
            name="add"
            size={24}
            color="#0B0F14"
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text style={styles.loadingText}>
            Loading offers...
          </Text>
        </View>
      ) : (
        <FlatList
          data={offers}
          keyExtractor={(item) => item._id}
          renderItem={renderOffer}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="pricetags-outline"
                size={60}
                color="#94A3B8"
              />

              <Text style={styles.emptyTitle}>
                No Offers Found
              </Text>

              <Text style={styles.emptyText}>
                Create your first festival or special
                occasion offer.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openAddModal}
              >
                <Text style={styles.emptyButtonText}>
                  Create Offer
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ================================================= */}
      {/* ADD / EDIT MODAL */}
      {/* ================================================= */}

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingOffer
                ? "Edit Offer"
                : "Create Offer"}
            </Text>

            <TouchableOpacity
              onPress={closeModal}
              disabled={saving}
            >
              <Ionicons
                name="close"
                size={28}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>
              Offer Name *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Diwali Special"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(value) =>
                updateForm("name", value)
              }
            />

            <Text style={styles.label}>
              Festival / Occasion *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Diwali"
              placeholderTextColor="#94A3B8"
              value={form.festival}
              onChangeText={(value) =>
                updateForm("festival", value)
              }
            />

            <Text style={styles.label}>
              Offer Code *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: DIWALI20"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={form.code}
              onChangeText={(value) =>
                updateForm(
                  "code",
                  value.toUpperCase()
                )
              }
            />

            <Text style={styles.label}>
              Discount Type *
            </Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  form.discountType ===
                    "percentage" &&
                    styles.selectedType,
                ]}
                onPress={() =>
                  updateForm(
                    "discountType",
                    "percentage"
                  )
                }
              >
                <Text
                  style={[
                    styles.typeText,
                    form.discountType ===
                      "percentage" &&
                      styles.selectedTypeText,
                  ]}
                >
                  Percentage %
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  form.discountType === "fixed" &&
                    styles.selectedType,
                ]}
                onPress={() =>
                  updateForm(
                    "discountType",
                    "fixed"
                  )
                }
              >
                <Text
                  style={[
                    styles.typeText,
                    form.discountType ===
                      "fixed" &&
                      styles.selectedTypeText,
                  ]}
                >
                  Fixed ₹
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>
              Discount Value *
            </Text>

            <TextInput
              style={styles.input}
              placeholder={
                form.discountType === "percentage"
                  ? "Example: 20"
                  : "Example: 100"
              }
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={form.discountValue}
              onChangeText={(value) =>
                updateForm(
                  "discountValue",
                  value.replace(/[^0-9.]/g, "")
                )
              }
            />

            <Text style={styles.label}>
              Minimum Order
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: 299"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={form.minimumOrder}
              onChangeText={(value) =>
                updateForm(
                  "minimumOrder",
                  value.replace(/[^0-9]/g, "")
                )
              }
            />

            <Text style={styles.label}>
              Maximum Discount
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Example: 150"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={form.maximumDiscount}
              onChangeText={(value) =>
                updateForm(
                  "maximumDiscount",
                  value.replace(/[^0-9]/g, "")
                )
              }
            />

            <Text style={styles.label}>
              Start Date *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={form.startDate}
              onChangeText={(value) =>
                updateForm("startDate", value)
              }
            />

            <Text style={styles.dateHint}>
              Example: 2026-10-20
            </Text>

            <Text style={styles.label}>
              End Date *
            </Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={form.endDate}
              onChangeText={(value) =>
                updateForm("endDate", value)
              }
            />

            <Text style={styles.dateHint}>
              Example: 2026-10-25
            </Text>

            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
              ]}
              placeholder="Describe this special offer..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={form.description}
              onChangeText={(value) =>
                updateForm("description", value)
              }
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                saving && styles.disabledButton,
              ]}
              onPress={saveOffer}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0B0F14" />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#0B0F14"
                  />

                  <Text style={styles.saveButtonText}>
                    {editingOffer
                      ? "Update Offer"
                      : "Create Offer"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ======================================================
// HELPERS
// ======================================================

function formatDateForInput(date) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toISOString().split("T")[0];
}

function formatDisplayDate(date) {
  if (!date) return "";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) {
    return "";
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ======================================================
// STYLES
// ======================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 4,
  },

  addButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  offerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  offerTitleContainer: {
    flex: 1,
    paddingRight: 10,
  },

  offerName: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0B0F14",
  },

  festival: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#E2E8F0",
  },

  expiredBadge: {
    backgroundColor: "#FEE2E2",
  },

  upcomingBadge: {
    backgroundColor: "#FEF3C7",
  },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#334155",
  },

  codeBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#081A33",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 14,
  },

  codeText: {
    color: "#FFFFFF",
    fontWeight: "800",
    marginLeft: 7,
    letterSpacing: 1,
  },

  discountText: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D99B00",
    marginTop: 14,
  },

  dateText: {
    fontSize: 13,
    color: "#475569",
    marginTop: 6,
  },

  infoText: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  description: {
    fontSize: 13,
    color: "#475569",
    marginTop: 12,
    lineHeight: 19,
  },

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },

  editButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  statusButton: {
    flex: 1,
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  activateButton: {
    backgroundColor: "#16A34A",
  },

  deactivateButton: {
    backgroundColor: "#F59E0B",
  },

  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 9,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  actionText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    marginTop: 12,
  },

  emptyContainer: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: "#F5B82E",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
  },

  emptyButtonText: {
    color: "#0B0F14",
    fontWeight: "800",
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  formContainer: {
    padding: 20,
    paddingBottom: 50,
  },

  label: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0B0F14",
  },

  textArea: {
    minHeight: 100,
  },

  dateHint: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 5,
  },

  typeRow: {
    flexDirection: "row",
    gap: 10,
  },

  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#475569",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },

  selectedType: {
    backgroundColor: "#F5B82E",
    borderColor: "#F5B82E",
  },

  typeText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  selectedTypeText: {
    color: "#0B0F14",
  },

  saveButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  saveButtonText: {
    color: "#0B0F14",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});