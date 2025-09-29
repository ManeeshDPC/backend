import pool from '../config/db/mysql.js';

export const getCompanyByTitle = async (req, res) => {
  try {
    const title = decodeURIComponent(req.query.title);
    if (!title) {
      return res.status(400).json({ error: "Missing 'title' query parameter" });
    }

    const sql = 'SELECT * FROM companies WHERE LOWER(title) = LOWER(?) LIMIT 1';
    const params = [title];
    const [rows] = await pool.query(sql, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    const company = rows[0];
    return res.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getCompanies = async (req, res) => {
  const { service } = req.query;
  let sql = 'SELECT * FROM companies';
  const params = [];

  if (service) {
    sql += ' WHERE services LIKE ?';
    params.push(`%${service}%`);
  }

  try {
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database query error' });
  }
};
