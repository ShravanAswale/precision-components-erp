import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as pdirService from "../services/pdirService.js";

export const createPdir = asyncHandler(async (req, res) => {
  const pdir = await pdirService.createPdir(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "PDIR created successfully", pdir));
});

export const getPdirs = asyncHandler(async (req, res) => {
  const data = await pdirService.getPdirs();

  return res
    .status(200)
    .json(new ApiResponse(200, "PDIR records fetched successfully", data));
});

export const getPdirById = asyncHandler(async (req, res) => {
  const pdir = await pdirService.getPdirById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "PDIR fetched successfully", pdir));
});

export const updatePdir = asyncHandler(async (req, res) => {
  const pdir = await pdirService.updatePdir(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "PDIR updated successfully", pdir));
});

export const deletePdir = asyncHandler(async (req, res) => {
  await pdirService.deletePdir(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "PDIR deleted successfully"));
});