import { Router } from 'express';
import { addReview, getReviewsByCompany,getReviewsByUser, deleteReview } from '../controllers/reviewController.js';
const router = Router();

// POST /api/review - Add a review (user must be authenticated)
router.post('/', addReview);

// GET /api/review/company/:companyId - Get all reviews for a company
router.get('/company/:companyId', getReviewsByCompany);
router.get('/user/:userId', getReviewsByUser);
router.delete('/:reviewId', deleteReview);

export default router;
