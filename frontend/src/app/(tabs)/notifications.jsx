import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const response = await api.get("/notifications");

      setNotifications(response.data || []);
    } catch (error) {
      console.error(
        "FETCH NOTIFICATIONS ERROR:",
        error?.response?.data || error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      console.error("MARK READ ERROR:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error("MARK ALL READ ERROR:", error);
    }
  };

  const getIcon = (type) => {
    if (type === "order") return "receipt-outline";
    if (type === "offer") return "pricetag-outline";

    return "notifications-outline";
  };

  const renderNotification = ({ item }) => {
    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard,
        ]}
        onPress={() => {
          if (!item.isRead) {
            markAsRead(item._id);
          }
        }}
      >
        <View style={styles.iconCircle}>
          <Ionicons
            name={getIcon(item.type)}
            size={24}
            color="#F5B82E"
          />
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {item.title}
            </Text>

            {!item.isRead && (
              <View style={styles.unreadDot} />
            )}
          </View>

          <Text style={styles.message}>
            {item.message}
          </Text>

          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter(
    (item) => !item.isRead
  ).length;

  return (
    <View style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>
            Notifications
          </Text>

          {unreadCount > 0 && (
            <Text style={styles.unreadText}>
              {unreadCount} unread
            </Text>
          )}
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
          >
            <Text style={styles.markAll}>
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTENT */}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.center}>
          <Ionicons
            name="notifications-off-outline"
            size={60}
            color="#94A3B8"
          />

          <Text style={styles.emptyTitle}>
            No Notifications
          </Text>

          <Text style={styles.emptyText}>
            You don't have any notifications yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  header: {
    backgroundColor: "#081A33",
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },

  unreadText: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 4,
  },

  markAll: {
    color: "#F5B82E",
    fontSize: 13,
    fontWeight: "600",
  },

  list: {
    padding: 15,
  },

  notificationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  unreadCard: {
    borderColor: "#F5B82E",
    backgroundColor: "#FFFBEB",
  },

  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#081A33",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  content: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },

  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F5B82E",
    marginLeft: 8,
  },

  message: {
    fontSize: 14,
    color: "#475569",
    marginTop: 5,
    lineHeight: 20,
  },

  date: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 15,
  },

  emptyText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    textAlign: "center",
  },
});