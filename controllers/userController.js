import jwt from "jsonwebtoken";
import pool from "../config/db/mysql.js";

export const getCurrentUser = async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: "Not authenticated" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query("SELECT id, email, full_name, profile_picture FROM users WHERE id = ?", [decoded.id]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });

    res.json(rows[0]);
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, path: "/" });
  res.status(200).json({ message: "Logged out successfully" });
};

export const cleanupUnconfirmed = async (req, res) => {
  try {
    await pool.query("DELETE FROM users WHERE is_confirmed = FALSE AND confirmation_token_expires < DATE_SUB(NOW(), INTERVAL 24 HOUR)");
    res.json({ success: true, message: "Expired unconfirmed accounts cleaned up" });
  } catch (error) {
    res.status(500).json({ error: "Cleanup error" });
  }
};
