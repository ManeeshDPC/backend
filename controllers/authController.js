import pool from '../config/db/mysql.js';
import transporter from '../config/mailer.js';
import { generateToken, hashPassword, comparePassword, expirationDate } from '../utils/helper.js';
import jwt from 'jsonwebtoken';
import 'dotenv/config';  
import { confirmationEmailTemplate } from '../utils/emailTemplates.js';

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

const sendConfirmationEmail = async (email, token, name) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Confirm Your Email - Login Request',
    html: confirmationEmailTemplate(email, token, name),
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

// Registration - takes only email & name, sends confirmation email
export const register = async (req, res) => {
  const { email, name } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      if (user.is_confirmed) {
        return res.status(400).json({ error: 'User already exists and is confirmed' });
      } else {
        // Re-send confirmation email with new token
        const token = generateToken();
        const expiresAt = expirationDate();
        await pool.query(
          'UPDATE users SET confirmation_token = ?, confirmation_token_expires = ? WHERE email = ?',
          [token, expiresAt, email]
        );
        const emailSent = await sendConfirmationEmail(email, token, name);
        if (emailSent) {
          return res.json({ success: true, message: 'Confirmation email resent. Please check your email.' });
        } else {
          return res.status(500).json({ error: 'Failed to send confirmation email' });
        }
      }
    }

    // New user, create with no password, unconfirmed
    const token = generateToken();
    const expiresAt = expirationDate();

    await pool.query(
      'INSERT INTO users (email, full_name, is_confirmed, confirmation_token, confirmation_token_expires, provider) VALUES (?, ?, FALSE, ?, ?, ?)',
      [email, name || 'User', token, expiresAt, 'email']
    );

    const emailSent = await sendConfirmationEmail(email, token, name);
    if (emailSent) {
      res.json({ success: true, message: 'Confirmation email sent. Please check your email.' });
    } else {
      await pool.query('DELETE FROM users WHERE email = ? AND is_confirmed = FALSE', [email]);
      res.status(500).json({ error: 'Failed to send confirmation email' });
    }
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'User registration error' });
  }
};

// Set password after email confirmation using the token then login
export const setPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE confirmation_token = ? AND confirmation_token_expires > NOW() AND is_confirmed = FALSE',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    const user = rows[0];
    const hashedPassword = await hashPassword(password);

    await pool.query(
      'UPDATE users SET password = ?, is_confirmed = TRUE, confirmation_token = NULL, confirmation_token_expires = NULL WHERE id = ?',
      [hashedPassword, user.id]
    );

    const jwtToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', jwtToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax', secure: false });

    res.json({ success: true, message: 'Password set successfully and logged in.' });
  } catch (error) {
    console.error('SetPassword error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login with email and password
export const login = async (req, res) => {
  const { email, password } = req.body;
  console.log('Request body on login:', req.body);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    console.log('User found for login:', user);

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (!user.is_confirmed) {
      return res.status(403).json({
        error: 'Please confirm your email before logging in. Check your email for the confirmation link.',
      });
    }

    if (!user.password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax', secure: false });

    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login error' });
  }
};

// Confirm email by token - just marks user as confirmed, no password setup here
export const confirmEmail = async (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.status(400).json({ error: 'Confirmation token is required' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE confirmation_token = ? AND confirmation_token_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired confirmation token' });
    }

    // Keep user unconfirmed here, wait for password setup via setPassword endpoint

    res.json({
      success: true,
      message: 'Email token valid. Please set your password to complete registration.',
    });
  } catch (error) {
    console.error('Email confirmation error:', error);
    res.status(500).json({ error: 'Email confirmation error' });
  }
};


// Resend confirmation email for unconfirmed users
export const resendConfirmation = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? AND is_confirmed = FALSE', [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No unconfirmed account found for this email' });
    }

    const user = rows[0];
    const newToken = generateToken();
    const newExpires = expirationDate();

    await pool.query(
      'UPDATE users SET confirmation_token = ?, confirmation_token_expires = ? WHERE id = ?',
      [newToken, newExpires, user.id]
    );

    const emailSent = await sendConfirmationEmail(email, newToken, user.name);
    if (emailSent) {
      res.json({ success: true, message: 'Confirmation email resent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to resend confirmation email' });
    }
  } catch (error) {
    console.error('Resend confirmation error:', error);
    res.status(500).json({ error: 'Failed to resend confirmation email' });
  }
};