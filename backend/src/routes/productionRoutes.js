import { Router } from "express";
import {
  createProduction,
  getProductions,
  getProductionById,
  updateProduction,
  deleteProduction,
} from "../controllers/productionController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateProduction,
  validateUpdateProduction,
} from "../validators/productionValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "supervisor"),
  validateCreateProduction,
  createProduction
);

router.get(
  "/",
  authMiddleware,
  getProductions
);

router.get(
  "/:id",
  authMiddleware,
  getProductionById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "supervisor"),
  validateUpdateProduction,
  updateProduction
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteProduction
);

export default router;