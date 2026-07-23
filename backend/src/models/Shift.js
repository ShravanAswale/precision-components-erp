import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    shiftId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    shiftName: {
      type: String,
      required: true,
      trim: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
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

const Shift = mongoose.model("Shift", shiftSchema);

export default Shift;