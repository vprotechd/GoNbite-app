import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RestaurantDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, todayOrders: 0, totalRevenue: 0, todayRevenue: 0 });
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem('restaurantToken');
      const headers = { Authorization: `Bearer ${token}` };
      
      const dashboardRes = await api.get('/restaurant/dashboard', { headers });
      setStats(dashboardRes.data);

      const profileRes = await api.get('/restaurant/profile', { headers });
      setIsAvailable(profileRes.data.isAvailable);
    } catch (e) { Alert.alert('Error', 'Failed to load dashboard'); }
  };

  const toggleAvailability = async () => {
  const token = await AsyncStorage.getItem('restaurantToken');

  await api.put(
    '/restaurant/availability',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  setIsAvailable(!isAvailable);
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
  <ScrollView style={styles.container}>
    <Text style={styles.greeting}>
      Restaurant Dashboard
    </Text>

    <View style={styles.availabilityRow}>
      <Text style={styles.availText}>
        Accepting Orders
      </Text>

      <Switch
        trackColor={{
          false: "#767577",
          true: "#F48E16"
        }}
        thumbColor={
          isAvailable
            ? "#fff"
            : "#f4f3f4"
        }
        onValueChange={toggleAvailability}
        value={isAvailable}
      />
    </View>

    <View style={styles.grid}>

      <View style={styles.card}>
        <Text style={styles.cardNumber}>
          {stats.todayOrders}
        </Text>

        <Text style={styles.cardLabel}>
          Today's Orders
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardNumber}>
          ₹{stats.todayRevenue}
        </Text>

        <Text style={styles.cardLabel}>
          Today's Revenue
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardNumber}>
          {stats.totalOrders}
        </Text>

        <Text style={styles.cardLabel}>
          Total Orders
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardNumber}>
          ₹{stats.totalRevenue}
        </Text>

        <Text style={styles.cardLabel}>
          Total Revenue
        </Text>
      </View>

    </View>

    <Text style={styles.sectionTitle}>
      Quick Actions
    </Text>

    <View style={styles.actionRow}>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() =>
          router.push('/restaurant/food')
        }
      >
        <Ionicons
          name="fast-food"
          size={28}
          color="#F48E16"
        />

        <Text style={styles.actionText}>
          Manage Food
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() =>
          router.push('/restaurant/orders')
        }
      >
        <Ionicons
          name="receipt"
          size={28}
          color="#F48E16"
        />

        <Text style={styles.actionText}>
          Manage Orders
        </Text>
      </TouchableOpacity>

    </View>

    <TouchableOpacity
      style={styles.logoutBtn}
      onPress={handleLogout}
    >
      <Ionicons
        name="log-out-outline"
        size={22}
        color="#FFFFFF"
      />

      <Text style={styles.logoutText}>
        Logout
      </Text>
    </TouchableOpacity>

  </ScrollView>
);

}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20
  },

  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0A1628',
    marginTop: 10,
    marginBottom: 20
  },

  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8ECF0'
  },

  availText: {
    fontWeight: '600',
    fontSize: 16,
    color: '#0A1628'
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },

  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    width: '48%',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8ECF0'
  },

  cardNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0A1628'
  },

  cardLabel: {
    fontSize: 12,
    color: '#6B7B8D',
    marginTop: 4
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A1628',
    marginBottom: 15
  },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },

  actionBtn: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#E8ECF0'
  },

  actionText: {
    marginTop: 8,
    fontWeight: '600',
    color: '#0A1628'
  },

  logoutBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 25,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  }

});