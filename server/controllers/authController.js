const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// =======================
// SIGNUP
// =======================
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters long",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if user already exists (with timeout)
    let existingUser;
    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });

    try {
      existingUser = await Promise.race([
        User.findOne({ email: email.toLowerCase() }).maxTimeMS(4000).exec(),
        queryTimeout,
      ]);
    } catch (queryError) {
      console.error("Query error during user check:", queryError);
      return res.status(500).json({
        success: false,
        message: "Unable to verify account. Please try again.",
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
    } catch (bcryptError) {
      console.error("Password hashing error:", bcryptError);
      return res.status(500).json({
        success: false,
        message: "Account creation failed. Please try again.",
      });
    }

    // Create user
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
      });
    } catch (createError) {
      console.error("User creation error:", createError);
      return res.status(500).json({
        success: false,
        message: "Account creation failed. Please try again.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully! You can now log in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// LOGIN
// =======================
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address",
      });
    }

    // Find user (with timeout)
    let user;
    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => resolve(null), 5000);
    });

    try {
      user = await Promise.race([
        User.findOne({ email: email.toLowerCase() }).maxTimeMS(4000).exec(),
        queryTimeout,
      ]);
    } catch (queryError) {
      console.error("Query error:", queryError);
      return res.status(500).json({
        success: false,
        message: "Unable to connect. Please try again.",
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Compare password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError);
      return res.status(500).json({
        success: false,
        message: "Authentication failed. Please try again.",
      });
    }

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
