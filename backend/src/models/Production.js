import mongoose from "mongoose";

const productionSchema = new mongoose.Schema(
  {
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    // Shift stored as String
    shift: {
      type: String,
      required: true,
      trim: true,
    },

    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Machine",
      required: true,
    },

    operationNo: {
      type: String,
      required: true,
      trim: true,
    },

    component: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Component",
      required: true,
    },

    cycleTime: {
      type: Number,
      default: 0,
    },

    machineRunTime: {
      type: Number,
      default: 0,
    },

    targetProduction: {
      type: Number,
      default: 0,
    },

    actualProduction: {
      type: Number,
      default: 0,
    },

    grade: {
      type: String,
      enum: ["A", "B", "C", "D"],
      default: "D",
    },

    rejectedQty: {
      type: Number,
      default: 0,
    },

    // NEW — was being sent by AddProduction.jsx but silently dropped
    // because it didn't exist on the schema. This is what makes a
    // real "Production Rejection Analysis" (by reason) possible,
    // separate from PDIR rejection.
    rejections: [
  {
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    qty: {
      type: Number,
      required: true,
      min: 1,
    },
  },
],

    remarks: {
      type: String,
      trim: true,
      default: "",
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

const Production = mongoose.model("Production", productionSchema);

export default Production;