import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as machineService from "../services/machineService.js";

export const createMachine = asyncHandler(async (req, res) => {
  const machine = await machineService.createMachine(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "Machine created successfully", machine));
});

export const getMachines = asyncHandler(async (req, res) => {
  const data = await machineService.getMachines();

  return res
    .status(200)
    .json(new ApiResponse(200, "Machines fetched successfully", data));
});

export const getMachineById = asyncHandler(async (req, res) => {
  const machine = await machineService.getMachineById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Machine fetched successfully", machine));
});

export const updateMachine = asyncHandler(async (req, res) => {
  const machine = await machineService.updateMachine(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Machine updated successfully", machine));
});

export const deleteMachine = asyncHandler(async (req, res) => {
  await machineService.deleteMachine(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Machine deactivated successfully"));
});