export const validateCreateOperator = (req, res, next) => {
  const { name, employeeCode } = req.body;

  if (!name || !employeeCode) {
    return res.status(400).json({
      success: false,
      message: "Name and Employee Code are required",
    });
  }

  next();
};

export const validateUpdateOperator = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};