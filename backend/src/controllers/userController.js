import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import * as userService from "../services/userService.js";

// Create User
export const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body, req.user._id);

  return res
    .status(201)
    .json(new ApiResponse(201, "User created successfully", user));
});

// Get All Users
export const getUsers = asyncHandler(async (req, res) => {
  const data = await userService.getUsers();

  return res
    .status(200)
    .json(new ApiResponse(200, "Users fetched successfully", data));
});

// Get User By ID
export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "User fetched successfully", user));
});

// Update User
export const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully", user));
});

// Soft Delete User
export const deleteUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "User deactivated successfully"));
});