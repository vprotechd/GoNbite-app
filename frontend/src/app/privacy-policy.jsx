import { Ionicons } from "@expo/vector-icons";
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

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#081A33"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Privacy Policy
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          <View style={styles.introCard}>
            <View style={styles.iconBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color="#F5B82E"
              />
            </View>

            <Text style={styles.introTitle}>
              Your privacy matters
            </Text>

            <Text style={styles.introText}>
              SNAX respects your privacy and is committed to
              protecting your personal information.
            </Text>

            <Text style={styles.updated}>
              Last updated: August 2026
            </Text>
          </View>

          <PolicySection
            title="1. Information We Collect"
            text="SNAX may collect information that you provide when creating an account, managing your profile, placing food orders, contacting support, or using features of the application."
          />

          <PolicySection
            title="2. How We Use Your Information"
            text="Your information is used to manage your account, process and track orders, provide customer support, improve application features, personalize your experience, and maintain the security of our services."
          />

          <PolicySection
            title="3. Location Information"
            text="If location access is enabled, SNAX may use your location to help identify nearby restaurants and improve delivery-related services."
          />

          <PolicySection
            title="4. Order Information"
            text="Information related to your orders may be stored so that you can view order history, track orders, receive updates, and get assistance when required."
          />

          <PolicySection
            title="5. Personalized Recommendations"
            text="SNAX may use your activity and preferences to provide more relevant restaurant and food recommendations. You can manage personalized recommendation preferences from Privacy & Security settings."
          />

          <PolicySection
            title="6. Account Security"
            text="We take reasonable measures to protect your account information from unauthorized access, alteration, disclosure, or misuse."
          />

          <PolicySection
            title="7. Information Sharing"
            text="Your information may be shared when necessary to provide requested services, process orders, provide customer support, comply with applicable laws, or protect the security of SNAX and its users."
          />

          <PolicySection
            title="8. Your Choices"
            text="You can manage certain privacy and security preferences through your account settings. You may also request changes to or deletion of your account information where applicable."
          />

          <PolicySection
            title="9. Data Protection"
            text="SNAX aims to keep your information secure and uses appropriate safeguards to help protect personal information."
          />

          <PolicySection
            title="10. Contact"
            text="If you have questions or concerns about this Privacy Policy or how your information is handled, please contact the SNAX support team."
          />

          <Text style={styles.footer}>
            SNAX • Version 1.0.0
          </Text>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function PolicySection({ title, text }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      <Text style={styles.sectionText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#081A33",
  },

  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E6EB",
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#081A33",
  },

  headerSpacer: {
    width: 30,
  },

  content: {
    padding: 12,
    paddingBottom: 30,
  },

  introCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },

  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#081A33",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  introTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#081A33",
  },

  introText: {
    fontSize: 9,
    lineHeight: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 5,
  },

  updated: {
    fontSize: 8,
    color: "#94A3B8",
    marginTop: 8,
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    padding: 13,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#081A33",
    marginBottom: 6,
  },

  sectionText: {
    fontSize: 9,
    lineHeight: 15,
    color: "#64748B",
  },

  footer: {
    textAlign: "center",
    fontSize: 9,
    color: "#94A3B8",
    marginTop: 5,
  },
});