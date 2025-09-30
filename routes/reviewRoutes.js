import { Router } from 'express';
import { addReview, getReviewsByCompany,getReviewsByUser, deleteReview } from '../controllers/reviewController.js';
const router = Router();

router.post('/', addReview);
router.get('/company/:companyId', getReviewsByCompany);
router.get('/user/:userId', getReviewsByUser);
router.delete('/:reviewId', deleteReview);

export default router;
