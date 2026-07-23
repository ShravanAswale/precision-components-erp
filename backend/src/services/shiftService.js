import Shift from "../models/Shift.js";
import ApiError from "../utils/ApiError.js";

export const createShift = async (shiftData, createdBy) => {
  const { shiftName, startTime, endTime } = shiftData;

  const shiftId = `SFT${Date.now()}`;

  const shift = await Shift.create({
    shiftId,
    shiftName,
    startTime,
    endTime,
    createdBy,
  });

  return shift;
};

export const getShifts = async () => {
  const shifts = await Shift.find()
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: shifts.length,
    shifts,
  };
};

export const getShiftById = async (id) => {
  const shift = await Shift.findById(id).populate(
    "createdBy",
    "fullName"
  );

  if (!shift) {
    throw new ApiError(404, "Shift not found");
  }

  return shift;
};

export const updateShift = async (id, shiftData) => {
  const shift = await Shift.findById(id);

  if (!shift) {
    throw new ApiError(404, "Shift not found");
  }

  shift.shiftName = shiftData.shiftName ?? shift.shiftName;
  shift.startTime = shiftData.startTime ?? shift.startTime;
  shift.endTime = shiftData.endTime ?? shift.endTime;
  shift.isActive = shiftData.isActive ?? shift.isActive;

  await shift.save();

  return shift;
};

export const deleteShift = async (id) => {
  const shift = await Shift.findById(id);

  if (!shift) {
    throw new ApiError(404, "Shift not found");
  }

  shift.isActive = false;

  await shift.save();
};