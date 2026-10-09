import Production from "../models/Production.js";
import Machine from "../models/Machine.js";
import PDIR from "../models/PDIR.js";
import Gage from "../models/Gage.js";

import { generateGageNotifications } from "./gageNotificationService.js";

import {
  getActiveNotifications,
  getNotificationCount,
} from "./notificationService.js";

export const getDashboard = async () => {
  const productions = await Production.find();

  // ==========================
  // Generate Notifications
  // ==========================
  await generateGageNotifications();

  const notifications = await getActiveNotifications();
  const notificationCount = await getNotificationCount();

  // ==========================
  // Production Summary
  // ==========================

  const totalTarget = productions.reduce(
    (sum, item) => sum + (item.targetProduction || 0),
    0
  );

  const totalProduction = productions.reduce(
    (sum, item) => sum + (item.actualProduction || 0),
    0
  );

  const totalRejections = productions.reduce(
    (sum, item) => sum + (item.rejectedQty || 0),
    0
  );

  // ==========================
  // PDIR Rejections
  // ==========================

  const pdirResult = await PDIR.aggregate([
    {
      $group: {
        _id: null,
        totalRejected: {
          $sum: "$qtyRejected",
        },
      },
    },
  ]);

  const pdirRejections =
    pdirResult.length > 0 ? pdirResult[0].totalRejected : 0;

  // ==========================
  // Efficiency
  // ==========================

  const avgEfficiency =
    totalTarget > 0
      ? Math.round((totalProduction / totalTarget) * 100)
      : 0;

  // ==========================
  // Machine Summary
  // ==========================

  const activeMachines = await Machine.countDocuments({
    status: "Active",
  });

  const totalMachines = await Machine.countDocuments();

  // ==========================
  // Recent Production
  // ==========================

  const recentProduction = await Production.find()
    .populate("operator", "name")
    .populate("component", "componentName partNumber")
    .populate("machine", "machineName")
    .sort({ createdAt: -1 })
    .limit(10);

  // ==========================
  // Gage Summary
  // ==========================

  const gageDue = await Gage.countDocuments({
    status: "Calibration Due",
  });

  const gageRepair = await Gage.countDocuments({
    status: "Under Repair",
  });

  // ==========================
  // Monthly Chart (each month as one bar — all time)
  // ==========================

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyRawData = await Production.aggregate([
    {
      $group: {
        _id: {
          month: { $month: "$date" },
          year:  { $year: "$date" },
        },
        Production: { $sum: "$actualProduction" },
        Rejection:  { $sum: "$rejectedQty" },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 },
    },
  ]);

  // Format each group as a readable month-year label
  const monthlyChart = monthlyRawData.map((item) => ({
    _id: `${MONTHS[item._id.month - 1]} ${item._id.year}`,
    Production: item.Production || 0,
    Rejection:  item.Rejection  || 0,
  }));

  // ==========================
  // PDIR Analysis
  // ==========================

  const rejectionAnalysis = await PDIR.aggregate([
    {
      $group: {
        _id: {
          component: "$partName",
          reason: "$rejectionReason",
        },
        rejectedQty: {
          $sum: "$qtyRejected",
        },
      },
    },
    {
      $sort: {
        rejectedQty: -1,
      },
    },
  ]);

  // ==========================
  // Response
  // ==========================

  return {
    summary: {
      totalTarget,
      totalProduction,
      totalRejections,
      pdirRejections,
      avgEfficiency,
      activeMachines,
      totalMachines,
      gageDue,
      gageRepair,
    },
    recentProduction,
    monthlyChart,
    rejectionAnalysis,
    notifications,
    notificationCount,
  };
};