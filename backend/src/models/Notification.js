import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Calibration",
        "Repair",
        "Production",
        "PDIR",
        "Machine",
        "Inventory",
        "General",
      ],
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    relatedModel: {
      type: String,
      default: null,
    },

    dueDate: {
      type: Date,
      default: null,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isClosed: {
      type: Boolean,
      default: false,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate active notifications
notificationSchema.index(
  {
    type: 1,
    relatedId: 1,
    title: 1,
    isClosed: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      isClosed: false,
    },
  }
);

const Notification = mongoose.model(
  "Notification",
  notificationSchema
);

export default Notification;