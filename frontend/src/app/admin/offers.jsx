import { useCallback, useState } from "react";
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

// ======================================================
// API URL
// ======================================================

// IMPORTANT:
// Backend route is:
// app.use("/api/admin/offers", offerRoutes);
//
// Therefore DO NOT use /api/api/admin/offers

const API_URL = "http://localhost:5000/api/admin/offers";

// ======================================================
// EMPTY FORM
// ======================================================

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

// ======================================================
// ADMIN OFFERS
// ======================================================

export const toggleOfferStatus = async (req, res) => {
  try {
    console.log("=================================");
    console.log("TOGGLE OFFER STATUS CONTROLLER");
    console.log("METHOD:", req.method);
    console.log("URL:", req.originalUrl);
    console.log("PARAMS:", req.params);
    console.log("ADMIN:", req.admin);
    console.log("=================================");

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Offer ID is required",
      });
    }

    const offer = await Offer.findById(id);

    console.log("FOUND OFFER:", offer);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    // Expired offers cannot be activated
    if (new Date() > new Date(offer.endDate)) {
      offer.isActive = false;

      await offer.save();

      return res.status(400).json({
        success: false,
        message: "Expired offers cannot be activated",
        offer,
      });
    }

    // Toggle
    offer.isActive = !offer.isActive;

    await offer.save();

    console.log("NEW OFFER STATUS:", offer.isActive);

    return res.status(200).json({
      success: true,
      message: offer.isActive
        ? "Offer activated successfully"
        : "Offer deactivated successfully",
      offer,
    });
  } catch (error) {
    console.error("TOGGLE OFFER STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update offer status",
      error: error.message,
    });
  }
};

