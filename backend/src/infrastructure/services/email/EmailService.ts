import nodemailer from 'nodemailer';
import { config } from '../../../config/env';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (config.email.host && config.email.user && config.email.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port || 587,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
      });
    } else {
      console.warn('Email configuration not provided. Using mock email service.');
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  async sendTemporaryPassword(
    to: string,
    temporaryPassword: string
  ): Promise<void> {
    const subject = 'Your Temporary Password - Facial Authentication System';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Temporary Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .password-box { background: #fff; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; font-size: 24px; font-weight: bold; color: #333; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Facial Authentication System</h1>
          </div>
          <div class="content">
            <h2>Your Account Has Been Created</h2>
            <p>Hello,</p>
            <p>An administrator has created an account for you in our Facial Authentication System.</p>
            
            <p>Please use the following temporary password to login:</p>
            
            <div class="password-box">
              ${temporaryPassword}
            </div>
            
            <div class="warning">
              <strong>Important Security Notice:</strong>
              <ul>
                <li>This password is temporary and will expire after first use</li>
                <li>You must complete your profile setup after login</li>
                <li>Set up facial recognition for secure two-factor authentication</li>
              </ul>
            </div>
            
            <p>To get started:</p>
            <ol>
              <li>Go to the login page</li>
              <li>Enter your email: <strong>${to}</strong></li>
              <li>Use the temporary password above</li>
              <li>Complete your profile and facial registration</li>
            </ol>
            
            <a href="${config.env === 'production' ? 'https://yourapp.com' : 'http://localhost:3000'}/login" class="button">
              Go to Login Page
            </a>
            
            <p>If you did not request this account, please contact our support team immediately.</p>
            
            <div class="footer">
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Facial Authentication System. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendPasswordReset(
    to: string,
    resetToken: string
  ): Promise<void> {
    const subject = 'Password Reset Request - Facial Authentication System';
    const resetUrl = `${config.env === 'production' ? 'https://yourapp.com' : 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body>
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </body>
      </html>
    `;

    await this.sendEmail(to, subject, html);
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.email.from || 'noreply@facialauth.com',
        to,
        subject,
        text: text || this.htmlToText(html),
        html,
      });

      console.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error('Error sending email:', error);
      // In production, you might want to queue the email or use a fallback service
      throw new Error('Failed to send email');
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();