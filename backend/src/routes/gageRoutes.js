import { Router } from "express";
import {
  createGage,
  getGages,
  getGageById,
  updateGage,
  deleteGage,
} from "../controllers/gageController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateGage,
  validateUpdateGage,
} from "../validators/gageValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateCreateGage,
  createGage
);

router.get(
  "/",
  authMiddleware,
  getGages
);

router.get(
  "/:id",
  authMiddleware,
  getGageById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateUpdateGage,
  updateGage
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteGage
);

export default router;