export default function AdminOffers() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);

  const [form, setForm] = useState(emptyForm);

  // ======================================================
  // GET ADMIN TOKEN
  // ======================================================

  const getToken = async () => {
    const token = await AsyncStorage.getItem("adminToken");

    if (!token) {
      throw new Error("Admin session not found. Please login again.");
    }

    return token;
  };

  // ======================================================
  // FETCH OFFERS
  // ======================================================

  const fetchOffers = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      console.log("Fetching offers from:", API_URL);
      console.log("Admin token exists:", !!token);

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      console.log("Offers response status:", response.status);
      console.log("Offers response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to load offers (${response.status})`,
        );
      }

      setOffers(Array.isArray(data.offers) ? data.offers : []);
    } catch (error) {
      console.error("Fetch offers error:", error);

      Alert.alert("Error", error.message || "Unable to load offers.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOAD WHEN SCREEN OPENS
  // ======================================================

  useFocusEffect(
    useCallback(() => {
      fetchOffers();
    }, []),
  );

  // ======================================================
  // FORM UPDATE
  // ======================================================

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ======================================================
  // OPEN ADD MODAL
  // ======================================================

  const openAddModal = () => {
    setEditingOffer(null);

    setForm({
      ...emptyForm,
    });

    setModalVisible(true);
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================

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
        offer.maximumDiscount === null || offer.maximumDiscount === undefined
          ? ""
          : String(offer.maximumDiscount),

      startDate: formatDateForInput(offer.startDate),

      endDate: formatDateForInput(offer.endDate),

      description: offer.description || "",

      isActive: offer.isActive !== false,
    });

    setModalVisible(true);
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    if (saving) return;

    setModalVisible(false);
    setEditingOffer(null);

    setForm({
      ...emptyForm,
    });
  };

  // ======================================================
  // VALIDATE FORM
  // ======================================================

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

    const discountValue = Number(form.discountValue);

    if (Number.isNaN(discountValue) || discountValue <= 0) {
      Alert.alert("Validation", "Discount value must be greater than 0.");
      return false;
    }

    if (form.discountType === "percentage" && discountValue > 100) {
      Alert.alert(
        "Validation",
        "Percentage discount cannot be greater than 100%.",
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

    const start = new Date(form.startDate);
    const end = new Date(form.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      Alert.alert(
        "Validation",
        "Please enter valid dates in YYYY-MM-DD format.",
      );
      return false;
    }

    if (end <= start) {
      Alert.alert("Validation", "End date must be after start date.");
      return false;
    }

    return true;
  };

  // ======================================================
  // SAVE OFFER
  // ======================================================

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

        minimumOrder: form.minimumOrder === "" ? 0 : Number(form.minimumOrder),

        maximumDiscount:
          form.maximumDiscount === "" ? null : Number(form.maximumDiscount),

        startDate: form.startDate,
        endDate: form.endDate,

        description: form.description.trim(),

        isActive: form.isActive,
      };

      const url = editingOffer ? `${API_URL}/${editingOffer._id}` : API_URL;

      const method = editingOffer ? "PUT" : "POST";

      console.log("Saving offer:", {
        method,
        url,
        payload,
      });

      const response = await fetch(url, {
        method,

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify(payload),
      });

      const text = await response.text();

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }

      console.log("Save offer response:", response.status, data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Failed to save offer (${response.status})`,
        );
      }

      Alert.alert(
        "Success",
        editingOffer
          ? "Offer updated successfully."
          : "Offer created successfully.",
      );

      closeModal();

      await fetchOffers();
    } catch (error) {
      console.error("Save offer error:", error);

      Alert.alert("Error", error.message || "Unable to save offer.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // TOGGLE STATUS
  // ======================================================

  // ======================================================
  // TOGGLE OFFER STATUS
  // ======================================================

  const toggleStatus = async (offer) => {
    if (!offer?._id) {
      Alert.alert("Error", "Offer ID is missing.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const url = `${API_URL}/${offer._id}/status`;

      console.log("================================");
      console.log("TOGGLE OFFER STATUS");
      console.log("URL:", url);
      console.log("METHOD: PATCH");
      console.log("OFFER ID:", offer._id);
      console.log("CURRENT STATUS:", offer.isActive);
      console.log("TOKEN EXISTS:", !!token);
      console.log("================================");

      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("PATCH HTTP STATUS:", response.status);
      console.log("PATCH RESPONSE:", text);

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        console.log("PATCH response is not JSON");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Unable to update offer status. HTTP ${response.status}`,
        );
      }

      if (!data.offer) {
        throw new Error(
          "Server updated the offer but did not return the updated offer.",
        );
      }

      // Update UI immediately
      setOffers((previousOffers) =>
        previousOffers.map((item) =>
          item._id === offer._id
            ? {
                ...item,
                isActive: data.offer.isActive,
              }
            : item,
        ),
      );

      Alert.alert(
        "Success",
        data.message ||
          (data.offer.isActive
            ? "Offer activated successfully."
            : "Offer deactivated successfully."),
      );
    } catch (error) {
      console.error("TOGGLE STATUS ERROR:", error);

      Alert.alert("Error", error.message || "Unable to update offer status.");
    } finally {
      setSaving(false);
    }
  };
  // ======================================================
  // CONFIRM TOGGLE
  // ======================================================

  const confirmToggle = (offer) => {
    console.log("CONFIRM TOGGLE CALLED");
    console.log("OFFER:", offer);

    const action = offer.isActive ? "deactivate" : "activate";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Offer`,
      `Are you sure you want to ${action} "${offer.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),

          onPress: () => {
            console.log("CONFIRM BUTTON PRESSED - CALLING TOGGLE");

            toggleStatus(offer);
          },
        },
      ],
    );
  };

  // ======================================================
  // DELETE OFFER
  // ======================================================

  const deleteOffer = async (offer) => {
    if (!offer?._id) {
      Alert.alert("Error", "Offer ID is missing.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const url = `${API_URL}/${offer._id}`;

      console.log("================================");
      console.log("DELETE OFFER");
      console.log("URL:", url);
      console.log("METHOD: DELETE");
      console.log("OFFER ID:", offer._id);
      console.log("TOKEN EXISTS:", !!token);
      console.log("================================");

      const response = await fetch(url, {
        method: "DELETE",

        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      console.log("DELETE HTTP STATUS:", response.status);
      console.log("DELETE RESPONSE:", text);

      let data = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch (error) {
        console.log("Delete response is not JSON");
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            `Unable to delete offer. HTTP ${response.status}`,
        );
      }

      // Remove immediately from UI
      setOffers((previousOffers) =>
        previousOffers.filter((item) => item._id !== offer._id),
      );

      Alert.alert("Deleted", data.message || "Offer deleted successfully.");
    } catch (error) {
      console.error("DELETE OFFER ERROR:", error);

      Alert.alert("Error", error.message || "Unable to delete offer.");
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // CONFIRM DELETE
  // ======================================================

  // ======================================================
  // CONFIRM DELETE
  // ======================================================

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
          onPress: () => {
            deleteOffer(offer);
          },
        },
      ],
    );
  };

  // ======================================================
  // GET STATUS
  // ======================================================

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

  // ======================================================
  // RENDER OFFER
  // ======================================================

  const renderOffer = ({ item }) => {
    const status = getOfferStatus(item);

    return (
      <View style={styles.offerCard}>
        <View style={styles.offerHeader}>
          <View style={styles.offerTitleContainer}>
            <Text style={styles.offerName}>{item.name}</Text>

            <Text style={styles.festival}>{item.festival}</Text>
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
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.codeBox}>
          <Ionicons name="pricetag-outline" size={18} color="#F5B82E" />

          <Text style={styles.codeText}>{item.code}</Text>
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
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        <View style={styles.actionRow}>
          {/* EDIT */}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => {
              console.log("EDIT PRESSED:", item._id);
              openEditModal(item);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />

            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>

          {/* ACTIVATE / DEACTIVATE */}
        <TouchableOpacity
  style={[
    styles.statusButton,
    item.isActive
      ? styles.deactivateButton
      : styles.activateButton,
  ]}
  onPress={() => {
    console.log("STATUS BUTTON CLICKED");
    console.log("OFFER:", item._id);
    console.log("IS ACTIVE:", item.isActive);

    toggleStatus(item);
  }}
  disabled={saving}
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
    {item.isActive ? "Deactivate" : "Activate"}
  </Text>
</TouchableOpacity>
          {/* DELETE */}
          <TouchableOpacity
  style={styles.deleteButton}
  onPress={() => {
    console.log("DELETE BUTTON CLICKED");
    console.log("OFFER:", item._id);

    deleteOffer(item);
  }}
  disabled={saving}
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

  // ======================================================
  // UI
  // ======================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Festival Offers</Text>

          <Text style={styles.headerSubtitle}>
            Manage special & seasonal offers
          </Text>
        </View>

        <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color="#0B0F14" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#F5B82E" />

          <Text style={styles.loadingText}>Loading offers...</Text>
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
              <Ionicons name="pricetags-outline" size={60} color="#94A3B8" />

              <Text style={styles.emptyTitle}>No Offers Found</Text>

              <Text style={styles.emptyText}>
                Create your first festival or special occasion offer.
              </Text>

              <TouchableOpacity
                style={styles.emptyButton}
                onPress={openAddModal}
              >
                <Text style={styles.emptyButtonText}>Create Offer</Text>
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
              {editingOffer ? "Edit Offer" : "Create Offer"}
            </Text>

            <TouchableOpacity onPress={closeModal} disabled={saving}>
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Offer Name *</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Diwali Special"
              placeholderTextColor="#94A3B8"
              value={form.name}
              onChangeText={(value) => updateForm("name", value)}
            />

            <Text style={styles.label}>Festival / Occasion *</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: Diwali"
              placeholderTextColor="#94A3B8"
              value={form.festival}
              onChangeText={(value) => updateForm("festival", value)}
            />

            <Text style={styles.label}>Offer Code *</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: DIWALI20"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={form.code}
              onChangeText={(value) => updateForm("code", value.toUpperCase())}
            />

            <Text style={styles.label}>Discount Type *</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[
                  styles.typeButton,

                  form.discountType === "percentage" && styles.selectedType,
                ]}
                onPress={() => updateForm("discountType", "percentage")}
              >
                <Text
                  style={[
                    styles.typeText,

                    form.discountType === "percentage" &&
                      styles.selectedTypeText,
                  ]}
                >
                  Percentage %
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,

                  form.discountType === "fixed" && styles.selectedType,
                ]}
                onPress={() => updateForm("discountType", "fixed")}
              >
                <Text
                  style={[
                    styles.typeText,

                    form.discountType === "fixed" && styles.selectedTypeText,
                  ]}
                >
                  Fixed ₹
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Discount Value *</Text>

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
                updateForm("discountValue", value.replace(/[^0-9.]/g, ""))
              }
            />

            <Text style={styles.label}>Minimum Order</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: 299"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={form.minimumOrder}
              onChangeText={(value) =>
                updateForm("minimumOrder", value.replace(/[^0-9]/g, ""))
              }
            />

            <Text style={styles.label}>Maximum Discount</Text>

            <TextInput
              style={styles.input}
              placeholder="Example: 150"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={form.maximumDiscount}
              onChangeText={(value) =>
                updateForm("maximumDiscount", value.replace(/[^0-9]/g, ""))
              }
            />

            <Text style={styles.label}>Start Date *</Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={form.startDate}
              onChangeText={(value) => updateForm("startDate", value)}
            />

            <Text style={styles.dateHint}>Example: 2026-10-20</Text>

            <Text style={styles.label}>End Date *</Text>

            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#94A3B8"
              value={form.endDate}
              onChangeText={(value) => updateForm("endDate", value)}
            />

            <Text style={styles.dateHint}>Example: 2026-10-25</Text>

            <Text style={styles.label}>Description</Text>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe this special offer..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={form.description}
              onChangeText={(value) => updateForm("description", value)}
            />

            <TouchableOpacity
              style={[styles.saveButton, saving && styles.disabledButton]}
              onPress={saveOffer}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0B0F14" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#0B0F14" />

                  <Text style={styles.saveButtonText}>
                    {editingOffer ? "Update Offer" : "Create Offer"}
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
    backgroundColor: "#F8FAFC",
  },

  // ======================================================
  // HEADER
  // ======================================================

  header: {
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerTitle: {
    fontSize: 25,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  headerSubtitle: {
    fontSize: 13,
    color: "#CBD5E1",
    marginTop: 4,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  // ======================================================
  // LIST
  // ======================================================

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  offerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: "#E2E8F0",

    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  festival: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  // ======================================================
  // STATUS BADGES
  // ======================================================

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },

  activeBadge: {
    backgroundColor: "#DCFCE7",
  },

  inactiveBadge: {
    backgroundColor: "#F1F5F9",
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

  // ======================================================
  // OFFER CODE
  // ======================================================

  codeBox: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#EFF6FF",

    paddingHorizontal: 12,
    paddingVertical: 8,

    borderRadius: 7,

    alignSelf: "flex-start",
    marginTop: 14,

    borderWidth: 1,
    borderColor: "#DBEAFE",
  },

  codeText: {
    color: "#1D4ED8",
    fontWeight: "800",
    marginLeft: 7,
    letterSpacing: 1,
  },

  // ======================================================
  // DISCOUNT
  // ======================================================

  discountText: {
    fontSize: 23,
    fontWeight: "900",
    color: "#1D4ED8",
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

  // ======================================================
  // ACTION BUTTONS
  // ======================================================

  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    flexWrap: "wrap",
  },

  editButton: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#2563EB",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  statusButton: {
    flex: 1,
    minWidth: 105,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  activateButton: {
    backgroundColor: "#16A34A",
  },

  deactivateButton: {
    backgroundColor: "#D97706",
  },

  deleteButton: {
    flex: 1,
    minWidth: 90,
    backgroundColor: "#DC2626",
    borderRadius: 8,
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

  // ======================================================
  // LOADING
  // ======================================================

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    color: "#475569",
    marginTop: 12,
    fontSize: 14,
  },

  // ======================================================
  // EMPTY STATE
  // ======================================================

  emptyContainer: {
    alignItems: "center",
    paddingTop: 100,
    paddingHorizontal: 30,
  },

  emptyTitle: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 15,
  },

  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  emptyButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // ======================================================
  // MODAL
  // ======================================================

  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  modalHeader: {
    backgroundColor: "#1E3A5F",
    paddingHorizontal: 20,
    paddingVertical: 16,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  modalTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  formContainer: {
    padding: 20,
    paddingBottom: 50,
  },

  // ======================================================
  // FORM
  // ======================================================

  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#CBD5E1",

    borderRadius: 9,

    paddingHorizontal: 14,
    paddingVertical: 12,

    fontSize: 15,
    color: "#0F172A",
  },

  textArea: {
    minHeight: 100,
  },

  dateHint: {
    color: "#94A3B8",
    fontSize: 11,
    marginTop: 5,
  },

  // ======================================================
  // DISCOUNT TYPE
  // ======================================================

  typeRow: {
    flexDirection: "row",
    gap: 10,
  },

  typeButton: {
    flex: 1,

    borderWidth: 1,
    borderColor: "#CBD5E1",

    backgroundColor: "#FFFFFF",

    borderRadius: 9,

    paddingVertical: 12,

    alignItems: "center",
  },

  selectedType: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },

  typeText: {
    color: "#475569",
    fontWeight: "700",
  },

  selectedTypeText: {
    color: "#FFFFFF",
  },

  // ======================================================
  // SAVE BUTTON
  // ======================================================

  saveButton: {
    backgroundColor: "#2563EB",

    borderRadius: 10,

    paddingVertical: 15,

    marginTop: 28,

    alignItems: "center",
    justifyContent: "center",

    flexDirection: "row",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.6,
  },
});
