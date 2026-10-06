import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../services/api";

interface FoodItemType {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

export default function FoodManagement() {
  const [foodItems, setFoodItems] = useState<FoodItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
  });

  useEffect(() => {
    fetchFood();
  }, []);

  const fetchFood = async () => {
    setLoading(true);

    try {
      const res = await api.get("/restaurant/food");
      setFoodItems(res.data);
    } catch (error) {
      console.error("Fetch Food Error:", error);
      Alert.alert("Error", "Failed to load food items");
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (
      !result.canceled &&
      result.assets &&
      result.assets.length > 0
    ) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      Alert.alert(
        "Error",
        "Please fill in Name, Price, and Category"
      );
      return;
    }

    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("description", form.description);

    if (image) {
      if (Platform.OS === "web") {
        const response = await fetch(image);
        const blob = await response.blob();

        const file = new File(
          [blob],
          "food.jpg",
          { type: "image/jpeg" }
        );

        formData.append("image", file);
      } else {
        formData.append("image", {
          uri: image,
          name: "food.jpg",
          type: "image/jpeg",
        } as any);
      }
    }

    try {
      if (editingId) {
        await api.put(
          `/restaurant/food/${editingId}`,
          formData
        );

        Alert.alert("Success", "Food item updated!");
      } else {
        await api.post(
          "/restaurant/food",
          formData
        );

        Alert.alert(
          "Success",
          "Food item added to menu!"
        );
      }

      setModalVisible(false);
      resetForm();
      fetchFood();
    } catch (error: any) {
      console.error(
        "Save Food Error:",
        error?.response?.data || error?.message
      );

      Alert.alert(
        "Error",
        "Failed to save food item"
      );
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert(
      "Delete",
      "Are you sure you want to remove this item?",
      [
        {
          text: "Cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await api.delete(
                `/restaurant/food/${id}`
              );

              fetchFood();
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete item"
              );
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setForm({
      name: "",
      price: "",
      category: "",
      description: "",
    });

    setImage(null);
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>

        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() =>
              router.replace("/restaurant/dashboard")
            }
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#0A1628"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Manage Food
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* ADD BUTTON */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            resetForm();
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle"
            size={20}
            color="#FFFFFF"
          />

          <Text style={styles.addBtnText}>
            Add New Dish
          </Text>
        </TouchableOpacity>

        {/* FOOD LIST */}
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#FF6B35"
            style={styles.loader}
          />
        ) : (
          <FlatList<FoodItemType>
            data={foodItems}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.name}
                  </Text>

                  <Text style={styles.itemCategory}>
                    {item.category}
                  </Text>

                  <Text style={styles.itemPrice}>
                    ₹{item.price}
                  </Text>
                </View>

                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={styles.smallActionBtn}
                    onPress={() => {
                      setEditingId(item._id);

                      setForm({
                        name: item.name,
                        price: item.price.toString(),
                        category: item.category,
                        description:
                          item.description || "",
                      });

                      setImage(
                        item.imageUrl || null
                      );

                      setModalVisible(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="pencil"
                      size={18}
                      color="#FF6B35"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.smallActionBtn}
                    onPress={() =>
                      deleteItem(item._id)
                    }
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="trash"
                      size={18}
                      color="#FF8500"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {/* ADD / EDIT MODAL */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() =>
            setModalVisible(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.modalTitle}>
                  {editingId
                    ? "Edit Dish"
                    : "Add New Dish"}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="Dish Name (e.g. Chicken Burger)"
                  placeholderTextColor="#8E9BAE"
                  value={form.name}
                  onChangeText={(t) =>
                    setForm({
                      ...form,
                      name: t,
                    })
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Price (e.g. 250)"
                  placeholderTextColor="#8E9BAE"
                  keyboardType="numeric"
                  value={form.price}
                  onChangeText={(t) =>
                    setForm({
                      ...form,
                      price: t,
                    })
                  }
                />

                <TextInput
                  style={styles.input}
                  placeholder="Category (e.g. Burgers, Pizza)"
                  placeholderTextColor="#8E9BAE"
                  value={form.category}
                  onChangeText={(t) =>
                    setForm({
                      ...form,
                      category: t,
                    })
                  }
                />

                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                  ]}
                  placeholder="Description (optional)"
                  placeholderTextColor="#8E9BAE"
                  multiline
                  numberOfLines={3}
                  value={form.description}
                  onChangeText={(t) =>
                    setForm({
                      ...form,
                      description: t,
                    })
                  }
                />

                {/* IMAGE PICKER */}
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="camera"
                    size={18}
                    color="#FF6B35"
                  />

                  <Text
                    style={styles.imagePickerText}
                  >
                    {image
                      ? "Change Image"
                      : "Upload Food Image"}
                  </Text>
                </TouchableOpacity>

                {image && (
                  <Image
                    source={{ uri: image }}
                    style={styles.previewImage}
                  />
                )}

                {/* SAVE */}
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSave}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>
                    Save Dish
                  </Text>
                </TouchableOpacity>

                {/* CANCEL */}
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() =>
                    setModalVisible(false)
                  }
                  activeOpacity={0.7}
                >
                  <Text
                    style={styles.cancelBtnText}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* =========================
     MAIN
  ========================= */

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  mainContent: {
    flex: 1,
    width: "100%",
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  /* =========================
     HEADER
  ========================= */

  headerRow: {
    height: 48,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 34,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0A1628",
  },

  /* =========================
     ADD BUTTON
  ========================= */

  addBtn: {
    alignSelf: "center",

    width:
      Platform.OS === "web"
        ? 190
        : "58%",

    maxWidth: 210,
    minWidth: 150,

    height: 42,

    backgroundColor: "#FF6B35",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 12,

    borderRadius: 10,

    marginBottom: 14,
  },

  addBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
    marginLeft: 6,
  },

  /* =========================
     LIST
  ========================= */

  listContent: {
    paddingBottom: 25,
  },

  loader: {
    marginTop: 40,
  },

  itemCard: {
    width: "100%",

    flexDirection: "row",

    backgroundColor: "#FFFFFF",

    paddingHorizontal: 14,
    paddingVertical: 12,

    borderRadius: 12,

    marginBottom: 9,

    justifyContent: "space-between",
    alignItems: "center",

    borderWidth: 1,
    borderColor: "#E8ECF0",
  },

  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },

  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0A1628",
  },

  itemCategory: {
    fontSize: 11,
    color: "#6B7B8D",
    marginTop: 2,
  },

  itemPrice: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF6B35",
    marginTop: 3,
  },

  /* =========================
     ITEM ACTION BUTTONS
  ========================= */

  actionBtns: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  smallActionBtn: {
    width: 34,
    height: 34,

    borderRadius: 8,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF7F6",
  },

  /* =========================
     MODAL
  ========================= */

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.5)",

    justifyContent: "center",
    alignItems: "center",

    padding: 16,
  },

  modalContent: {
    backgroundColor: "#FFFFFF",

    width: "100%",
    maxWidth: 500,

    maxHeight: "85%",

    borderRadius: 18,

    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0A1628",

    marginBottom: 14,

    textAlign: "center",
  },

  input: {
    width: "100%",

    height: 42,

    backgroundColor: "#F5F7FA",

    borderRadius: 9,

    paddingHorizontal: 12,
    paddingVertical: 8,

    marginBottom: 10,

    borderWidth: 1,
    borderColor: "#E8ECF0",

    fontSize: 13,
    color: "#0A1628",
  },

  textArea: {
    height: 72,
    textAlignVertical: "top",
    paddingTop: 10,
  },

  /* =========================
     IMAGE
  ========================= */

  imagePicker: {
    height: 40,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFF1E6",

    paddingHorizontal: 10,

    borderRadius: 9,

    borderWidth: 1,
    borderColor: "#FF6B35",
    borderStyle: "dashed",

    marginBottom: 10,
  },

  imagePickerText: {
    color: "#0A1628",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 7,
  },

  previewImage: {
    width: 90,
    height: 90,

    borderRadius: 9,

    alignSelf: "center",

    marginBottom: 10,
  },

  /* =========================
     SAVE BUTTON
  ========================= */

  saveBtn: {
    alignSelf: "center",

    width:
      Platform.OS === "web"
        ? 180
        : "60%",

    maxWidth: 200,
    minWidth: 140,

    height: 40,

    backgroundColor: "#FF6B35",

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 5,
  },

  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 13,
  },

  /* =========================
     CANCEL
  ========================= */

  cancelBtn: {
    height: 36,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 3,
  },

  cancelBtnText: {
    color: "#8E9BAE",
    fontWeight: "600",
    fontSize: 12,
  },
});