import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Initialize email transporter based on environment
    if (process.env.NODE_ENV === 'production') {
      // Production: Use real SMTP service (e.g., SendGrid, AWS SES, etc.)
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Development: Use Ethereal for testing (creates temp account)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: {
          user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.ETHEREAL_PASSWORD || 'ethereal-password',
        },
      });
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Project Management System" <noreply@projectmgmt.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // In development mode, log the reset URL to console instead of sending email
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n========================================');
      console.log('PASSWORD RESET EMAIL');
      console.log('========================================');
      console.log('To:', email);
      console.log('Reset URL:', resetUrl);
      console.log('Reset Token:', resetToken);
      console.log('========================================\n');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #3b82f6;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for your account. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
            <div class="footer">
              <p>Project Management System</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Reset Request

You requested a password reset for your account. Copy and paste this link into your browser to reset your password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

Project Management System
This is an automated email. Please do not reply.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html,
      text,
    });
  }

  async sendPasswordChangedEmail(email: string, firstName: string): Promise<void> {
    // In development mode, log to console instead of sending email
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n========================================');
      console.log('PASSWORD CHANGED CONFIRMATION EMAIL');
      console.log('========================================');
      console.log('To:', email);
      console.log('User:', firstName);
      console.log('Message: Password has been changed successfully');
      console.log('========================================\n');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .alert {
              padding: 15px;
              background-color: #fef2f2;
              border-left: 4px solid #ef4444;
              margin: 20px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Password Changed Successfully</h2>
            <p>Hi ${firstName},</p>
            <p>This email confirms that your password was recently changed.</p>
            <div class="alert">
              <strong>Security Alert:</strong> If you did not make this change, please contact our support team immediately.
            </div>
            <p>For your security, all active sessions have been logged out. You'll need to log in again with your new password.</p>
            <div class="footer">
              <p>Project Management System</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Password Changed Successfully

Hi ${firstName},

This email confirms that your password was recently changed.

SECURITY ALERT: If you did not make this change, please contact our support team immediately.

For your security, all active sessions have been logged out. You'll need to log in again with your new password.

Project Management System
This is an automated email. Please do not reply.
    `;

    await this.sendEmail({
      to: email,
      subject: 'Password Changed Successfully',
      html,
      text,
    });
  }
}

export default new EmailService();