
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../context/ThemeContext";

export default function HelpSupportScreen() {
  const { darkMode, theme, language } = useTheme();

  const isHindi = language === "Hindi";

  const t = isHindi
    ? {
        title: "मदद और सहायता",
        intro: "हम आपकी सहायता के लिए यहां हैं",
        common: "सामान्य सहायता",
        order: "ऑर्डर से संबंधित समस्या",
        orderSub: "अपने ऑर्डर, डिलीवरी या स्टेटस में मदद पाएं",
        account: "अकाउंट से संबंधित समस्या",
        accountSub: "लॉगिन, प्रोफ़ाइल या अकाउंट सेटिंग में मदद",
        restaurant: "रेस्टोरेंट से संबंधित समस्या",
        restaurantSub: "रेस्टोरेंट, मेन्यू या आइटम से जुड़ी सहायता",
        refund: "रिफंड और कैंसलेशन",
        refundSub: "कैंसिलेशन और रिफंड से संबंधित जानकारी",
        contact: "हमसे संपर्क करें",
        contactSub: "SNAX सपोर्ट टीम से बात करें",
        email: "ईमेल सपोर्ट",
        emailSub: "support@snax.com",
        faq: "अक्सर पूछे जाने वाले सवाल",
        faq1: "मैं अपना ऑर्डर कैसे ट्रैक करूं?",
        faq1Answer:
          "Orders सेक्शन में जाकर अपने ऑर्डर का वर्तमान स्टेटस देखें।",
        faq2: "मैं ऑर्डर कैंसिल कैसे करूं?",
        faq2Answer:
          "Orders सेक्शन में अपना ऑर्डर खोलें और उपलब्ध होने पर Cancel Order विकल्प चुनें।",
        faq3: "मैं SNAX से कैसे संपर्क करूं?",
        faq3Answer:
          "आप support@snax.com पर ईमेल करके हमारी सपोर्ट टीम से संपर्क कर सकते हैं।",
      }
    : {
        title: "Help & Support",
        intro: "We're here to help you",
        common: "COMMON HELP",
        order: "Order Related Issue",
        orderSub: "Get help with your order, delivery or status",
        account: "Account Related Issue",
        accountSub: "Get help with login, profile or account settings",
        restaurant: "Restaurant Related Issue",
        restaurantSub: "Help with restaurants, menus or food items",
        refund: "Refund & Cancellation",
        refundSub: "Information about cancellations and refunds",
        contact: "Contact Us",
        contactSub: "Talk to the SNAX support team",
        email: "Email Support",
        emailSub: "support@snax.com",
        faq: "FREQUENTLY ASKED QUESTIONS",
        faq1: "How can I track my order?",
        faq1Answer:
          "Go to the Orders section to check the current status of your order.",
        faq2: "How can I cancel my order?",
        faq2Answer:
          "Open your order from the Orders section and select Cancel Order if available.",
        faq3: "How can I contact SNAX?",
        faq3Answer:
          "You can contact our support team by emailing support@snax.com.",
      };

  const showFAQ = (question, answer) => {
    Alert.alert(question, answer, [
      {
        text: isHindi ? "बंद करें" : "Close",
      },
    ]);
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.safeArea,
        },
      ]}
    >
      <StatusBar
        barStyle={darkMode ? "light-content" : "dark-content"}
        backgroundColor={theme.statusBar}
      />

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.background,
          },
        ]}
      >
        {/* HEADER */}

        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.border,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={theme.primary}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.primary,
              },
            ]}
          >
            {t.title}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* INTRO */}

          <View
            style={[
              styles.introCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <View
              style={[
                styles.introIcon,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name="help-circle-outline"
                size={28}
                color="#F5B82E"
              />
            </View>

            <Text
              style={[
                styles.introTitle,
                {
                  color: theme.primary,
                },
              ]}
            >
              {t.intro}
            </Text>
          </View>

          {/* COMMON HELP */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.common}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <HelpItem
              icon="receipt-outline"
              title={t.order}
              subtitle={t.orderSub}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <HelpItem
              icon="person-outline"
              title={t.account}
              subtitle={t.accountSub}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <HelpItem
              icon="restaurant-outline"
              title={t.restaurant}
              subtitle={t.restaurantSub}
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <HelpItem
              icon="refresh-outline"
              title={t.refund}
              subtitle={t.refundSub}
              theme={theme}
            />
          </View>

          {/* CONTACT */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.contact}
          </Text>

          <TouchableOpacity
            style={[
              styles.contactCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                t.email,
                t.emailSub
              )
            }
          >
            <View
              style={[
                styles.contactIcon,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={19}
                color="#F5B82E"
              />
            </View>

            <View style={styles.contactText}>
              <Text
                style={[
                  styles.itemTitle,
                  {
                    color: theme.primary,
                  },
                ]}
              >
                {t.email}
              </Text>

              <Text
                style={[
                  styles.itemSubtitle,
                  {
                    color: theme.secondaryText,
                  },
                ]}
              >
                {t.emailSub}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={theme.chevron}
            />
          </TouchableOpacity>

          {/* FAQ */}

          <Text
            style={[
              styles.sectionTitle,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.faq}
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <FAQItem
              question={t.faq1}
              onPress={() =>
                showFAQ(t.faq1, t.faq1Answer)
              }
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <FAQItem
              question={t.faq2}
              onPress={() =>
                showFAQ(t.faq2, t.faq2Answer)
              }
              theme={theme}
            />

            <View
              style={[
                styles.divider,
                {
                  backgroundColor: theme.divider,
                },
              ]}
            />

            <FAQItem
              question={t.faq3}
              onPress={() =>
                showFAQ(t.faq3, t.faq3Answer)
              }
              theme={theme}
            />
          </View>

          <Text
            style={[
              styles.footer,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            SNAX • Version 1.0.0
          </Text>

          <View style={{ height: 20 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// HELP ITEM
// ============================================================

function HelpItem({
  icon,
  title,
  subtitle,
  theme,
}) {
  return (
    <TouchableOpacity
      style={styles.itemRow}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: theme.primary,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={18}
          color="#F5B82E"
        />
      </View>

      <View style={styles.itemText}>
        <Text
          style={[
            styles.itemTitle,
            {
              color: theme.primary,
            },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.itemSubtitle,
            {
              color: theme.secondaryText,
            },
          ]}
        >
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={theme.chevron}
      />
    </TouchableOpacity>
  );
}

// ============================================================
// FAQ ITEM
// ============================================================

function FAQItem({
  question,
  onPress,
  theme,
}) {
  return (
    <TouchableOpacity
      style={styles.faqRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.faqQuestion,
          {
            color: theme.primary,
          },
        ]}
      >
        {question}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={17}
        color={theme.chevron}
      />
    </TouchableOpacity>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },

  backButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 30,
  },

  content: {
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 25,
  },

  introCard: {
    minHeight: 82,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  introTitle: {
    fontSize: 13,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
    marginTop: 8,
    marginLeft: 3,
    letterSpacing: 0.5,
  },

  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
  },

  itemRow: {
    minHeight: 63,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 8,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  itemText: {
    flex: 1,
    marginRight: 8,
  },

  itemTitle: {
    fontSize: 12,
    fontWeight: "700",
  },

  itemSubtitle: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 3,
  },

  divider: {
    height: 1,
    marginLeft: 57,
  },

  contactCard: {
    minHeight: 63,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    marginBottom: 12,
  },

  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  contactText: {
    flex: 1,
  },

  faqRow: {
    minHeight: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 13,
  },

  faqQuestion: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },

  footer: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 5,
  },
});

