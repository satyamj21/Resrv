import { pool } from "../db/pool.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const fields = [name, email, password];
    const hasEmptyFields = fields.some(
      (field) => !field || field.trim() === "",
    );

    if (hasEmptyFields) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const result = await pool.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);

    const existingUser = result.rows[0];

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUser = await pool.query(
      `INSERT INTO users (name, email, password_hash)
   VALUES ($1, $2, $3)
   RETURNING id, name, email, role, created_at`,
      [name, email, hashedPassword],
    );

    const newUser = insertUser.rows[0];

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "User registration failed.",
      });
    }
    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: newUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const fields = [email, password];
    const hasEmptyFields = fields.some(
      (field) => !field || field.trim() === "",
    );

    if (hasEmptyFields) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("accessToken", token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

const logoutUser = (req, res) => {
  res.clearCookie("accessToken", cookieOptions);
  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const getProfile = async (req, res) => {
  try {
    const userProfile = await pool.query(
      "SELECT id, name, email, role, created_at FROM users WHERE id = $1",
      [req.user.id],
    );
    const user = userProfile.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export { registerUser, loginUser, logoutUser, getProfile };
