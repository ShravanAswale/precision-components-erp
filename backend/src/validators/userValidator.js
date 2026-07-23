export const validateCreateUser = (req, res, next) => {
  const { fullName, email, password, role } = req.body;

  if (!fullName || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Full Name, Email, Password and Role are required",
    });
  }

  next();
};

export const validateUpdateUser = (req, res, next) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({
      success: false,
      message: "No data provided for update",
    });
  }

  next();
};