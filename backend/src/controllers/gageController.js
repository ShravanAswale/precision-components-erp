import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as gageService from "../services/gageService.js";

export const createGage = asyncHandler(async (req, res) => {
  const gage = await gageService.createGage(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "Gage created successfully", gage));
});

export const getGages = asyncHandler(async (req, res) => {
  const data = await gageService.getGages();

  return res
    .status(200)
    .json(new ApiResponse(200, "Gages fetched successfully", data));
});

export const getGageById = asyncHandler(async (req, res) => {
  const gage = await gageService.getGageById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Gage fetched successfully", gage));
});

export const updateGage = asyncHandler(async (req, res) => {
  const gage = await gageService.updateGage(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Gage updated successfully", gage));
});

export const deleteGage = asyncHandler(async (req, res) => {
  await gageService.deleteGage(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Gage deleted successfully"));
});