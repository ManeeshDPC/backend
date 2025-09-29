import pool from "../config/db/mysql.js";

export const getProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (rows.length === 0) return res.json({});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  const { userId } = req.params;
  const { full_name, company_name, location, job_title } = req.body;
  const profile_picture = req.file ? req.file.filename : null;

  try {
    const existingCheck = await pool.query("SELECT * FROM users WHERE id = ?", [userId]);
    if (existingCheck[0].length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const sqlUpdate = profile_picture
      ? "UPDATE users SET full_name = ?, company_name = ?, location = ?, job_title = ?, profile_picture = ? WHERE id = ?"
      : "UPDATE users SET full_name = ?, company_name = ?, location = ?, job_title = ? WHERE id = ?";

    const params = profile_picture
      ? [full_name, company_name, location, job_title, profile_picture, userId]
      : [full_name, company_name, location, job_title, userId];

    await pool.query(sqlUpdate, params);

    res.json({ success: true });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
