import express from "express";
import {
  holdSeat,
  confirmBooking,
  getMyBookings,
  cancelBooking,
} from "../controllers/booking.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/hold", authMiddleware, authorizeRoles("user"), holdSeat);
router.post("/confirm", authMiddleware, authorizeRoles("user"), confirmBooking);
router.get(
  "/my-bookings",
  authMiddleware,
  authorizeRoles("user"),
  getMyBookings,
);
router.patch("/:id", authMiddleware, authorizeRoles("user"), cancelBooking);

export default router;
