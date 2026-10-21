import express from "express";
import {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/event.controller.js";
import authMiddleware from "../middleware/auth.middleware.js";
import authorizeRoles from "../middleware/authorize.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, authorizeRoles("admin"), createEvent);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateEvent);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);

export default router;
