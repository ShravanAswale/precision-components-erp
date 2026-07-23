import Operator from "../models/Operator.js";
import ApiError from "../utils/ApiError.js";

// Create Operator
export const createOperator = async (operatorData, createdBy) => {
  const { name, shift } = operatorData;

  const operatorId = `OPR${Date.now()}`;

  const operator = await Operator.create({
    operatorId,
    name,
    shift,
    createdBy,
  });

  return operator;
};

// Get All Operators
export const getOperators = async () => {
  const operators = await Operator.find()
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: operators.length,
    operators,
  };
};

// Get Operator By ID
export const getOperatorById = async (id) => {
  const operator = await Operator.findById(id).populate(
    "createdBy",
    "fullName"
  );

  if (!operator) {
    throw new ApiError(404, "Operator not found");
  }

  return operator;
};

// Update Operator
export const updateOperator = async (id, operatorData) => {
  const operator = await Operator.findById(id);

  if (!operator) {
    throw new ApiError(404, "Operator not found");
  }

  operator.name = operatorData.name ?? operator.name;
  operator.shift = operatorData.shift ?? operator.shift;

  await operator.save();

  return operator;
};

// Delete Operator (Permanent Delete)
export const deleteOperator = async (id) => {
  const operator = await Operator.findById(id);

  if (!operator) {
    throw new ApiError(404, "Operator not found");
  }

  await Operator.findByIdAndDelete(id);

  return {
    success: true,
    message: "Operator deleted successfully",
  };
};