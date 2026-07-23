import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

export const register = async (userData) => {
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
  });

  const token = user.generateToken();

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  };
};

export const login = async (loginData) => {
  const { email, password } = loginData;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = user.generateToken();

  return {
    token,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      employeeId: user.employeeId,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  };
};