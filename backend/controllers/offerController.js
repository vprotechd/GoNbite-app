const Offer = require("../models/Offer");

// ======================================================
// GET ALL OFFERS
// ======================================================
const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });

    // Automatically mark expired offers inactive
    const now = new Date();

    for (const offer of offers) {
      if (offer.endDate < now && offer.isActive) {
        offer.isActive = false;
        await offer.save();
      }
    }

    const updatedOffers = await Offer.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: updatedOffers.length,
      offers: updatedOffers,
    });
  } catch (error) {
    console.error("Get offers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

// ======================================================
// GET SINGLE OFFER
// ======================================================
const getOfferById = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Get offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch offer",
    });
  }
};

// ======================================================
// CREATE OFFER
// ======================================================
const createOffer = async (req, res) => {
  try {
    const {
      name,
      festival,
      code,
      discountType,
      discountValue,
      minimumOrder,
      maximumDiscount,
      startDate,
      endDate,
      description,
      isActive,
    } = req.body;

    if (
      !name ||
      !festival ||
      !code ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const existingOffer = await Offer.findOne({
      code: code.toUpperCase(),
    });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: "Offer code already exists",
      });
    }

    const offer = await Offer.create({
      name,
      festival,
      code: code.toUpperCase(),
      discountType,
      discountValue,
      minimumOrder: minimumOrder || 0,
      maximumDiscount:
        maximumDiscount === "" || maximumDiscount === undefined
          ? null
          : maximumDiscount,
      startDate,
      endDate,
      description: description || "",
      isActive: isActive !== false,
    });

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error("Create offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create offer",
    });
  }
};

// ======================================================
// UPDATE OFFER
// ======================================================
const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      festival,
      code,
      discountType,
      discountValue,
      minimumOrder,
      maximumDiscount,
      startDate,
      endDate,
      description,
      isActive,
    } = req.body;

    const offer = await Offer.findById(id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (
      !name ||
      !festival ||
      !code ||
      !discountType ||
      discountValue === undefined ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    if (discountValue <= 0) {
      return res.status(400).json({
        success: false,
        message: "Discount value must be greater than 0",
      });
    }

    if (discountType === "percentage" && discountValue > 100) {
      return res.status(400).json({
        success: false,
        message: "Percentage discount cannot exceed 100%",
      });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date must be after start date",
      });
    }

    const duplicateCode = await Offer.findOne({
      code: code.toUpperCase(),
      _id: { $ne: id },
    });

    if (duplicateCode) {
      return res.status(409).json({
        success: false,
        message: "Another offer already uses this code",
      });
    }

    offer.name = name;
    offer.festival = festival;
    offer.code = code.toUpperCase();
    offer.discountType = discountType;
    offer.discountValue = discountValue;
    offer.minimumOrder = minimumOrder || 0;
    offer.maximumDiscount =
      maximumDiscount === "" || maximumDiscount === undefined
        ? null
        : maximumDiscount;
    offer.startDate = startDate;
    offer.endDate = endDate;
    offer.description = description || "";
    offer.isActive = isActive !== false;

    if (new Date(endDate) < new Date()) {
      offer.isActive = false;
    }

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer,
    });
  } catch (error) {
    console.error("Update offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update offer",
    });
  }
};

// ======================================================
// ACTIVATE / DEACTIVATE OFFER
// ======================================================
const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    if (new Date() > offer.endDate) {
      offer.isActive = false;
      await offer.save();

      return res.status(400).json({
        success: false,
        message: "Expired offers cannot be activated",
      });
    }

    offer.isActive = !offer.isActive;

    await offer.save();

    res.status(200).json({
      success: true,
      message: offer.isActive
        ? "Offer activated successfully"
        : "Offer deactivated successfully",
      offer,
    });
  } catch (error) {
    console.error("Toggle offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update offer status",
    });
  }
};

// ======================================================
// DELETE OFFER
// ======================================================
const deleteOffer = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    await Offer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Offer deleted successfully",
    });
  } catch (error) {
    console.error("Delete offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete offer",
    });
  }
};

module.exports = {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
};