import RejectionReason from "../models/RejectionReason.js";
import ApiError from "../utils/ApiError.js";

// Create
export const createReason = async (data) => {
  const exists = await RejectionReason.findOne({
    reasonName: data.reasonName.trim(),
  });

  if (exists) {
    throw new ApiError(400, "Rejection reason already exists");
  }

  return await RejectionReason.create({
    reasonName: data.reasonName.trim(),
    status: data.status ?? true,
  });
};

// Get All
export const getReasons = async () => {
  const rejectionReasons = await RejectionReason.find().sort({
    reasonName: 1,
  });

  return {
    count: rejectionReasons.length,
    rejectionReasons,
  };
};

// Get By ID
export const getReasonById = async (id) => {
  const reason = await RejectionReason.findById(id);

  if (!reason) {
    throw new ApiError(404, "Rejection reason not found");
  }

  return reason;
};

// Update
export const updateReason = async (id, data) => {
  const reason = await RejectionReason.findById(id);

  if (!reason) {
    throw new ApiError(404, "Rejection reason not found");
  }

  if (data.reasonName) {
    const exists = await RejectionReason.findOne({
      reasonName: data.reasonName.trim(),
      _id: { $ne: id },
    });

    if (exists) {
      throw new ApiError(400, "Rejection reason already exists");
    }

    reason.reasonName = data.reasonName.trim();
  }

  if (data.status !== undefined) {
    reason.status = data.status;
  }

  await reason.save();

  return reason;
};

// Delete
export const deleteReason = async (id) => {
  const reason = await RejectionReason.findById(id);

  if (!reason) {
    throw new ApiError(404, "Rejection reason not found");
  }

  await reason.deleteOne();

  return {
    success: true,
    message: "Rejection reason deleted successfully",
  };
};