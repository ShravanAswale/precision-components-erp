import Production from "../models/Production.js";
import ApiError from "../utils/ApiError.js";

const calculateGrade = (actual) => {
  if (actual >= 85) return "A";
  if (actual >= 70) return "B";
  if (actual >= 60) return "C";
  return "D";
};

// Create Production
export const createProduction = async (data, createdBy) => {
  const production = await Production.create({
    ...data,
    grade: calculateGrade(Number(data.actualProduction || 0)),
    createdBy,
  });

  return production;
};

// Get All Productions
export const getProductions = async () => {
  const productions = await Production.find()
    .populate("operator", "name operatorId")
    .populate("machine", "machineName machineId")
    .populate("component", "componentName partNumber")
    .sort({ createdAt: -1 });

  return {
    count: productions.length,
    productions,
  };
};

// Get Production By ID
export const getProductionById = async (id) => {
  const production = await Production.findById(id)
    .populate("operator", "name operatorId")
    .populate("machine", "machineName machineId")
    .populate("component", "componentName partNumber");

  if (!production) {
    throw new ApiError(404, "Production entry not found");
  }

  return production;
};

// Update Production
export const updateProduction = async (id, data) => {
  const production = await Production.findById(id);

  if (!production) {
    throw new ApiError(404, "Production entry not found");
  }

  // Update only the fields provided in the request
  Object.keys(data).forEach((key) => {
    production[key] = data[key];
  });

  // Always recalculate grade when production is updated
  production.grade = calculateGrade(
    Number(production.actualProduction || 0)
  );

  await production.save();

  return production;
};

// Delete Production
export const deleteProduction = async (id) => {
  const production = await Production.findById(id);

  if (!production) {
    throw new ApiError(404, "Production entry not found");
  }

  await production.deleteOne();

  return {
    success: true,
    message: "Production entry deleted successfully",
  };
};