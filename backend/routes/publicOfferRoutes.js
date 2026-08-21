import express from "express";

import {
  getPublicOffers,
  getPublicOfferById,
} from "../controllers/publicOfferController.js";

const router = express.Router();

// ======================================================
// PUBLIC CUSTOMER OFFERS
// No admin authentication required
// ======================================================

// GET all currently active offers
router.get("/", getPublicOffers);

// GET one currently active offer
router.get("/:id", getPublicOfferById);

export default router;