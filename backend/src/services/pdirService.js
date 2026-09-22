import PDIR from "../models/PDIR.js";
import ApiError from "../utils/ApiError.js";

// Validate rejection breakdown
const validateRejections = (data) => {
  const rejectedQty = Number(data.qtyRejected || 0);
  const rejections = data.rejections || [];

  if (rejectedQty === 0) {
    data.rejections = [];
    return;
  }

  if (rejections.length === 0) {
    throw new ApiError(400, "Please add at least one rejection reason.");
  }

  const invalid = rejections.some(
    (item) => !item.reason || Number(item.qty || 0) <= 0
  );

  if (invalid) {
    throw new ApiError(
      400,
      "Every rejection must have a reason and valid quantity."
    );
  }

  const reasons = rejections.map((item) => item.reason);

  if (new Set(reasons).size !== reasons.length) {
    throw new ApiError(
      400,
      "Duplicate rejection reasons are not allowed."
    );
  }

  const total = rejections.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  if (total !== rejectedQty) {
    throw new ApiError(
      400,
      `Rejection quantity mismatch. Total rejected quantity is ${rejectedQty}, but rejection breakdown totals ${total}.`
    );
  }
};

// Create PDIR
export const createPdir = async (data, createdBy) => {
  validateRejections(data);

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

  validateRejections(data);

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