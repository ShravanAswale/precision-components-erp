const validateRejectionBreakdown = (qtyRejected, rejections = []) => {
  const rejected = Number(qtyRejected || 0);

  if (rejected === 0) return null;

  if (!Array.isArray(rejections) || rejections.length === 0) {
    return "Please add at least one rejection reason";
  }

  const invalid = rejections.some(
    (item) => !item.reason || Number(item.qty || 0) <= 0
  );

  if (invalid) {
    return "Every rejection must have a reason and valid quantity";
  }

  const reasons = rejections.map((item) => item.reason);

  if (new Set(reasons).size !== reasons.length) {
    return "Duplicate rejection reasons are not allowed";
  }

  const total = rejections.reduce(
    (sum, item) => sum + Number(item.qty || 0),
    0
  );

  if (total !== rejected) {
    return `Rejection quantity mismatch. Total rejected quantity is ${rejected}, but breakdown totals ${total}`;
  }

  return null;
};

export const validateCreatePdir = (req, res, next) => {
  const {
    partName,
    partNumber,
    checkingOperator,
    packingOperator,
    qtyChecked,
    qtyRejected,
    rejections,
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

  const rejectionError = validateRejectionBreakdown(rejected, rejections);

  if (rejectionError) {
    return res.status(400).json({
      success: false,
      message: rejectionError,
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

  const { qtyChecked, qtyRejected, rejections } = req.body;

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

  if (qtyRejected !== undefined) {
    const rejectionError = validateRejectionBreakdown(
      Number(qtyRejected),
      rejections
    );

    if (rejectionError) {
      return res.status(400).json({
        success: false,
        message: rejectionError,
      });
    }
  }

  next();
};