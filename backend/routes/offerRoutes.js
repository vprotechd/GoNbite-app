import express from "express";

import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  toggleOfferStatus,
  deleteOffer,
} from "../controllers/offerController.js";

import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";

const router = express.Router();



// All offer routes require admin authentication
router.use(adminAuthMiddleware);

// GET all offers
router.get("/", getOffers);

// GET single offer
router.get("/:id", getOfferById);

// CREATE offer
router.post("/", createOffer);

// UPDATE offer
router.put("/:id", updateOffer);

// ACTIVATE / DEACTIVATE offer
router.patch(
  "/:id/status",
  (req, res, next) => {
    console.log("🔥 PATCH STATUS ROUTE REACHED");
    console.log("ID:", req.params.id);
    next();
  },
  toggleOfferStatus
);

router.delete(
  "/:id",
  (req, res, next) => {
    console.log("🔥 DELETE ROUTE REACHED");
    console.log("ID:", req.params.id);
    next();
  },
  deleteOffer
);



export default router;