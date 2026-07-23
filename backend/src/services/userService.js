import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export const createUser = async (userData, createdBy) => {
  const {
    fullName,
    email,
    password,
    phone,
    employeeId,
    role,
  } = userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(400, "Email already exists");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    phone,
    employeeId,
    role,
    createdBy,
  });

  return user;
};

export const getUsers = async () => {
  const users = await User.find()
    .select("-password")
    .populate("createdBy", "fullName email");

  return {
    count: users.length,
    users,
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .select("-password")
    .populate("createdBy", "fullName email");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

export const updateUser = async (id, userData) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const {
    fullName,
    email,
    phone,
    employeeId,
    role,
    isActive,
  } = userData;

  user.fullName = fullName ?? user.fullName;
  user.email = email ?? user.email;
  user.phone = phone ?? user.phone;
  user.employeeId = employeeId ?? user.employeeId;
  user.role = role ?? user.role;
  user.isActive = isActive ?? user.isActive;

  await user.save();

  return user;
};

export const deleteUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.isActive = false;

  await user.save();

  return;
};