
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

import { useTheme } from "../context/ThemeContext";

export default function TermsConditionsScreen() {
  const { darkMode, theme, language } = useTheme();

  const isHindi = language === "Hindi";

  const t = isHindi
    ? {
        title: "नियम और शर्तें",
        lastUpdated: "अंतिम अपडेट: 19 अगस्त 2026",

        intro:
          "SNAX का उपयोग करके आप नीचे दी गई नियम और शर्तों से सहमत होते हैं। कृपया ऐप का उपयोग करने से पहले इन्हें ध्यान से पढ़ें।",

        accountTitle: "1. अकाउंट",
        accountText:
          "SNAX की कुछ सुविधाओं का उपयोग करने के लिए आपको अकाउंट बनाना पड़ सकता है। आपको अपने अकाउंट की जानकारी सही और अपडेटेड रखनी होगी और अपने अकाउंट की सुरक्षा के लिए आप स्वयं जिम्मेदार होंगे।",

        ordersTitle: "2. ऑर्डर और डिलीवरी",
        ordersText:
          "ऑर्डर देते समय सही जानकारी प्रदान करना आपकी जिम्मेदारी है। डिलीवरी का समय रेस्टोरेंट की तैयारी, उपलब्धता, ट्रैफिक और अन्य परिस्थितियों के आधार पर बदल सकता है।",

        cancellationTitle: "3. कैंसलेशन",
        cancellationText:
          "ऑर्डर कैंसिलेशन उपलब्धता और ऑर्डर की स्थिति पर निर्भर करता है। कुछ ऑर्डर तैयार होने के बाद कैंसिल नहीं किए जा सकते।",

        restaurantTitle: "4. रेस्टोरेंट और मेन्यू",
        restaurantText:
          "रेस्टोरेंट अपने मेन्यू, कीमतों और उपलब्धता की जानकारी प्रदान करते हैं। किसी आइटम की उपलब्धता या कीमत बदल सकती है।",

        paymentsTitle: "5. भुगतान",
        paymentsText:
          "यदि ऐप में ऑनलाइन भुगतान सुविधा उपलब्ध है, तो भुगतान संबंधित तृतीय-पक्ष भुगतान सेवा के नियमों के अनुसार संसाधित किया जाएगा।",

        privacyTitle: "6. प्राइवेसी",
        privacyText:
          "आपकी व्यक्तिगत जानकारी का उपयोग हमारी Privacy Policy के अनुसार किया जाएगा। हम आपकी जानकारी को सुरक्षित रखने के लिए उचित उपाय अपनाते हैं।",

        prohibitedTitle: "7. प्रतिबंधित उपयोग",
        prohibitedText:
          "आप SNAX का उपयोग किसी अवैध गतिविधि, धोखाधड़ी, गलत जानकारी देने या ऐप की सुरक्षा को नुकसान पहुंचाने के लिए नहीं कर सकते।",

        liabilityTitle: "8. जिम्मेदारी",
        liabilityText:
          "SNAX प्लेटफॉर्म को सुविधाजनक और विश्वसनीय बनाने का प्रयास करता है, लेकिन रेस्टोरेंट द्वारा प्रदान की गई सेवाओं, भोजन की गुणवत्ता या डिलीवरी में होने वाली देरी के लिए जिम्मेदारी संबंधित सेवा प्रदाता की हो सकती है।",

        changesTitle: "9. नियमों में बदलाव",
        changesText:
          "SNAX समय-समय पर इन नियम और शर्तों को अपडेट कर सकता है। बदलाव के बाद ऐप का उपयोग जारी रखने का अर्थ है कि आप अपडेटेड नियमों से सहमत हैं।",

        contactTitle: "10. संपर्क करें",
        contactText:
          "नियम और शर्तों से संबंधित किसी प्रश्न के लिए हमसे संपर्क करें:",

        email: "support@snax.com",

        acceptanceTitle: "स्वीकृति",
        acceptanceText:
          "SNAX का उपयोग जारी रखकर आप इन नियम और शर्तों को स्वीकार करते हैं।",
      }
    : {
        title: "Terms & Conditions",
        lastUpdated: "Last Updated: August 19, 2026",

        intro:
          "By using SNAX, you agree to the Terms & Conditions below. Please read them carefully before using the app.",

        accountTitle: "1. Account",
        accountText:
          "You may need to create an account to use certain SNAX features. You are responsible for providing accurate information and keeping your account information updated and secure.",

        ordersTitle: "2. Orders & Delivery",
        ordersText:
          "You are responsible for providing accurate information when placing an order. Delivery times may vary depending on restaurant preparation, availability, traffic, and other circumstances.",

        cancellationTitle: "3. Cancellation",
        cancellationText:
          "Order cancellation depends on availability and the current status of the order. Some orders may not be cancellable after preparation has started.",

        restaurantTitle: "4. Restaurants & Menu",
        restaurantText:
          "Restaurants provide their own menu, pricing, and availability information. Item availability and prices may change from time to time.",

        paymentsTitle: "5. Payments",
        paymentsText:
          "If online payment is available in the app, payments will be processed according to the terms and policies of the applicable third-party payment service.",

        privacyTitle: "6. Privacy",
        privacyText:
          "Your personal information will be handled according to our Privacy Policy. We take reasonable measures to protect your information.",

        prohibitedTitle: "7. Prohibited Use",
        prohibitedText:
          "You may not use SNAX for illegal activities, fraud, providing false information, or attempting to damage or compromise the security of the app.",

        liabilityTitle: "8. Responsibility",
        liabilityText:
          "SNAX aims to provide a reliable platform, but responsibility for restaurant services, food quality, or delivery delays may belong to the respective service provider.",

        changesTitle: "9. Changes to Terms",
        changesText:
          "SNAX may update these Terms & Conditions from time to time. Continued use of the app after changes means you accept the updated terms.",

        contactTitle: "10. Contact Us",
        contactText:
          "For questions regarding these Terms & Conditions, contact us at:",

        email: "support@snax.com",

        acceptanceTitle: "Acceptance",
        acceptanceText:
          "By continuing to use SNAX, you acknowledge and agree to these Terms & Conditions.",
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

        {/* CONTENT */}

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
                styles.iconBox,
                {
                  backgroundColor: theme.primary,
                },
              ]}
            >
              <Ionicons
                name="document-text-outline"
                size={25}
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
              {t.title}
            </Text>

            <Text
              style={[
                styles.updatedText,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              {t.lastUpdated}
            </Text>
          </View>

          {/* INTRODUCTION */}

          <Text
            style={[
              styles.introText,
              {
                color: theme.secondaryText,
              },
            ]}
          >
            {t.intro}
          </Text>

          {/* TERMS */}

          <TermsSection
            title={t.accountTitle}
            text={t.accountText}
            theme={theme}
          />

          <TermsSection
            title={t.ordersTitle}
            text={t.ordersText}
            theme={theme}
          />

          <TermsSection
            title={t.cancellationTitle}
            text={t.cancellationText}
            theme={theme}
          />

          <TermsSection
            title={t.restaurantTitle}
            text={t.restaurantText}
            theme={theme}
          />

          <TermsSection
            title={t.paymentsTitle}
            text={t.paymentsText}
            theme={theme}
          />

          <TermsSection
            title={t.privacyTitle}
            text={t.privacyText}
            theme={theme}
          />

          <TermsSection
            title={t.prohibitedTitle}
            text={t.prohibitedText}
            theme={theme}
          />

          <TermsSection
            title={t.liabilityTitle}
            text={t.liabilityText}
            theme={theme}
          />

          <TermsSection
            title={t.changesTitle}
            text={t.changesText}
            theme={theme}
          />

          {/* CONTACT */}

          <View
            style={[
              styles.contactCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.primary,
                },
              ]}
            >
              {t.contactTitle}
            </Text>

            <Text
              style={[
                styles.bodyText,
                {
                  color: theme.secondaryText,
                },
              ]}
            >
              {t.contactText}
            </Text>

            <View style={styles.emailRow}>
              <Ionicons
                name="mail-outline"
                size={17}
                color="#F5B82E"
              />

              <Text
                style={[
                  styles.emailText,
                  {
                    color: theme.primary,
                  },
                ]}
              >
                {t.email}
              </Text>
            </View>
          </View>

          {/* ACCEPTANCE */}

          <View
            style={[
              styles.acceptanceCard,
              {
                backgroundColor: theme.primary,
              },
            ]}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color="#F5B82E"
            />

            <View style={styles.acceptanceContent}>
              <Text
                style={[
                  styles.acceptanceTitle,
                  {
                    color: "#FFFFFF",
                  },
                ]}
              >
                {t.acceptanceTitle}
              </Text>

              <Text
                style={[
                  styles.acceptanceText,
                  {
                    color: "#D1D5DB",
                  },
                ]}
              >
                {t.acceptanceText}
              </Text>
            </View>
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
// TERMS SECTION
// ============================================================

function TermsSection({ title, text, theme }) {
  return (
    <View
      style={[
        styles.section,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
    >
      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.primary,
          },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.bodyText,
          {
            color: theme.secondaryText,
          },
        ]}
      >
        {text}
      </Text>
    </View>
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
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 17,
    paddingHorizontal: 15,
    marginBottom: 12,
  },

  iconBox: {
    width: 43,
    height: 43,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },

  introTitle: {
    fontSize: 15,
    fontWeight: "800",
  },

  updatedText: {
    fontSize: 9,
    marginTop: 4,
  },

  introText: {
    fontSize: 10,
    lineHeight: 15,
    marginHorizontal: 3,
    marginBottom: 10,
  },

  section: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
  },

  bodyText: {
    fontSize: 9.5,
    lineHeight: 15,
  },

  contactCard: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginTop: 2,
    marginBottom: 10,
  },

  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 9,
    gap: 7,
  },

  emailText: {
    fontSize: 10,
    fontWeight: "700",
  },

  acceptanceCard: {
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },

  acceptanceContent: {
    flex: 1,
    marginLeft: 9,
  },

  acceptanceTitle: {
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 4,
  },

  acceptanceText: {
    fontSize: 9,
    lineHeight: 14,
  },

  footer: {
    textAlign: "center",
    fontSize: 8,
    marginTop: 3,
  },
});

