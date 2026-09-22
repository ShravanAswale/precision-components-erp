import mongoose from "mongoose";

const rejectionReasonSchema = new mongoose.Schema(
  {
    reasonName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    status: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const RejectionReason = mongoose.model(
  "RejectionReason",
  rejectionReasonSchema
);

export default RejectionReason;