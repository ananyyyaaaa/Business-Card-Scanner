import nodemailer from 'nodemailer';

// Try Resend API first (recommended for Render), then fall back to SMTP
const sendViaResend = async (email, otp) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) return null;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || process.env.RESEND_FROM || 'BizCard <onboarding@resend.dev>',
        to: [email],
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
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Resend API error');
    }

    return { success: true };
  } catch (error) {
    console.error('Resend API error:', error);
    return null; // Return null to fall back to SMTP
  }
};

// Create transporter – supports both service shortcuts (e.g. "gmail")
// and full SMTP host/port configuration for providers like Resend/Mailgun.
const createTransporter = () => {
  const {
    EMAIL_SERVICE,
    EMAIL_HOST,
    EMAIL_PORT,
    EMAIL_USER,
    EMAIL_PASS,
    EMAIL_SECURE,
  } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email credentials are not configured');
  }

  if (EMAIL_HOST) {
    return nodemailer.createTransport({
      host: EMAIL_HOST,
      port: Number(EMAIL_PORT) || 587,
      secure: EMAIL_SECURE
        ? EMAIL_SECURE === 'true'
        : Number(EMAIL_PORT || 587) === 465,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
      connectionTimeout: 10000, // Reduced from 20s to 10s
      greetingTimeout: 5000,
      socketTimeout: 10000,
      // Retry configuration
      pool: true,
      maxConnections: 1,
      maxMessages: 3,
    });
  }

  return nodemailer.createTransport({
    service: EMAIL_SERVICE || 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

export const sendOtpEmail = async (email, otp) => {
  // Try Resend API first (works better on Render)
  if (process.env.RESEND_API_KEY) {
    const resendResult = await sendViaResend(email, otp);
    if (resendResult) {
      return resendResult;
    }
    console.log('Resend API failed, falling back to SMTP');
  }

  // Fall back to SMTP
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
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
    console.error('Error details:', {
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    
    // If email service is not configured, log OTP to console for development
    if (process.env.NODE_ENV !== 'production' || (!process.env.EMAIL_HOST && !process.env.RESEND_API_KEY)) {
      console.log(`[DEV MODE] OTP for ${email}: ${otp}`);
      return { success: true };
    }
    
    // Provide more specific error message
    const errorMessage = error.code === 'ETIMEDOUT' 
      ? 'Email server connection timeout. Consider using Resend API (set RESEND_API_KEY) instead of SMTP for better reliability on Render.'
      : error.code === 'EAUTH'
      ? 'Email authentication failed. Check EMAIL_USER and EMAIL_PASS.'
      : error.message || 'Failed to send email';
    
    throw new Error(errorMessage);
  }
};

