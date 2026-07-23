import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as reportService from "../services/reportService.js";

export const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getReports(req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Reports fetched successfully", data));
});