export const validateCreateReason = (req, res, next) => {
  const { reasonName } = req.body;

  if (!reasonName || !reasonName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Rejection Reason is required",
    });
  }

  next();
};

export const validateUpdateReason = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  const { reasonName } = req.body;

  if (reasonName !== undefined && !reasonName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Rejection Reason cannot be empty",
    });
  }

  next();
};