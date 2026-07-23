import mongoose from "mongoose";

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    machineName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
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

const Machine = mongoose.model("Machine", machineSchema);

export default Machine;