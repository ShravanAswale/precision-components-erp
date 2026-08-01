import Gage from "../models/Gage.js";
import Notification from "../models/Notification.js";
import { createNotification } from "./notificationService.js";

export const generateGageNotifications = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gages = await Gage.find();

  console.log("======================================");
  console.log("Gage Notification Service Started");
  console.log("Today's Date:", today);
  console.log("Total Gages Found:", gages.length);
  console.log("======================================");

  for (const gage of gages) {
    try {
      console.log("");
      console.log("--------------------------------------");
      console.log("Checking Gage:", gage.gageName);
      console.log("Gage Number:", gage.gageNumber);
      console.log("--------------------------------------");

      // ==========================
      // CALIBRATION
      // ==========================

      if (gage.repairReminderDate && !gage.sentForRepair) {
        const reminderDate = new Date(gage.repairReminderDate);
        const dueDate = new Date(gage.calibrationDueDate);

        reminderDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        if (
          !isNaN(reminderDate.getTime()) &&
          !isNaN(dueDate.getTime()) &&
          today >= reminderDate
        ) {
          let title = "";
          let message = "";
          let priority = "Medium";

          const days = Math.ceil(
            (dueDate.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (days > 0) {
            title = "Calibration Reminder";
            message = `${gage.gageName} (${gage.gageNumber}) calibration due in ${days} day(s).`;
            priority = "Medium";
          } else if (days === 0) {
            title = "Calibration Due Today";
            message = `${gage.gageName} (${gage.gageNumber}) calibration is due today.`;
            priority = "High";
          } else {
            title = "Calibration Overdue";
            message = `${gage.gageName} (${gage.gageNumber}) calibration overdue by ${Math.abs(
              days
            )} day(s).`;
            priority = "Critical";
          }

          const exists = await Notification.findOne({
            relatedId: gage._id,
            relatedModel: "Gage",
            title,
            isClosed: false,
          });

          if (!exists) {
            await createNotification({
              type: "Calibration",
              title,
              message,
              priority,
              relatedId: gage._id,
              relatedModel: "Gage",
              dueDate: gage.calibrationDueDate,
              createdBy: gage.createdBy,
            });

            console.log("Calibration notification created.");
          } else {
            console.log("Calibration notification already exists.");
          }
        }
      }

      // ==========================
      // REPAIR
      // ==========================

      if (
        gage.sentForRepair &&
        gage.expectedReturnDate &&
        !gage.receivedDate
      ) {
        const expected = new Date(gage.expectedReturnDate);
        expected.setHours(0, 0, 0, 0);

        if (!isNaN(expected.getTime()) && today >= expected) {
          const days = Math.ceil(
            (today.getTime() - expected.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          let title = "";
          let message = "";
          let priority = "High";

          if (days === 0) {
            title = "Repair Return Due";
            message = `${gage.gageName} (${gage.gageNumber}) should return from repair today.`;
          } else {
            title = "Repair Overdue";
            message = `${gage.gageName} (${gage.gageNumber}) repair overdue by ${days} day(s).`;
            priority = "Critical";
          }

          const exists = await Notification.findOne({
            relatedId: gage._id,
            relatedModel: "Gage",
            title,
            isClosed: false,
          });

          if (!exists) {
            await createNotification({
              type: "Repair",
              title,
              message,
              priority,
              relatedId: gage._id,
              relatedModel: "Gage",
              dueDate: gage.expectedReturnDate,
              createdBy: gage.createdBy,
            });

            console.log("Repair notification created.");
          } else {
            console.log("Repair notification already exists.");
          }
        }
      }
    } catch (error) {
      console.error(
        `Notification generation failed for gage ${gage.gageNumber}:`,
        error
      );
    }
  }

  console.log("======================================");
  console.log("Notification Generation Completed");
  console.log("======================================");
};