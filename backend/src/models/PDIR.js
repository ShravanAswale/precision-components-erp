import mongoose from "mongoose";

const rejectionSchema = new mongoose.Schema(
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
  { _id: false }
);

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

    // Optional Production Link
    production: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Production",
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

    // NEW: Multiple rejection reasons
    rejections: {
      type: [rejectionSchema],
      default: [],
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