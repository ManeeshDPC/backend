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

        const [users] = await pool.query(
          "SELECT * FROM users WHERE google_id = ? OR email = ?",
          [googleId, email]
        );
        let user = users[0];

        if (!user) {
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
            is_confirmed: 1,
          };
        } else {
          // Link google ID if missing
          if (!user.google_id) {
            await pool.query(
              "UPDATE users SET google_id = ?, provider = 'google' WHERE id = ?",
              [googleId, user.id]
            );
            user.google_id = googleId;
            user.provider = "google";
          }
          // Confirm user if google provider and not confirmed
          if (user.provider === "google" && !user.is_confirmed) {
            await pool.query("UPDATE users SET is_confirmed = TRUE WHERE id = ?", [
              user.id,
            ]);
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
