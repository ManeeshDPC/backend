import 'dotenv/config';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const confirmationEmailTemplate = (email, token, name = 'User') => {
  const confirmationUrl = `${FRONTEND_URL}/confirm-email?token=${token}`;

  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #4eb8dd, #217093); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Email Confirmation</h1>
      </div>
      <div style="padding: 30px; background: #f9f9f9;">
        <h2 style="color: #333;">Hello ${name}!</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
          We received a login request for your email address. To complete the process and verify your account, 
          please click the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${confirmationUrl}" style="background: #4eb8dd; color: white; padding: 12px 30px; text-decoration: none; 
            border-radius: 5px; font-weight: bold; display: inline-block;">
            Confirm Email & Login
          </a>
        </div>
        <p style="color: #888; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this login, you can safely ignore this email.
        </p>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">
          If the button doesn't work, copy and paste this link into your browser:<br>
          <a href="${confirmationUrl}" style="color: #4eb8dd;">${confirmationUrl}</a>
        </p>
      </div>
    </div>
  `;
};
