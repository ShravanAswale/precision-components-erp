import PDIR from "../models/PDIR.js";
import ApiError from "../utils/ApiError.js";

// Create PDIR
export const createPdir = async (data, createdBy) => {
  const pdir = await PDIR.create({
    ...data,
    createdBy,
  });

  return await PDIR.findById(pdir._id)
    .populate("component", "componentName partNumber")
    .populate("production")
    .populate("checkingOperator", "name operatorId")
    .populate("packingOperator", "name operatorId")
    .populate("createdBy", "fullName");
};

// Get All PDIR Records
export const getPdirs = async () => {
  const pdirs = await PDIR.find()
    .populate("component", "componentName partNumber")
    .populate("production")
    .populate("checkingOperator", "name operatorId")
    .populate("packingOperator", "name operatorId")
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: pdirs.length,
    pdirs,
  };
};

// Get PDIR By ID
export const getPdirById = async (id) => {
  const pdir = await PDIR.findById(id)
    .populate("component", "componentName partNumber")
    .populate("production")
    .populate("checkingOperator", "name operatorId")
    .populate("packingOperator", "name operatorId")
    .populate("createdBy", "fullName");

  if (!pdir) {
    throw new ApiError(404, "PDIR not found");
  }

  return pdir;
};

// Update PDIR
export const updatePdir = async (id, data) => {
  const pdir = await PDIR.findById(id);

  if (!pdir) {
    throw new ApiError(404, "PDIR not found");
  }

  Object.assign(pdir, data);

  await pdir.save();

  return await PDIR.findById(pdir._id)
    .populate("component", "componentName partNumber")
    .populate("production")
    .populate("checkingOperator", "name operatorId")
    .populate("packingOperator", "name operatorId")
    .populate("createdBy", "fullName");
};

// Delete PDIR
export const deletePdir = async (id) => {
  const pdir = await PDIR.findById(id);

  if (!pdir) {
    throw new ApiError(404, "PDIR not found");
  }

  await pdir.deleteOne();

  return {
    success: true,
    message: "PDIR deleted successfully",
  };
};