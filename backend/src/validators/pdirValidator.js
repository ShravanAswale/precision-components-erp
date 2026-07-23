export const validateCreatePdir = (req, res, next) => {
  const {
    partName,
    partNumber,
    checkingOperator,
    packingOperator,
    qtyChecked,
    qtyRejected,
    rejectionReason,
  } = req.body;

  // Required fields
  if (
    !partName ||
    !partNumber ||
    !checkingOperator ||
    !packingOperator ||
    qtyChecked === undefined ||
    qtyChecked === null ||
    qtyChecked === ""
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Part Name, Part Number, Checking Operator, Packing Operator and Qty Checked are required",
    });
  }

  // Validate quantities
  const checked = Number(qtyChecked);
  const rejected = Number(qtyRejected || 0);

  if (Number.isNaN(checked) || checked < 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity Checked must be a valid non-negative number",
    });
  }

  if (Number.isNaN(rejected) || rejected < 0) {
    return res.status(400).json({
      success: false,
      message: "Quantity Rejected must be a valid non-negative number",
    });
  }

  if (rejected > checked) {
    return res.status(400).json({
      success: false,
      message: "Quantity Rejected cannot be greater than Quantity Checked",
    });
  }

  // Rejection reason is mandatory when rejected quantity is greater than 0
  if (rejected > 0 && !rejectionReason?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Type of Rejection is required when Quantity Rejected is greater than 0",
    });
  }

  next();
};

export const validateUpdatePdir = (req, res, next) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  const { qtyChecked, qtyRejected, rejectionReason } = req.body;

  if (
    qtyChecked !== undefined &&
    (Number.isNaN(Number(qtyChecked)) || Number(qtyChecked) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Quantity Checked must be a valid non-negative number",
    });
  }

  if (
    qtyRejected !== undefined &&
    (Number.isNaN(Number(qtyRejected)) || Number(qtyRejected) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Quantity Rejected must be a valid non-negative number",
    });
  }

  if (
    qtyChecked !== undefined &&
    qtyRejected !== undefined &&
    Number(qtyRejected) > Number(qtyChecked)
  ) {
    return res.status(400).json({
      success: false,
      message: "Quantity Rejected cannot be greater than Quantity Checked",
    });
  }

  if (
    qtyRejected !== undefined &&
    Number(qtyRejected) > 0 &&
    rejectionReason !== undefined &&
    !rejectionReason?.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Type of Rejection is required when Quantity Rejected is greater than 0",
    });
  }

  next();
};