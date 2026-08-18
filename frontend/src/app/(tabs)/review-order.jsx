import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import api from "../../services/api";

export default function ReviewOrderScreen() {
  const params = useLocalSearchParams();

  const orderId = Array.isArray(params.orderId)
    ? params.orderId[0]
    : params.orderId;

  const restaurantId = Array.isArray(params.restaurantId)
    ? params.restaurantId[0]
    : params.restaurantId;

  const restaurantName =
    (Array.isArray(params.restaurantName)
      ? params.restaurantName[0]
      : params.restaurantName) || "Restaurant";

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW
  const [checkingReview, setCheckingReview] = useState(true);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // =====================================================
  // CHECK WHETHER ORDER IS ALREADY REVIEWED
  // =====================================================

  useEffect(() => {
    if (!orderId) {
      setCheckingReview(false);
      return;
    }

    checkExistingReview();
  }, [orderId]);

  const checkExistingReview = async () => {
    try {
      setCheckingReview(true);

      console.log("Checking existing review:", orderId);

      const response = await api.get(
        `/reviews/order/${orderId}`
      );

      console.log(
        "Review check response:",
        response?.data
      );

      if (response?.data?.reviewed === true) {
        console.log("User already reviewed this order.");

        setAlreadyReviewed(true);

        Alert.alert(
          "Already Reviewed",
          "You have already reviewed this order.",
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ],
          {
            cancelable: false,
          }
        );
      } else {
        setAlreadyReviewed(false);
      }
    } catch (error) {
      console.error(
        "Check existing review error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      /*
       * If the check fails, don't assume that the order
       * has already been reviewed.
       *
       * The backend will still protect against duplicate
       * reviews during submission.
       */
    } finally {
      setCheckingReview(false);
    }
  };

  // =====================================================
  // SELECT IMAGE
  // =====================================================

  const pickImage = async () => {
    if (isSubmitting || alreadyReviewed) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission Required",
          "Please allow photo library access to upload a picture."
        );
        return;
      }

      const result =
        await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        });

      if (
        !result.canceled &&
        result.assets?.length > 0
      ) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);

      Alert.alert(
        "Error",
        "Unable to select the picture. Please try again."
      );
    }
  };

  // =====================================================
  // REMOVE IMAGE
  // =====================================================

  const removeImage = () => {
    if (isSubmitting || alreadyReviewed) return;

    setImage(null);
  };

  // =====================================================
  // GET MIME TYPE
  // =====================================================

  const getMimeType = (uri) => {
    const extension = uri
      .split("?")[0]
      .split(".")
      .pop()
      ?.toLowerCase();

    switch (extension) {
      case "png":
        return "image/png";

      case "webp":
        return "image/webp";

      case "jpg":
      case "jpeg":
      default:
        return "image/jpeg";
    }
  };

  // =====================================================
  // GET FILE NAME
  // =====================================================

  const getFileName = (uri) => {
    const cleanUri = uri.split("?")[0];

    const fileName = cleanUri.split("/").pop();

    if (
      fileName &&
      fileName.includes(".")
    ) {
      return fileName;
    }

    return `review-${Date.now()}.jpg`;
  };

  // =====================================================
  // SUBMIT REVIEW
  // =====================================================

  const submitReview = async () => {
    if (isSubmitting) return;

    // IMPORTANT
    if (alreadyReviewed) {
      Alert.alert(
        "Already Reviewed",
        "You have already reviewed this order.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ]
      );

      return;
    }

    if (checkingReview) {
      return;
    }

    if (!orderId) {
      Alert.alert(
        "Error",
        "Order information is missing. Please open the review from your order history."
      );
      return;
    }

    if (rating < 1 || rating > 5) {
      Alert.alert(
        "Rating Required",
        "Please select a rating from 1 to 5 stars."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();

      formData.append(
        "orderId",
        String(orderId)
      );

      formData.append(
        "rating",
        String(rating)
      );

      formData.append(
        "comment",
        comment.trim()
      );

      if (restaurantId) {
        formData.append(
          "restaurantId",
          String(restaurantId)
        );
      }

      // =================================================
      // IMAGE
      // =================================================

      if (image) {
        const fileName = getFileName(image);
        const mimeType = getMimeType(image);

        formData.append("image", {
          uri: image,
          name: fileName,
          type: mimeType,
        });
      }

      console.log(
        "Submitting review:",
        {
          orderId: String(orderId),
          restaurantId: restaurantId
            ? String(restaurantId)
            : null,
          rating,
          comment: comment.trim(),
          hasImage: !!image,
        }
      );

      const response = await api.post(
        "/reviews/create",
        formData
      );

      console.log(
        "Review response:",
        response?.data
      );

      Alert.alert(
        "Review Submitted",
        "Thank you! Your review has been submitted successfully.",
        [
          {
            text: "OK",
            onPress: () => {
              router.back();
            },
          },
        ],
        {
          cancelable: false,
        }
      );
    } catch (error) {
      console.error(
        "Submit review error:",
        error?.response?.data ||
          error?.message ||
          error
      );

      const serverError =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "";

      // =================================================
      // ALREADY REVIEWED
      // =================================================

      if (
        serverError
          .toLowerCase()
          .includes("already reviewed")
      ) {
        setAlreadyReviewed(true);

        Alert.alert(
          "Already Reviewed",
          "You have already reviewed this order.",
          [
            {
              text: "OK",
              onPress: () => {
                router.back();
              },
            },
          ],
          {
            cancelable: false,
          }
        );

        return;
      }

      // =================================================
      // ORDER NOT DELIVERED
      // =================================================

      if (
        serverError
          .toLowerCase()
          .includes("delivered")
      ) {
        Alert.alert(
          "Review Not Available",
          "You can review this order only after it has been delivered."
        );

        return;
      }

      // =================================================
      // DEFAULT ERROR
      // =================================================

      Alert.alert(
        "Unable to Submit",
        serverError ||
          "Failed to submit your review. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // =====================================================
  // RATING TEXT
  // =====================================================

  const getRatingText = () => {
    switch (rating) {
      case 1:
        return "Very Poor";

      case 2:
        return "Poor";

      case 3:
        return "Average";

      case 4:
        return "Good";

      case 5:
        return "Excellent";

      default:
        return "Tap a star to rate";
    }
  };

  // =====================================================
  // CHECKING SCREEN
  // =====================================================

  if (checkingReview) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Write a Review
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.checkingContainer}>
          <ActivityIndicator
            size="large"
            color="#F5B82E"
          />

          <Text style={styles.checkingText}>
            Checking review status...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // ALREADY REVIEWED SCREEN
  // =====================================================

  if (alreadyReviewed) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#081A33"
        />

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Review
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.alreadyReviewedContainer}>
          <View style={styles.reviewedIcon}>
            <Ionicons
              name="checkmark-circle"
              size={70}
              color="#22C55E"
            />
          </View>

          <Text style={styles.alreadyReviewedTitle}>
            Already Reviewed
          </Text>

          <Text style={styles.alreadyReviewedMessage}>
            You have already reviewed this order.
          </Text>

          <TouchableOpacity
            style={styles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={styles.goBackButtonText}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =====================================================
  // RENDER REVIEW FORM
  // =====================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#081A33"
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          disabled={isSubmitting}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Write a Review
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* RESTAURANT */}

          <View style={styles.restaurantCard}>
            <View style={styles.restaurantIcon}>
              <Ionicons
                name="restaurant-outline"
                size={28}
                color="#F5B82E"
              />
            </View>

            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantLabel}>
                Reviewing your order from
              </Text>

              <Text
                style={styles.restaurantName}
                numberOfLines={2}
              >
                {restaurantName}
              </Text>
            </View>
          </View>

          {/* RATING */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              How was your order?
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() =>
                      setRating(star)
                    }
                    style={styles.starButton}
                    disabled={isSubmitting}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={
                        star <= rating
                          ? "star"
                          : "star-outline"
                      }
                      size={42}
                      color={
                        star <= rating
                          ? "#F5B82E"
                          : "#CBD5E1"
                      }
                    />
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text style={styles.ratingText}>
              {getRatingText()}
            </Text>
          </View>

          {/* COMMENT */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Write your review
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Tell us about your food and delivery experience..."
              placeholderTextColor="#94A3B8"
              value={comment}
              onChangeText={setComment}
              multiline
              maxLength={1000}
              textAlignVertical="top"
              editable={!isSubmitting}
            />

            <Text style={styles.characterCount}>
              {comment.length}/1000
            </Text>
          </View>

          {/* PHOTO */}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Add a picture
            </Text>

            <Text style={styles.photoDescription}>
              Share a picture of your food or order.
            </Text>

            {!image ? (
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={pickImage}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <View style={styles.cameraIcon}>
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color="#F5B82E"
                  />
                </View>

                <View
                  style={
                    styles.uploadTextContainer
                  }
                >
                  <Text style={styles.uploadTitle}>
                    Upload Picture
                  </Text>

                  <Text
                    style={styles.uploadSubtitle}
                  >
                    JPG, PNG or WEBP
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                <TouchableOpacity
                  style={
                    styles.removeImageButton
                  }
                  onPress={removeImage}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="close"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* SUBMIT */}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (rating === 0 ||
                isSubmitting) &&
                styles.submitButtonDisabled,
            ]}
            onPress={submitReview}
            disabled={
              rating === 0 ||
              isSubmitting
            }
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#081A33"
                />

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  Submitting...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#081A33"
                />

                <Text
                  style={
                    styles.submitButtonText
                  }
                >
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.bottomNote}>
            You can review an order only after it has
            been delivered.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },

  keyboardView: {
    flex: 1,
  },

  header: {
    height: 62,
    backgroundColor: "#081A33",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5B82E",
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0D2A4A",
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  headerSpacer: {
    width: 38,
  },

  // ===================================================
  // CHECKING
  // ===================================================

  checkingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  checkingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#64748B",
    fontWeight: "600",
  },

  // ===================================================
  // ALREADY REVIEWED
  // ===================================================

  alreadyReviewedContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  reviewedIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  alreadyReviewedTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 8,
  },

  alreadyReviewedMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 25,
  },

  goBackButton: {
    minWidth: 180,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#F5B82E",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },

  goBackButtonText: {
    color: "#081A33",
    fontSize: 15,
    fontWeight: "800",
  },

  // ===================================================
  // FORM
  // ===================================================

  content: {
    padding: 16,
    paddingBottom: 30,
  },

  restaurantCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    marginBottom: 20,
  },

  restaurantIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFF8E6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  restaurantInfo: {
    flex: 1,
  },

  restaurantLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 3,
  },

  restaurantName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B0F14",
  },

  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E6EB",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B0F14",
    marginBottom: 12,
  },

  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  starButton: {
    paddingHorizontal: 3,
  },

  ratingText: {
    textAlign: "center",
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 8,
  },

  commentInput: {
    height: 130,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#0B0F14",
  },

  characterCount: {
    textAlign: "right",
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 5,
  },

  photoDescription: {
    fontSize: 12,
    color: "#64748B",
    marginTop: -6,
    marginBottom: 12,
  },

  uploadButton: {
    minHeight: 76,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E6EB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  cameraIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFF8E6",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  uploadTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0B0F14",
  },

  uploadSubtitle: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
  },

  imageContainer: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#EEF2F6",
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  removeImageButton: {
    position: "absolute",
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      "rgba(8, 26, 51, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F5B82E",
  },

  submitButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "#F5B82E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 4,
  },

  submitButtonDisabled: {
    backgroundColor: "#CBD5E1",
  },

  submitButtonText: {
    color: "#081A33",
    fontSize: 15,
    fontWeight: "800",
  },

  bottomNote: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 20,
  },
});