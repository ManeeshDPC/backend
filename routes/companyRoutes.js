import express from 'express';
import { getCompanyByTitle, getCompanies } from '../controllers/companyController.js';

const router = express.Router();

router.get('/company', getCompanyByTitle);
router.get('/companies', getCompanies);

export default router;
