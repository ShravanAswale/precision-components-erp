import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as shiftService from "../services/shiftService.js";

export const createShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.createShift(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "Shift created successfully", shift));
});

export const getShifts = asyncHandler(async (req, res) => {
  const data = await shiftService.getShifts();

  return res
    .status(200)
    .json(new ApiResponse(200, "Shifts fetched successfully", data));
});

export const getShiftById = asyncHandler(async (req, res) => {
  const shift = await shiftService.getShiftById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Shift fetched successfully", shift));
});

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await shiftService.updateShift(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Shift updated successfully", shift));
});

export const deleteShift = asyncHandler(async (req, res) => {
  await shiftService.deleteShift(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Shift deactivated successfully"));
});