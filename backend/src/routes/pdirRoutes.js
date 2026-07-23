import { Router } from "express";
import {
  createPdir,
  getPdirs,
  getPdirById,
  updatePdir,
  deletePdir,
} from "../controllers/pdirController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreatePdir,
  validateUpdatePdir,
} from "../validators/pdirValidator.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin", "supervisor"),
  validateCreatePdir,
  createPdir
);

router.get(
  "/",
  authMiddleware,
  getPdirs
);

router.get(
  "/:id",
  authMiddleware,
  getPdirById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin", "supervisor"),
  validateUpdatePdir,
  updatePdir
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deletePdir
);

export default router;