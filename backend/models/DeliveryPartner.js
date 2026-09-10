import mongoose from "mongoose";

const DeliveryPartnerSchema = new mongoose.Schema(
  {
    // =================================================
    // BASIC DETAILS
    // =================================================

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    // =================================================
    // VEHICLE DETAILS
    // =================================================

    vehicleType: {
      type: String,
      enum: ["Bike", "Scooter", "Bicycle"],
      required: true,
      default: "Bike",
    },

    // =================================================
    // VERIFICATION DOCUMENTS
    // =================================================

    // Aadhaar document is required for every
    // delivery partner.
    aadhaarDocument: {
      type: String,
      required: true,
    },

    // Driving licence is required only for
    // Bike and Scooter.
    drivingLicenseDocument: {
      type: String,
      required: function () {
        return (
          this.vehicleType === "Bike" ||
          this.vehicleType === "Scooter"
        );
      },
      default: null,
    },

    // Live photo is required only for
    // Bicycle delivery partners.
    livePhoto: {
      type: String,
      required: function () {
        return this.vehicleType === "Bicycle";
      },
      default: null,
    },

    // =================================================
    // VERIFICATION STATUS
    // =================================================

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },

    verificationRejectionReason: {
      type: String,
      default: null,
    },

    // =================================================
    // ONLINE / OFFLINE
    // =================================================

    isOnline: {
      type: Boolean,
      default: false,
    },

    // =================================================
    // LIVE LOCATION
    // GeoJSON format
    // =================================================

    currentLocation: {
      type: {
        type: String,
        default: "Point",
      },

      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },

    // =================================================
    // WALLET / EARNINGS
    // =================================================

    walletBalance: {
      type: Number,
      default: 0,
    },

    totalDeliveries: {
      type: Number,
      default: 0,
    },

    totalEarnings: {
      type: Number,
      default: 0,
    },

    // =================================================
    // CURRENT ORDER
    // =================================================

    currentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// =================================================
// GEO LOCATION INDEX
// =================================================

DeliveryPartnerSchema.index({
  currentLocation: "2dsphere",
});

export default mongoose.model(
  "DeliveryPartner",
  DeliveryPartnerSchema
);