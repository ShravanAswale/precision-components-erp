import Machine from "../models/Machine.js";
import ApiError from "../utils/ApiError.js";

// Create Machine
export const createMachine = async (machineData, createdBy) => {
  const { machineId, machineName, status } = machineData;

  // Validate required fields
  if (!machineId || !machineName) {
    throw new ApiError(400, "Machine ID and Machine Name are required");
  }

  // Check if Machine ID already exists
  const existingMachine = await Machine.findOne({
    machineId: machineId.trim(),
  });

  if (existingMachine) {
    throw new ApiError(409, "Machine ID already exists");
  }

  // Create machine using manually entered Machine ID
  const machine = await Machine.create({
    machineId: machineId.trim(),
    machineName: machineName.trim(),
    status: status || "Active",
    createdBy,
  });

  return machine;
};

// Get All Machines
export const getMachines = async () => {
  const machines = await Machine.find()
    .populate("createdBy", "fullName")
    .sort({ createdAt: -1 });

  return {
    count: machines.length,
    machines,
  };
};

// Get Machine By ID
export const getMachineById = async (id) => {
  const machine = await Machine.findById(id).populate(
    "createdBy",
    "fullName"
  );

  if (!machine) {
    throw new ApiError(404, "Machine not found");
  }

  return machine;
};

// Update Machine
export const updateMachine = async (id, machineData) => {
  const machine = await Machine.findById(id);

  if (!machine) {
    throw new ApiError(404, "Machine not found");
  }

  // If Machine ID is being changed, check for duplicate
  if (
    machineData.machineId &&
    machineData.machineId.trim() !== machine.machineId
  ) {
    const existingMachine = await Machine.findOne({
      machineId: machineData.machineId.trim(),
      _id: { $ne: id },
    });

    if (existingMachine) {
      throw new ApiError(409, "Machine ID already exists");
    }

    machine.machineId = machineData.machineId.trim();
  }

  // Update other fields
  if (machineData.machineName !== undefined) {
    machine.machineName = machineData.machineName.trim();
  }

  if (machineData.status !== undefined) {
    machine.status = machineData.status;
  }

  await machine.save();

  return machine;
};

// Delete Machine (Permanent Delete)
export const deleteMachine = async (id) => {
  const machine = await Machine.findById(id);

  if (!machine) {
    throw new ApiError(404, "Machine not found");
  }

  await Machine.findByIdAndDelete(id);

  return {
    success: true,
    message: "Machine deleted successfully",
  };
};