import { Router } from "express";
import {
  createComponent,
  getComponents,
  getComponentById,
  updateComponent,
  deleteComponent,
} from "../controllers/componentController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateComponent,
  validateUpdateComponent,
} from "../validators/componentValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateCreateComponent,
  createComponent
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getComponents
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getComponentById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateUpdateComponent,
  updateComponent
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteComponent
);

export default router;