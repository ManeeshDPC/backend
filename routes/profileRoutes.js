import express from 'express';
import multer from 'multer';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import path from 'path';
import fs from 'fs';

// Configure multer to store uploads in 'uploads/profile_pics' folder
const uploadDir = path.join(process.cwd(), 'uploads', 'profile_pics');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Unique filename: timestamp-originalname
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const router = express.Router();

router.get('/:userId', getProfile);
router.post('/:userId', upload.single('profile_picture'), updateProfile);

export default router;
