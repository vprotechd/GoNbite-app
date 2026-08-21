import Offer from "../models/Offer.js";

// ======================================================
// GET ACTIVE OFFERS FOR CUSTOMERS
// ======================================================

export const getPublicOffers = async (req, res) => {
  try {
    const now = new Date();

    const offers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: offers.length,
      offers,
    });
  } catch (error) {
    console.error("Get public offers error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch offers",
    });
  }
};

// ======================================================
// GET SINGLE ACTIVE OFFER FOR CUSTOMER
// ======================================================

export const getPublicOfferById = async (req, res) => {
  try {
    const now = new Date();

    const offer = await Offer.findOne({
      _id: req.params.id,
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    }).lean();

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: "Offer not found or no longer available",
      });
    }

    res.status(200).json({
      success: true,
      offer,
    });
  } catch (error) {
    console.error("Get public offer error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch offer",
    });
  }
};