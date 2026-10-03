import Gage from "../models/Gage.js";
import ApiError from "../utils/ApiError.js";

// Create Gage
export const createGage = async (data, createdBy) => {
  const existing = await Gage.findOne({
    gageNumber: data.gageNumber,
  });

  if (existing) {
    throw new ApiError(400, "Gage Number already exists");
  }

  return await Gage.create({
    ...data,
    createdBy,
  });
};

// Get All Gages
export const getGages = async () => {
  const gages = await Gage.find()
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: gages.length,
    gages,
  };
};

// Get Gage By ID
export const getGageById = async (id) => {
  const gage = await Gage.findById(id);

  if (!gage) {
    throw new ApiError(404, "Gage not found");
  }

  return gage;
};

// Update Gage
export const updateGage = async (id, data) => {
  const gage = await Gage.findById(id);

  if (!gage) {
    throw new ApiError(404, "Gage not found");
  }

  // User has full control — no automatic status changes, save exactly what was sent
  Object.assign(gage, data);

  await gage.save();

  return gage;
};

// Delete Gage
export const deleteGage = async (id) => {
  const gage = await Gage.findById(id);

  if (!gage) {
    throw new ApiError(404, "Gage not found");
  }

  await gage.deleteOne();

  return {
    success: true,
    message: "Gage deleted successfully",
  };
};