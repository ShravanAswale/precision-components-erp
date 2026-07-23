import mongoose from "mongoose";

const componentSchema = new mongoose.Schema(
  {
    componentId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    componentName: {
      type: String,
      required: true,
      trim: true,
    },

    partNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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

const Component = mongoose.model("Component", componentSchema);

export default Component;