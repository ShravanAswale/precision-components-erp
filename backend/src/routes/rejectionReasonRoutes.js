import express from "express";

import {
  createReason,
  getReasons,
  getReasonById,
  updateReason,
  deleteReason,
} from "../controllers/rejectionReasonController.js";

import {
  validateCreateReason,
  validateUpdateReason,
} from "../validators/rejectionReasonValidator.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

// CRUD Routes
router
  .route("/")
  .get(getReasons)
  .post(validateCreateReason, createReason);

router
  .route("/:id")
  .get(getReasonById)
  .put(validateUpdateReason, updateReason)
  .delete(deleteReason);

export default router;