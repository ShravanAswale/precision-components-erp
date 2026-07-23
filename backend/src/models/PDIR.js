import mongoose from "mongoose";

const pdirSchema = new mongoose.Schema(
  {
    // Direct link to Component Master
    component: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Component",
      required: true,
    },

    // Keep these fields because Reports use them
    partName: {
      type: String,
      required: true,
      trim: true,
    },

    partNumber: {
      type: String,
      required: true,
      trim: true,
    },

    // Production link is now optional.
    // Keeping it prevents old PDIR records from breaking.
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
      required: false,
      default: null,
    },

    checkingOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: true,
    },

    packingOperator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Operator",
      required: true,
    },

    qtyChecked: {
      type: Number,
      required: true,
      min: 0,
    },

    qtyRejected: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Keep same field name for Reports
    rejectionReason: {
      type: String,
      trim: true,
      default: "",
    },

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

const Pdir = mongoose.model("Pdir", pdirSchema);

export default Pdir;