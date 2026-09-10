import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    phone: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      enum: [
        "customer",
        "restaurant",
        "delivery",
        "admin",
      ],
      default: "customer",
    },

    address: {
      type: String,
      default: "",
    },


latitude: {
  type: Number,
  default: null,
},

longitude: {
  type: Number,
  default: null,
},


    isActive: {
      type: Boolean,
      default: true,
    },


    isVerified: {
  type: Boolean,
  default: false,
},

registrationOTP: {
  type: String,
  default: null,
},

registrationOTPExpires: {
  type: Date,
  default: null,
},

    // ==========================================
    // PASSWORD RESET
    // ==========================================

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordExpires: {
      type: Date,
      default: null,
    },

    resetPasswordOTP: {
      type: String,
      default: null,
    },

    resetPasswordOTPExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);