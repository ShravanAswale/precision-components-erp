export const validateCreateShift = (req, res, next) => {
  const { shiftName, startTime, endTime } = req.body;

  if (!shiftName || !startTime || !endTime) {
    return res.status(400).json({
      success: false,
      message: "Shift Name, Start Time and End Time are required",
    });
  }

  next();
};

export const validateUpdateShift = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};