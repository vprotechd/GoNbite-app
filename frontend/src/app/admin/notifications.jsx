import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

export default function AdminNotifications() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("system");
  const [target, setTarget] = useState("all");
  const [userId, setUserId] = useState("");
  const [sending, setSending] = useState(false);

  const sendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert(
        "Missing Information",
        "Please enter title and message."
      );
      return;
    }

    if (target === "user" && !userId.trim()) {
      Alert.alert(
        "User ID Required",
        "Please enter the user's ID."
      );
      return;
    }

    try {
      setSending(true);

      const response = await api.post(
        "/admin/notifications",
        {
          title: title.trim(),
          message: message.trim(),
          type,
          target,
          ...(target === "user"
            ? { userId: userId.trim() }
            : {}),
        }
      );

      Alert.alert(
        "Success",
        response.data?.message ||
          "Notification sent successfully."
      );

      setTitle("");
      setMessage("");
      setUserId("");
    } catch (error) {
      console.error(
        "SEND NOTIFICATION ERROR:",
        error?.response?.data || error.message
      );

      Alert.alert(
        "Error",
        error?.response?.data?.error ||
          "Failed to send notification."
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* HEADER */}

      <Text style={styles.heading}>
        Create Notification
      </Text>

      <Text style={styles.subheading}>
        Send a notification to Snaxx users
      </Text>

      {/* TITLE */}

      <Text style={styles.label}>
        Notification Title
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter notification title"
        placeholderTextColor="#94A3B8"
        value={title}
        onChangeText={setTitle}
      />

      {/* MESSAGE */}

      <Text style={styles.label}>
        Message
      </Text>

      <TextInput
        style={[
          styles.input,
          styles.messageInput,
        ]}
        placeholder="Enter notification message"
        placeholderTextColor="#94A3B8"
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
      />

      {/* TYPE */}

      <Text style={styles.label}>
        Notification Type
      </Text>

      <View style={styles.optionsRow}>
        {[
          ["system", "System"],
          ["offer", "Offer"],
          ["order", "Order"],
        ].map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.option,
              type === value &&
                styles.selectedOption,
            ]}
            onPress={() => setType(value)}
          >
            <Text
              style={[
                styles.optionText,
                type === value &&
                  styles.selectedOptionText,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TARGET */}

      <Text style={styles.label}>
        Send To
      </Text>

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={[
            styles.option,
            target === "all" &&
              styles.selectedOption,
          ]}
          onPress={() => setTarget("all")}
        >
          <Text
            style={[
              styles.optionText,
              target === "all" &&
                styles.selectedOptionText,
            ]}
          >
            All Users
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            target === "user" &&
              styles.selectedOption,
          ]}
          onPress={() => setTarget("user")}
        >
          <Text
            style={[
              styles.optionText,
              target === "user" &&
                styles.selectedOptionText,
            ]}
          >
            Specific User
          </Text>
        </TouchableOpacity>
      </View>

      {/* USER ID */}

      {target === "user" && (
        <>
          <Text style={styles.label}>
            User ID
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter user ID"
            placeholderTextColor="#94A3B8"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />
        </>
      )}

      {/* SEND */}

      <TouchableOpacity
        style={[
          styles.sendButton,
          sending && styles.disabledButton,
        ]}
        onPress={sendNotification}
        disabled={sending}
      >
        <Text style={styles.sendButtonText}>
          {sending
            ? "Sending..."
            : "SEND NOTIFICATION"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 20,
    paddingTop: 55,
    paddingBottom: 40,
  },

  heading: {
    fontSize: 28,
    fontWeight: "700",
    color: "#081A33",
  },

  subheading: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
    marginBottom: 30,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#081A33",
    marginBottom: 8,
    marginTop: 18,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: "#0F172A",
  },

  messageInput: {
    height: 120,
  },

  optionsRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },

  option: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },

  selectedOption: {
    backgroundColor: "#081A33",
    borderColor: "#F5B82E",
  },

  optionText: {
    color: "#475569",
    fontWeight: "600",
  },

  selectedOptionText: {
    color: "#F5B82E",
  },

  sendButton: {
    backgroundColor: "#F5B82E",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 35,
  },

  disabledButton: {
    opacity: 0.6,
  },

  sendButtonText: {
    color: "#081A33",
    fontSize: 15,
    fontWeight: "800",
  },
});