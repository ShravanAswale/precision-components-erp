import mongoose from "mongoose";

const gageSchema = new mongoose.Schema(
  {
    gageName: {
      type: String,
      required: true,
      trim: true,
    },

    gageNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    purchaseDate: {
      type: Date,
    },

    calibrationDueDate: {
      type: Date,
      required: true,
    },

    repairReminderDate: {
      type: Date,
    },

    sentForRepair: {
      type: Boolean,
      default: false,
    },

    sentForRepairDate: {
      type: Date,
    },

    expectedReturnDate: {
      type: Date,
    },

    receivedDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: [
        "Available",
        "Calibration Due",
        "Sent For Repair",
        "Under Repair",
        "Received",
      ],
      default: "Available",
    },

    remarks: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Gage = mongoose.model("Gage", gageSchema);

export default Gage;