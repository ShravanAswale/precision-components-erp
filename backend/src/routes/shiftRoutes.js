import { Router } from "express";
import {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
} from "../controllers/shiftController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateShift,
  validateUpdateShift,
} from "../validators/shiftValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateCreateShift,
  createShift
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getShifts
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getShiftById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateUpdateShift,
  updateShift
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteShift
);

export default router;