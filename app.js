import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import companyRouter from './routes/companyRoutes.js';
import profileRouter from './routes/profileRoutes.js';
import path from "path";
import reviewRoutes from './routes/reviewRoutes.js';
const app = express();

app.use(cookieParser());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api', userRouter);
app.use('/api', companyRouter);
app.use('/api/profile', profileRouter);
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use('/api/review', reviewRoutes);

app.get('/', (req, res) => {
  res.send('Express backend running');
});

export default app;

