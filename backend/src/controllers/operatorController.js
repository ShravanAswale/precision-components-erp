import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as operatorService from "../services/operatorService.js";

export const createOperator = asyncHandler(async (req, res) => {
  const operator = await operatorService.createOperator(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "Operator created successfully", operator));
});

export const getOperators = asyncHandler(async (req, res) => {
  const data = await operatorService.getOperators();

  return res
    .status(200)
    .json(new ApiResponse(200, "Operators fetched successfully", data));
});

export const getOperatorById = asyncHandler(async (req, res) => {
  const operator = await operatorService.getOperatorById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Operator fetched successfully", operator));
});

export const updateOperator = asyncHandler(async (req, res) => {
  const operator = await operatorService.updateOperator(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Operator updated successfully", operator));
});

export const deleteOperator = asyncHandler(async (req, res) => {
  await operatorService.deleteOperator(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Operator deactivated successfully"));
});