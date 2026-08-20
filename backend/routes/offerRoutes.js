const express = require("express");

const {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
} = require("../controllers/offerController");

// Change this import to match your project
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// All offer management routes require admin authentication
router.use(protect);
router.use(adminOnly);

router.get("/", getOffers);

router.get("/:id", getOfferById);

router.post("/", createOffer);

router.put("/:id", updateOffer);

router.patch("/:id/status", toggleOfferStatus);

router.delete("/:id", deleteOffer);

module.exports = router;