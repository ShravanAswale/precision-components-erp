import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as authService from "../services/authService.js";

// Register User
export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "User registered successfully", data));
});

// Login User
export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Login successful", data));
});