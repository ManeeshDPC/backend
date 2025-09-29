import express from "express";
import passport from "../config/passport.js";
import jwt from "jsonwebtoken";
import {
  register,
  login,
  confirmEmail,
  resendConfirmation,
  setPassword
} from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/confirm-email", confirmEmail);
router.post("/resend-confirmation", resendConfirmation);
router.post('/set-password', setPassword);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "1d" }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: false,
      path: "/"
    });
    res.contentType("text/html").send(`
  <html>
    <head>
      <script>window.location = "http://localhost:3000/dashboard";</script>
    </head>
    <body>Redirecting...</body>
  </html>
`);

  }
);

export default router;
