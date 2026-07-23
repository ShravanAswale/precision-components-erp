import { Router } from "express";
import {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
} from "../controllers/machineController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateMachine,
  validateUpdateMachine,
} from "../validators/machineValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateCreateMachine,
  createMachine
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getMachines
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getMachineById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateUpdateMachine,
  updateMachine
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteMachine
);

export default router;