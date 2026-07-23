export const validateCreateProduction = (req, res, next) => {
  const {
    operator,
    date,
    shift,
    machine,
    operationNo,
    component,
  } = req.body;

  if (
    !operator ||
    !date ||
    !shift ||
    !machine ||
    !operationNo ||
    !component
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Operator, Date, Shift, Machine, Operation No and Component are required",
    });
  }

  next();
};

export const validateUpdateProduction = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};