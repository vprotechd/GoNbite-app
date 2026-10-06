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
  // ANIMATIONS
  // ============================================================

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const logoScale = useRef(new Animated.Value(0.7)).current;

  const foodTranslateY = useRef(
    new Animated.Value(height * 0.35)
  ).current;

  const foodScale = useRef(new Animated.Value(0.75)).current;

  const riderTranslateX = useRef(
    new Animated.Value(width * 0.65)
  ).current;

  const riderRotate = useRef(
    new Animated.Value(0)
  ).current;

  const dotsOpacity = useRef(
    new Animated.Value(0.3)
  ).current;

  useEffect(() => {
    // ============================================================
    // MAIN INTRO ANIMATION
    // ============================================================

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),

      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,
      }),

      Animated.spring(foodTranslateY, {
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

      Animated.timing(riderTranslateX, {
        toValue: 0,
        duration: 1200,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // ============================================================
    // RIDER SMALL MOVEMENT
    // ============================================================

    Animated.loop(
      Animated.sequence([
        Animated.timing(riderRotate, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),

        Animated.timing(riderRotate, {
          toValue: -1,
          duration: 450,
          useNativeDriver: true,
        }),

        Animated.timing(riderRotate, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ============================================================
    // LOADING DOTS
    // ============================================================

    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),

        Animated.timing(dotsOpacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // ============================================================
    // GO TO REGISTER AFTER 2 SECONDS
    // ============================================================

    const timer = setTimeout(() => {
      router.replace("/(auth)/register");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const riderRotation = riderRotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-3deg", "0deg", "3deg"],
  });

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      {/* ============================================================
          BACKGROUND
      ============================================================ */}

      <View style={styles.background} />

      <View style={styles.orangeGlowTop} />
      <View style={styles.orangeGlowBottom} />

      {/* ============================================================
          DECORATIVE CIRCLES
      ============================================================ */}

      <View style={styles.circleOne} />
      <View style={styles.circleTwo} />
      <View style={styles.circleThree} />

      {/* ============================================================
          MAIN CONTENT
      ============================================================ */}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* ========================================================
            LOGO
        ======================================================== */}

        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require("../../assets/images/Logo.png")}
            style={styles.logo}
          />
        </Animated.View>

        {/* ========================================================
            TAGLINE
        ======================================================== */}

        <Text style={styles.tagline}>
          Hungry? Just Snacc.
        </Text>

        <Text style={styles.subTagline}>
          Delicious food. Delivered fast.
        </Text>

        {/* ========================================================
            FOOD AREA
        ======================================================== */}

        <Animated.View
          style={[
            styles.foodArea,
            {
              transform: [
                { translateY: foodTranslateY },
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

          {/* ======================================================
              RIDER
          ====================================================== */}

          <Animated.View
            style={[
              styles.riderContainer,
              {
                transform: [
                  { translateX: riderTranslateX },
                  { rotate: riderRotation },
                ],
              },
            ]}
          >
            <Image
              source={require("../../assets/images/rider.png")}
              style={styles.riderImage}
            />
          </Animated.View>

          {/* ======================================================
              SMALL FLOATING DOTS
          ====================================================== */}

          <Animated.View
            style={[
              styles.foodDot,
              styles.dotOne,
              {
                opacity: dotsOpacity,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.foodDot,
              styles.dotTwo,
              {
                opacity: dotsOpacity,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.foodDot,
              styles.dotThree,
              {
                opacity: dotsOpacity,
              },
            ]}
          />
        </Animated.View>

        {/* ========================================================
            BOTTOM
        ======================================================== */}

        <View style={styles.bottomArea}>
          <Text style={styles.deliveryText}>
            Preparing your cravings...
          </Text>

          <View style={styles.loadingDots}>
            <Animated.View
              style={[
                styles.loadingDot,
                {
                  opacity: dotsOpacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.loadingDot,
                styles.middleDot,
                {
                  opacity: dotsOpacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.loadingDot,
                {
                  opacity: dotsOpacity,
                },
              ]}
            />
          </View>
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
    overflow: "hidden",
  },

  // ==============================================================
  // BACKGROUND
  // ==============================================================

  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#081A33",
  },

  orangeGlowTop: {
    position: "absolute",
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width,
    backgroundColor: "#FF8500",
    opacity: 0.13,
    top: -width * 0.75,
    left: -width * 0.1,
  },

  orangeGlowBottom: {
    position: "absolute",
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width,
    backgroundColor: "#FF8500",
    opacity: 0.08,
    bottom: -width * 0.95,
    right: -width * 0.35,
  },

  // ==============================================================
  // DECORATIVE CIRCLES
  // ==============================================================

  circleOne: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: "rgba(255,133,0,0.12)",
    top: height * 0.16,
    left: -95,
  },

  circleTwo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    top: height * 0.25,
    right: -65,
  },

  circleThree: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    borderColor: "rgba(255,133,0,0.08)",
    bottom: -110,
    left: -100,
  },

  // ==============================================================
  // CONTENT
  // ==============================================================

  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: height * 0.12,
  },

  // ==============================================================
  // LOGO
  // ==============================================================

  logoContainer: {
    width: width * 0.48,
    height: 75,
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
    marginTop: 6,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  subTagline: {
    marginTop: 5,
    color: "#C7D1DF",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.4,
  },

  // ==============================================================
  // FOOD
  // ==============================================================

  foodArea: {
    width: width * 0.98,
    height: height * 0.48,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  foodImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // ==============================================================
  // RIDER
  // ==============================================================

  riderContainer: {
    position: "absolute",
    width: width * 0.36,
    height: height * 0.20,
    right: width * 0.02,
    bottom: height * 0.015,
    alignItems: "center",
    justifyContent: "center",
  },

  riderImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },

  // ==============================================================
  // FOOD DECORATION
  // ==============================================================

  foodDot: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FF8500",
  },

  dotOne: {
    left: width * 0.12,
    top: height * 0.12,
  },

  dotTwo: {
    right: width * 0.15,
    top: height * 0.08,
  },

  dotThree: {
    left: width * 0.2,
    bottom: height * 0.08,
  },

  // ==============================================================
  // BOTTOM
  // ==============================================================

  bottomArea: {
    position: "absolute",
    bottom: height * 0.07,
    alignItems: "center",
  },

  deliveryText: {
    color: "#AEBBCB",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  loadingDots: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF8500",
  },

  middleDot: {
    marginHorizontal: 5,
  },
});