import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import pool from "../config/db/mysql.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const googleId = profile.id;
        const profilePicture = profile.photos?.[0]?.value || null;

        // Look up existing user (by google or email)
        const [users] = await pool.query(
          "SELECT * FROM users WHERE google_id = ? OR email = ?",
          [googleId, email]
        );
        let user = users[0];

        if (!user) {
          // Insert new Google user confirmed, no password/token
          const [result] = await pool.query(
            "INSERT INTO users (email, provider, google_id, name, profile_picture, is_confirmed) VALUES (?, ?, ?, ?, ?, TRUE)",
            [email, "google", googleId, profile.displayName, profilePicture]
          );
          user = {
            id: result.insertId,
            email,
            google_id: googleId,
            name: profile.displayName,
            profile_picture: profilePicture,
            is_confirmed: 1
          };
        } else {
          // If user is Google and not confirmed, confirm now
          if (user.provider === "google" && !user.is_confirmed) {
            await pool.query(
              "UPDATE users SET is_confirmed = TRUE WHERE id = ?",
              [user.id]
            );
            user.is_confirmed = 1;
          }
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);

export default passport;
