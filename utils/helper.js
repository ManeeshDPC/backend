import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

export const comparePassword = async (password, hashed) => {
  return await bcrypt.compare(password, hashed);
};

export const expirationDate = (hours = 1) => {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
};
