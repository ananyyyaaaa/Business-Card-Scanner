import nodemailer from 'nodemailer';

// Create transporter - using Gmail as default, can be configured via env
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP for BizCard',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #60a5fa;">BizCard OTP Verification</h2>
          <p>Your OTP code is:</p>
          <div style="background: linear-gradient(135deg, #60a5fa, #f472b6); color: white; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this OTP, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    // If email service is not configured, log OTP to console for development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return { success: true };
    }
    throw new Error('Failed to send email');
  }
};

