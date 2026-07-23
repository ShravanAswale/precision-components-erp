export const validateCreateComponent = (req, res, next) => {
  const { componentName, partNumber } = req.body;

  if (!componentName || !partNumber) {
    return res.status(400).json({
      success: false,
      message: "Component Name and Part Number are required",
    });
  }

  next();
};

export const validateUpdateComponent = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};