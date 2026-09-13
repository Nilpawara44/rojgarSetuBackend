const asyncHandler = require("express-async-handler");
const Admin = require("../models/Admin");
const generateToken = require("../utils/generateToken");

// @desc    Admin login
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400);
    throw new Error("Username and password are required");
  }

  const admin = await Admin.findOne({ username: username.toLowerCase() }).select("+password");
  if (!admin) {
    res.status(401);
    throw new Error("Invalid username or password");
  }

  const isMatch = await admin.comparePassword(password);
  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid username or password");
  }

  res.json({
    success: true,
    data: {
      _id: admin._id,
      username: admin.username,
      name: admin.name,
      token: generateToken(admin._id)
    }
  });
});

// @desc    Get the logged-in admin's own profile — lets the frontend verify
//          a stored token is still valid on page load
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      _id: req.admin._id,
      username: req.admin.username,
      name: req.admin.name
    }
  });
});

module.exports = { login, getMe };
