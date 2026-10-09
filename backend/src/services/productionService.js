import Production from "../models/Production.js";
import ApiError from "../utils/ApiError.js";

// Grade based on efficiency % = (actualProduction / targetProduction) * 100
const calculateGrade = (actualProduction, targetProduction) => {
  const actual = Number(actualProduction || 0);
  const target = Number(targetProduction || 0);
  if (target <= 0) return "D";
  const efficiencyPct = (actual / target) * 100;
  if (efficiencyPct >= 85) return "A";
  if (efficiencyPct >= 70) return "B";
  if (efficiencyPct >= 60) return "C";
  return "D";
};

// Create Production
export const createProduction = async (data, createdBy) => {
  const production = await Production.create({
    ...data,
    startQty: Number(data.startQty || 0),
    exitQty: Number(data.exitQty || 0),
    difference: Number(data.difference || 0),
    grade: calculateGrade(Number(data.actualProduction || 0), Number(data.targetProduction || 0)),
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

  // Recalculate difference if Start/Exit Qty changes
  if (
    data.startQty !== undefined ||
    data.exitQty !== undefined
  ) {
    production.difference =
      Number(production.exitQty || 0) -
      Number(production.startQty || 0);
  }

  // Always recalculate grade when production is updated
  production.grade = calculateGrade(
    Number(production.actualProduction || 0),
    Number(production.targetProduction || 0)
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