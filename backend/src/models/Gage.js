import mongoose from "mongoose";

const gageSchema = new mongoose.Schema(
  {
    gageName: {
      type: String,
      required: true,
      trim: true,
    },

    // Short description of the gauge's purpose or type
    description: {
      type: String,
      trim: true,
    },

    gageNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Calibration certificate reference number
    certificateNumber: {
      type: String,
      trim: true,
    },

    // Measurement range or size of the gauge (e.g. 0–150mm)
    rangeSize: {
      type: String,
      trim: true,
    },

    // Part name / component this gauge is used for
    usedForPart: {
      type: String,
      trim: true,
    },

    // External calibration agency name
    agencyName: {
      type: String,
      trim: true,
    },

    // Location of the calibration agency
    agencyLocation: {
      type: String,
      trim: true,
    },

    issueDate: {
      type: Date,
      required: true,
    },

    purchaseDate: {
      type: Date,
    },

    calibrationPeriod: {
      // Added to store calibration frequency in months (1, 3, 6, 12, 18, 24, 36)
      type: Number,
      required: true
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