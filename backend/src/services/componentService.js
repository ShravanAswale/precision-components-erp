import Component from "../models/Component.js";
import ApiError from "../utils/ApiError.js";

// Create Component
export const createComponent = async (componentData, createdBy) => {
  const { componentName, partNumber } = componentData;

  const existing = await Component.findOne({ partNumber });

  if (existing) {
    throw new ApiError(400, "Part Number already exists");
  }

  const componentId = `CMP${Date.now()}`;

  const component = await Component.create({
    componentId,
    componentName,
    partNumber,
    createdBy,
  });

  return component;
};

// Get All Components
export const getComponents = async () => {
  const components = await Component.find()
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: components.length,
    components,
  };
};

// Get Component By ID
export const getComponentById = async (id) => {
  const component = await Component.findById(id).populate(
    "createdBy",
    "fullName"
  );

  if (!component) {
    throw new ApiError(404, "Component not found");
  }

  return component;
};

// Update Component
export const updateComponent = async (id, componentData) => {
  const component = await Component.findById(id);

  if (!component) {
    throw new ApiError(404, "Component not found");
  }

  component.componentName =
    componentData.componentName ?? component.componentName;

  component.partNumber =
    componentData.partNumber ?? component.partNumber;

  await component.save();

  return component;
};

// Delete Component (Permanent Delete)
export const deleteComponent = async (id) => {
  const component = await Component.findById(id);

  if (!component) {
    throw new ApiError(404, "Component not found");
  }

  await Component.findByIdAndDelete(id);

  return {
    success: true,
    message: "Component deleted successfully",
  };
};