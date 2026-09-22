import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as productionService from "../services/productionService.js";

export const createProduction = asyncHandler(async (req, res) => {
  const production = await productionService.createProduction(
    req.body,
    req.user._id
  );

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        "Production created successfully",
        production
      )
    );
});

export const getProductions = asyncHandler(async (req, res) => {
  const data = await productionService.getProductions();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Production fetched successfully",
        data
      )
    );
});

export const getProductionById = asyncHandler(async (req, res) => {
  const production = await productionService.getProductionById(
    req.params.id
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Production fetched successfully",
        production
      )
    );
});

export const updateProduction = asyncHandler(async (req, res) => {
  const production = await productionService.updateProduction(
    req.params.id,
    req.body
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "Production updated successfully",
        production
      )
    );
});

export const deleteProduction = asyncHandler(async (req, res) => {
  await productionService.deleteProduction(req.params.id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Production deleted successfully")
    );
});