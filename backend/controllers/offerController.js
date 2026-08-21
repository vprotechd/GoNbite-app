import Offer from "../models/Offer.js";

// ======================================================
// GET ALL OFFERS
// ======================================================
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find().sort({
      createdAt: -1,
    });

    // Automatically deactivate expired offers
    const now = new Date();

    for (const offer of offers) {
      if (offer.endDate <= now && offer.isActive) {
        offer.isActive = false;
        await offer.save();
      }
    }

    const updatedOffers = await Offer.find().sort({
      createdAt: -1,
    });

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
export const getOfferById = async (req, res) => {
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
export const createOffer = async (req, res) => {
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

    if (
      !["percentage", "fixed"].includes(discountType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const numericDiscount = Number(discountValue);

    if (
      Number.isNaN(numericDiscount) ||
      numericDiscount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      numericDiscount > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot exceed 100%",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    const normalizedCode =
      code.trim().toUpperCase();

    const existingOffer =
      await Offer.findOne({
        code: normalizedCode,
      });

    if (existingOffer) {
      return res.status(409).json({
        success: false,
        message: "Offer code already exists",
      });
    }

    const offer = await Offer.create({
      name: name.trim(),
      festival: festival.trim(),
      code: normalizedCode,
      discountType,
      discountValue: numericDiscount,
      minimumOrder: Number(minimumOrder || 0),
      maximumDiscount:
        maximumDiscount === "" ||
        maximumDiscount === undefined ||
        maximumDiscount === null
          ? null
          : Number(maximumDiscount),
      startDate: start,
      endDate: end,
      description: description
        ? description.trim()
        : "",
      isActive: isActive !== false,
    });

    res.status(201).json({
      success: true,
      message: "Offer created successfully",
      offer,
    });
  } catch (error) {
    console.error(
      "Create offer error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to create offer",
    });
  }
};

// ======================================================
// UPDATE OFFER
// ======================================================
export const updateOffer = async (req, res) => {
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

    if (
      !["percentage", "fixed"].includes(discountType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount type",
      });
    }

    const numericDiscount =
      Number(discountValue);

    if (
      Number.isNaN(numericDiscount) ||
      numericDiscount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Discount value must be greater than 0",
      });
    }

    if (
      discountType === "percentage" &&
      numericDiscount > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Percentage discount cannot exceed 100%",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid start or end date",
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message:
          "End date must be after start date",
      });
    }

    const normalizedCode =
      code.trim().toUpperCase();

    const duplicateCode =
      await Offer.findOne({
        code: normalizedCode,
        _id: { $ne: id },
      });

    if (duplicateCode) {
      return res.status(409).json({
        success: false,
        message:
          "Another offer already uses this code",
      });
    }

    offer.name = name.trim();
    offer.festival = festival.trim();
    offer.code = normalizedCode;
    offer.discountType = discountType;
    offer.discountValue = numericDiscount;

    offer.minimumOrder =
      Number(minimumOrder || 0);

    offer.maximumDiscount =
      maximumDiscount === "" ||
      maximumDiscount === undefined ||
      maximumDiscount === null
        ? null
        : Number(maximumDiscount);

    offer.startDate = start;
    offer.endDate = end;

    offer.description = description
      ? description.trim()
      : "";

    offer.isActive =
      isActive !== false;

    // Automatically deactivate expired offer
    if (end < new Date()) {
      offer.isActive = false;
    }

    await offer.save();

    res.status(200).json({
      success: true,
      message: "Offer updated successfully",
      offer,
    });
  } catch (error) {
    console.error(
      "Update offer error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update offer",
    });
  }
};

// ======================================================
// ACTIVATE / DEACTIVATE OFFER
// ======================================================
export const toggleOfferStatus = async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    const now = new Date();

    // Cannot activate expired offer
    if (now >= offer.endDate) {
      offer.isActive = false;
      await offer.save();

      return res.status(400).json({
        success: false,
        message: "Expired offers cannot be activated",
        offer,
      });
    }

    // Cannot activate future offer
    if (!offer.isActive && now < offer.startDate) {
      return res.status(400).json({
        success: false,
        message: "Upcoming offers cannot be activated before their start date",
      });
    }

    offer.isActive = !offer.isActive;

    await offer.save();

    return res.status(200).json({
      success: true,
      message: offer.isActive
        ? "Offer activated successfully"
        : "Offer deactivated successfully",
      offer,
    });
  } catch (error) {
    console.error("Toggle offer error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update offer status",
    });
  }
};

// ======================================================
// DELETE OFFER
// ======================================================
export const deleteOffer = async (
  req,
  res
) => {
  try {
    const offer = await Offer.findById(
      req.params.id
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found",
      });
    }

    await Offer.findByIdAndDelete(
      req.params.id
    );

    res.status(200).json({
      success: true,
      message:
        "Offer deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete offer error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to delete offer",
    });
  }
};