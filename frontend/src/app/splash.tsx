import { router } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const { width, height } = Dimensions.get("window");

export default function Index() {
  // ============================================================
  // ANIMATION VALUES
  // ============================================================

  const screenFade = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(0.75)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const foodY = useRef(new Animated.Value(height * 0.45)).current;
  const foodScale = useRef(new Animated.Value(0.85)).current;

  const taglineY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  const dots = useRef(new Animated.Value(0.3)).current;

  // ============================================================
  // START ANIMATION
  // ============================================================

  useEffect(() => {
    Animated.parallel([
      // Whole screen
      Animated.timing(screenFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Logo
      Animated.sequence([
        Animated.delay(150),

        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.spring(logoScale, {
            toValue: 1,
            friction: 5,
            tension: 70,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Tagline
      Animated.sequence([
        Animated.delay(350),

        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),

          Animated.timing(taglineY, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Food comes from bottom
      Animated.parallel([
        Animated.spring(foodY, {
          toValue: 0,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),

        Animated.spring(foodScale, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ============================================================
    // LOADING DOT ANIMATION
    // ============================================================

    Animated.loop(
      Animated.sequence([
        Animated.timing(dots, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),

        Animated.timing(dots, {
          toValue: 0.3,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ============================================================
    // OPEN REGISTER AFTER 2 SECONDS
    // ============================================================

    const timer = setTimeout(() => {
      router.replace("/(auth)/register");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ========================================================
          BACKGROUND
      ======================================================== */}

      <View style={styles.background} />

      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      {/* ========================================================
          DECORATIVE CIRCLES
      ======================================================== */}

      <View style={styles.circleLarge} />
      <View style={styles.circleSmall} />

      {/* ========================================================
          MAIN CONTENT
      ======================================================== */}

      <Animated.View
        style={[
          styles.main,
          {
            opacity: screenFade,
          },
        ]}
      >
        {/* ======================================================
            LOGO
        ====================================================== */}

        <Animated.View
          style={[
            styles.brandContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/Logo.png")}
            style={styles.logo}
          />
        </Animated.View>

        {/* ======================================================
            TAGLINE
        ====================================================== */}

        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineY }],
          }}
        >
          <Text style={styles.tagline}>
            Hungry? Just Snacc.
          </Text>

          <Text style={styles.subTagline}>
            Your cravings are on the way
          </Text>
        </Animated.View>

        {/* ======================================================
            FOOD SECTION
        ====================================================== */}

        <Animated.View
          style={[
            styles.foodSection,
            {
              transform: [
                { translateY: foodY },
                { scale: foodScale },
              ],
            },
          ]}
        >
          {/* FOOD IMAGE */}

          <Image
            source={require("../../assets/images/food1.png")}
            style={styles.foodImage}
          />

          {/* DARK BOTTOM OVERLAY */}

          <View style={styles.foodOverlay} />

          {/* DELIVERY LABEL */}

          <View style={styles.deliveryBadge}>
            <View style={styles.liveDot} />

            <Text style={styles.deliveryBadgeText}>
              Delivering happiness
            </Text>
          </View>
        </Animated.View>

        {/* ======================================================
            BOTTOM LOADING
        ====================================================== */}

        <View style={styles.bottom}>
          <Text style={styles.loadingText}>
            Getting your food ready
          </Text>

          <Animated.View
            style={[
              styles.dotsContainer,
              {
                opacity: dots,
              },
            ]}
          >
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

// ================================================================
// STYLES
// ================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#081A33",
    overflow: "hidden",
  },

  background: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#081A33",
  },

  // ==============================================================
  // GLOW
  // ==============================================================

  topGlow: {
    position: "absolute",
    width: width * 1.25,
    height: width * 1.25,
    borderRadius: width,
    backgroundColor: "#FF8500",
    opacity: 0.09,
    top: -width * 0.85,
    left: -width * 0.1,
  },

  bottomGlow: {
    position: "absolute",
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width,
    backgroundColor: "#FF8500",
    opacity: 0.12,
    bottom: -width * 1.05,
    left: -width * 0.25,
  },

  // ==============================================================
  // DECORATIVE CIRCLES
  // ==============================================================

  circleLarge: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    borderWidth: 1,
    borderColor: "rgba(255,133,0,0.08)",
    top: height * 0.27,
    left: -width * 0.6,
  },

  circleSmall: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    top: height * 0.19,
    right: -45,
  },

  // ==============================================================
  // MAIN
  // ==============================================================

  main: {
    flex: 1,
    alignItems: "center",
  },

  // ==============================================================
  // BRAND
  // ==============================================================

  brandContainer: {
    marginTop: height * 0.13,
    width: width * 0.62,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // ==============================================================
  // TEXT
  // ==============================================================

  tagline: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.1,
  },

  subTagline: {
    textAlign: "center",
    marginTop: 5,
    color: "#B8C4D4",
    fontSize: 11,
    fontWeight: "500",
  },

  // ==============================================================
  // FOOD
  // ==============================================================

  foodSection: {
    position: "absolute",
    width: width * 1.15,
    height: height * 0.49,
    bottom: height * 0.115,
    left: -width * 0.075,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderTopLeftRadius: width * 0.18,
    borderTopRightRadius: width * 0.18,
  },

  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  foodOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "35%",
    backgroundColor: "rgba(8,26,51,0.35)",
  },

  // ==============================================================
  // DELIVERY BADGE
  // ==============================================================

  deliveryBadge: {
    position: "absolute",
    left: width * 0.09,
    bottom: height * 0.055,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(8,26,51,0.82)",
    flexDirection: "row",
    alignItems: "center",
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF8500",
    marginRight: 7,
  },

  deliveryBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // ==============================================================
  // BOTTOM
  // ==============================================================

  bottom: {
    position: "absolute",
    bottom: height * 0.045,
    alignItems: "center",
  },

  loadingText: {
    color: "#AEBBCD",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  dotsContainer: {
    flexDirection: "row",
    marginTop: 8,
    alignItems: "center",
  },

  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FF8500",
    marginHorizontal: 3,
  },
});