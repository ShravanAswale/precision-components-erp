import { Router } from "express";
import { getReports } from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getReports);

export default router;