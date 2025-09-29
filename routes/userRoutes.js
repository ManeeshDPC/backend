import express from 'express';
import { getCurrentUser, logout, cleanupUnconfirmed } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', getCurrentUser);
router.post('/logout', logout);
router.delete('/cleanup-unconfirmed', cleanupUnconfirmed);

export default router;
