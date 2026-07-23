import { Router } from "express";
import {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";
import {
  validateCreateUser,
  validateUpdateUser,
} from "../validators/userValidator.js";

const router = Router();

// Only Admin can manage users
router.post(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  validateCreateUser,
  createUser
);

router.get(
  "/",
  authMiddleware,
  roleMiddleware("admin"),
  getUsers
);

router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  getUserById
);

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  validateUpdateUser,
  updateUser
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("admin"),
  deleteUser
);

export default router;