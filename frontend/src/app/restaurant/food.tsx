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

// ✅ 1. Define the type for your food items
interface FoodItemType {
  _id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  imageUrl?: string;
}

export default function FoodManagement() {
  // ✅ 2. Use the type in useState
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

  // 1. Fetch food on load
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

  // 2. Pick Image from Phone / Web
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // 3. Save (Add or Edit)
  const handleSave = async () => {
    if (!form.name || !form.price || !form.category) {
      Alert.alert("Error", "Please fill in Name, Price, and Category");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("price", form.price);
    formData.append("category", form.category);
    formData.append("description", form.description);

    // Web Browser fix for images
    if (image) {
      if (Platform.OS === "web") {
        const response = await fetch(image);
        const blob = await response.blob();
        const file = new File([blob], "food.jpg", { type: "image/jpeg" });
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
        await api.put(`/restaurant/food/${editingId}`, formData);
        Alert.alert("Success", "Food item updated!");
      } else {
        await api.post("/restaurant/food", formData);
        Alert.alert("Success", "Food item added to menu!");
      }
      setModalVisible(false);
      resetForm();
      fetchFood();
    } catch (error: any) {
      console.error("Save Food Error:", error?.response?.data || error.message);
      Alert.alert("Error", "Failed to save food item");
    }
  };

  // 4. Delete Item
  const deleteItem = (id: string) => {
    Alert.alert("Delete", "Are you sure you want to remove this item?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          try {
            await api.delete(`/restaurant/food/${id}`);
            fetchFood();
          } catch (error) {
            Alert.alert("Error", "Failed to delete item");
          }
        },
      },
    ]);
  };

  const resetForm = () => {
    setForm({ name: "", price: "", category: "", description: "" });
    setImage(null);
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.replace("/restaurant/dashboard")}
        >
          <Ionicons name="arrow-back" size={24} color="#0A1628" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Food</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => {
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add-circle" size={24} color="#FFF" />
        <Text style={styles.addBtnText}>Add New Dish</Text>
      </TouchableOpacity>

      {/* ✅ 3. Use FlatList with the generic type <FoodItemType> */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#F48E16"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList<FoodItemType>
          data={foodItems}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>

              <View style={styles.actionBtns}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item._id);
                    setForm({
                      name: item.name,
                      price: item.price.toString(), // ✅ Convert number to string
                      category: item.category,
                      description: item.description || "",
                    });
                    setModalVisible(true);
                  }}
                >
                  <Ionicons name="pencil" size={22} color="#F48E16" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteItem(item._id)}>
                  <Ionicons name="trash" size={22} color="#FF5252" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* MODAL for Add/Edit */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Dish" : "Add New Dish"}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Dish Name (e.g. Chicken Burger)"
                value={form.name}
                onChangeText={(t) => setForm({ ...form, name: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Price (e.g. 250)"
                keyboardType="numeric"
                value={form.price}
                onChangeText={(t) => setForm({ ...form, price: t })}
              />

              <TextInput
                style={styles.input}
                placeholder="Category (e.g. Burgers, Pizza)"
                value={form.category}
                onChangeText={(t) => setForm({ ...form, category: t })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description (optional)"
                multiline={true}
                numberOfLines={3}
                value={form.description}
                onChangeText={(t) => setForm({ ...form, description: t })}
              />

              {/* Image Picker */}
              <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                <Ionicons name="camera" size={20} color="#F48E16" />
                <Text style={styles.imagePickerText}>
                  {image ? "Change Image" : "Upload Food Image"}
                </Text>
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image }} style={styles.previewImage} />
              )}

              {/* Action Buttons */}
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Dish</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA", padding: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0A1628" },
  addBtn: {
    backgroundColor: "#F48E16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  addBtnText: { color: "#FFF", fontWeight: "700", fontSize: 16, marginLeft: 8 },

  itemCard: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8ECF0",
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: "700", color: "#0A1628" },
  itemCategory: { fontSize: 12, color: "#6B7B8D", marginTop: 2 },
  itemPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F48E16",
    marginTop: 4,
  },
  actionBtns: { flexDirection: "row", gap: 16 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFF",
    width: "90%",
    maxHeight: "80%",
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0A1628",
    marginBottom: 16,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#F5F7FA",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E8ECF0",
    fontSize: 14,
  },
  textArea: { height: 80, textAlignVertical: "top" },

  imagePicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F48E16",
    borderStyle: "dashed",
    marginBottom: 12,
  },
  imagePickerText: { color: "#0A1628", fontWeight: "600", marginLeft: 8 },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 12,
  },

  saveBtn: {
    backgroundColor: "#F48E16",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  saveBtnText: { color: "#0A1628", fontWeight: "700", fontSize: 16 },
  cancelBtn: { padding: 14, alignItems: "center", marginTop: 6 },
  cancelBtnText: { color: "#8E9BAE", fontWeight: "600" },
});
