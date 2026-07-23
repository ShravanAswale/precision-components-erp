import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as dashboardService from "../services/dashboardService.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getDashboard();

  return res
    .status(200)
    .json(new ApiResponse(200, "Dashboard fetched successfully", data));
});