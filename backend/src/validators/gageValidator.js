export const validateCreateGage = (req, res, next) => {
  const {
    gageName,
    gageNumber,
    issueDate,
    calibrationPeriod, // Added as required field
    calibrationDueDate,
  } = req.body;

  if (
    !gageName ||
    !gageNumber ||
    !issueDate ||
    !calibrationPeriod ||
    !calibrationDueDate
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Gage Name, Gage Number, Issue Date, Calibration Period and Calibration Due Date are required",
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