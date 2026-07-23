import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as componentService from "../services/componentService.js";

export const createComponent = asyncHandler(async (req, res) => {
  const component = await componentService.createComponent(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "Component created successfully", component));
});

export const getComponents = asyncHandler(async (req, res) => {
  const data = await componentService.getComponents();

  return res
    .status(200)
    .json(new ApiResponse(200, "Components fetched successfully", data));
});

export const getComponentById = asyncHandler(async (req, res) => {
  const component = await componentService.getComponentById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Component fetched successfully", component));
});

export const updateComponent = asyncHandler(async (req, res) => {
  const component = await componentService.updateComponent(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Component updated successfully", component));
});

export const deleteComponent = asyncHandler(async (req, res) => {
  await componentService.deleteComponent(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Component deactivated successfully"));
});