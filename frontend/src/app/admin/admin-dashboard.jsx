import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AdminDashboard() {
  const handleLogout = async () => {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/(auth)/login");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#081A33" />

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Admin Panel</Text>

        {/* --- MANAGE RESTAURANTS --- */}
        <View style={styles.card}>
          <Ionicons name="storefront" size={40} color="#F5B82E" />
          <Text style={styles.cardTitle}>Manage Restaurants</Text>
          <Text style={styles.cardDesc}>
            Approve new restaurants and view pending requests.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/admin/restaurants")}
          >
            <Text style={styles.btnText}>Go to Approvals</Text>
          </TouchableOpacity>
        </View>

        {/* --- MANAGE USERS --- */}
        <View style={styles.card}>
          <Ionicons name="people" size={40} color="#F5B82E" />
          <Text style={styles.cardTitle}>Manage Users</Text>
          <Text style={styles.cardDesc}>
            View and manage all customer accounts.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/admin/users")}
          >
            <Text style={styles.btnText}>View Users</Text>
          </TouchableOpacity>
        </View>

        {/* --- 🆕 VIEW DELIVERY PARTNERS --- */}
        <View style={styles.card}>
          <Ionicons name="bicycle-outline" size={40} color="#F5B82E" />
          <Text style={styles.cardTitle}>Delivery Partners</Text>
          <Text style={styles.cardDesc}>
            Approve new delivery partners and manage the fleet.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => router.push("/admin/delivery-partners")}
          >
            <Text style={styles.btnText}>View Partners</Text>
          </TouchableOpacity>
        </View>


{/* --- MANAGE FESTIVAL / OCCASIONAL OFFERS --- */}
<View style={styles.card}>
  <Ionicons name="pricetags-outline" size={40} color="#F5B82E" />

  <Text style={styles.cardTitle}>Festival & Special Offers</Text>

  <Text style={styles.cardDesc}>
    Create, edit, activate, deactivate, and delete occasional offers for
    festivals and special events.
  </Text>

  <TouchableOpacity
    style={styles.btn}
    onPress={() => router.push("/admin/offers")}
  >
    <Text style={styles.btnText}>Manage Offers</Text>
  </TouchableOpacity>
</View>




        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#081A33" },
  container: { padding: 20, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
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
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
  },
  btnText: { color: "#0B0F14", fontWeight: "700" },
  logoutBtn: {
    marginTop: 40,
    padding: 16,
    backgroundColor: "#FF5252",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  logoutText: { color: "#FFFFFF", fontWeight: "700", fontSize: 16 },
});
