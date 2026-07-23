import { Router } from "express";

import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import operatorRoutes from "./operatorRoutes.js";
import machineRoutes from "./machineRoutes.js";
import componentRoutes from "./componentRoutes.js";
import shiftRoutes from "./shiftRoutes.js";
import productionRoutes from "./productionRoutes.js";
import pdirRoutes from "./pdirRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import reportRoutes from "./reportRoutes.js";
import gageRoutes from "./gageRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

// API Home
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Precision Components ERP API v1",
  });
});

// Authentication
router.use("/auth", authRoutes);

// Masters
router.use("/users", userRoutes);
router.use("/operators", operatorRoutes);
router.use("/machines", machineRoutes);
router.use("/components", componentRoutes);
router.use("/shifts", shiftRoutes);

// Production Modules
router.use("/productions", productionRoutes);
router.use("/pdirs", pdirRoutes);

// Dashboard & Reports
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);

// Gage Management
router.use("/gages", gageRoutes);

// Notifications
router.use("/notifications", notificationRoutes);

export default router;