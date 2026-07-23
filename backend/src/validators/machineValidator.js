export const validateCreateMachine = (req, res, next) => {
  const { machineName } = req.body;

  if (!machineName) {
    return res.status(400).json({
      success: false,
      message: "Machine Name is required",
    });
  }

  next();
};

export const validateUpdateMachine = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};