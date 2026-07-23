export const validateCreateGage = (req, res, next) => {
  const {
    gageName,
    gageNumber,
    issueDate,
    calibrationDueDate,
  } = req.body;

  if (
    !gageName ||
    !gageNumber ||
    !issueDate ||
    !calibrationDueDate
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Gage Name, Gage Number, Issue Date and Calibration Due Date are required",
    });
  }

  next();
};

export const validateUpdateGage = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};