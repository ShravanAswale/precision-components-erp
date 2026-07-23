import { Router } from "express";
import {
  createOperator,
  getOperators,
  getOperatorById,
  updateOperator,
  deleteOperator,
} from "../controllers/operatorController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

const router = Router();

router.post("/", authMiddleware, roleMiddleware("admin"), createOperator);

router.get("/", authMiddleware, roleMiddleware("admin"), getOperators);

router.get("/:id", authMiddleware, roleMiddleware("admin"), getOperatorById);

router.put("/:id", authMiddleware, roleMiddleware("admin"), updateOperator);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), deleteOperator);

export default router;