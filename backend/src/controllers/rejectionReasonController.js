import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as rejectionReasonService from "../services/rejectionReasonService.js";

// Create
export const createReason = asyncHandler(async (req, res) => {
  const reason = await rejectionReasonService.createReason(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Rejection reason created successfully", reason));
});

// Get All
export const getReasons = asyncHandler(async (req, res) => {
  const data = await rejectionReasonService.getReasons();

  return res
    .status(200)
    .json(new ApiResponse(200, "Rejection reasons fetched successfully", data));
});

// Get By ID
export const getReasonById = asyncHandler(async (req, res) => {
  const reason = await rejectionReasonService.getReasonById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Rejection reason fetched successfully", reason));
});

// Update
export const updateReason = asyncHandler(async (req, res) => {
  const reason = await rejectionReasonService.updateReason(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Rejection reason updated successfully", reason));
});

// Delete
export const deleteReason = asyncHandler(async (req, res) => {
  await rejectionReasonService.deleteReason(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Rejection reason deleted successfully"));
});