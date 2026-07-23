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

  const pdirResult = await Pdir.aggregate([
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
  // Weekly Chart
  // ==========================

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const weeklyData = await Production.aggregate([
    {
      $match: {
        date: {
          $gte: sevenDaysAgo,
          $lte: today,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%d %b",
            date: "$date",
          },
        },
        Production: {
          $sum: "$actualProduction",
        },
        Rejection: {
          $sum: "$rejectedQty",
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  const weeklyChart = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);

    const label = d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });

    const found = weeklyData.find((x) => x._id === label);

    weeklyChart.push({
      _id: label,
      Production: found ? found.Production : 0,
      Rejection: found ? found.Rejection : 0,
    });
  }

  // ==========================
  // PDIR Analysis
  // ==========================

  const rejectionAnalysis = await Pdir.aggregate([
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

    weeklyChart,

    rejectionAnalysis,

    notifications,

    notificationCount,
  };
};