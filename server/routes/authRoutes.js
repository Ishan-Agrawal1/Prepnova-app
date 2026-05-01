const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();


// =======================
// SIGNUP ROUTE
// =======================
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("Signup request initiated at:", new Date().toISOString());

    // Input validation
    if (!name || !email || !password) {
      console.log("Missing required fields");
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        message: "Name must be at least 2 characters long",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    console.log("Signup validation passed for:", email);

    // check if user already exists with timeout
    let existingUser;
    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => {
        console.log("User check query timeout!");
        resolve(null);
      }, 5000);
    });

    try {
      existingUser = await Promise.race([
        User.findOne({ email: email.toLowerCase() }).maxTimeMS(4000).exec(),
        queryTimeout,
      ]);
    } catch (queryError) {
      console.error("Query error during user check:", queryError);
      return res.status(500).json({
        message: "Database query failed",
        error: queryError.message,
      });
    }

    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({
        message: "User already exists",
      });
    }

    console.log("User does not exist, proceeding with signup");

    // hash password
    let hashedPassword;
    try {
      hashedPassword = await bcrypt.hash(password, 10);
      console.log("Password hashed successfully");
    } catch (bcryptError) {
      console.error("Password hashing error:", bcryptError);
      return res.status(500).json({
        message: "Password processing error",
      });
    }

    // create user
    let user;
    try {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
      });
      console.log("User created successfully:", user.email);
    } catch (createError) {
      console.error("User creation error:", createError);
      return res.status(500).json({
        message: "Failed to create user",
        error: createError.message,
      });
    }

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Signup error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error during signup",
      error: error.message,
    });
  }
});


// =======================
// LOGIN ROUTE
// =======================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("Login request initiated at:", new Date().toISOString());

    // Input validation
    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.log("Invalid email format:", email);
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    console.log("Login request body:", req.body);
    console.log("Email normalized:", email.toLowerCase());

    // Set a timeout for the database query
    let user;
    const queryTimeout = new Promise((resolve) => {
      setTimeout(() => {
        console.log("Database query timeout!");
        resolve(null);
      }, 5000);
    });

    try {
      // Race between the actual query and timeout
      user = await Promise.race([
        User.findOne({ email: email.toLowerCase() }).maxTimeMS(4000).exec(),
        queryTimeout,
      ]);
    } catch (queryError) {
      console.error("Query error:", queryError);
      return res.status(500).json({
        message: "Database query failed",
        error: queryError.message,
      });
    }

    console.log("User found:", !!user);

    if (!user) {
      return res.status(400).json({
        message: "User not found",
      });
    }

    // compare password
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error("Password comparison error:", bcryptError);
      return res.status(500).json({
        message: "Authentication error",
      });
    }

    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid password",
      });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      message: "Server error during login",
      error: error.message,
    });
  }
});


// =======================
module.exports = router;