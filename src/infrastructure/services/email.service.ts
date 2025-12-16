import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Email Service for sending confirmation emails and notifications
 * Uses Gmail SMTP with app password for authentication
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor() {
    // Configure Gmail SMTP transporter
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'duongvfe123@gmail.com',
        pass: 'vpkx zkfv ixzl jipv', // Gmail App Password
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('Email service configuration error:', error);
      } else {
        this.logger.log('Email service is ready to send messages');
      }
    });
  }

  /**
   * Send email confirmation link to new users
   * @param email User's email address
   * @param confirmationToken JWT token for verification
   * @param userName User's name
   */
  async sendConfirmationEmail(
    email: string,
    confirmationToken: string,
    userName?: string,
  ): Promise<void> {
    const confirmationUrl = `http://localhost:3000/auth/confirm/${confirmationToken}`;
    
    const mailOptions = {
      from: 'Banque AVENIR <duongvfe123@gmail.com>',
      to: email,
      subject: 'Confirm Your Email - Banque AVENIR',
      html: this.getConfirmationEmailTemplate(confirmationUrl, userName),
      text: `Welcome to Banque AVENIR! Please confirm your email by clicking this link: ${confirmationUrl}`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Confirmation email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      this.logger.error(`Failed to send confirmation email to ${email}:`, error);
      throw new Error('Failed to send confirmation email');
    }
  }

  /**
   * Send notification about savings rate change
   * @param email User's email
   * @param newRate New savings rate
   * @param userName User's name
   */
  async sendSavingsRateNotification(
    email: string,
    newRate: number,
    userName?: string,
  ): Promise<void> {
    const mailOptions = {
      from: 'Banque AVENIR <duongvfe123@gmail.com>',
      to: email,
      subject: 'Savings Rate Update - Banque AVENIR',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Savings Rate Update</h2>
          <p>Dear ${userName || 'Valued Customer'},</p>
          <p>We are writing to inform you that the savings interest rate has been updated.</p>
          <p><strong>New Rate:</strong> ${(newRate * 100).toFixed(2)}% per annum</p>
          <p>This change is effective immediately and will be reflected in your next interest calculation.</p>
          <p>Thank you for choosing Banque AVENIR.</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;">
          <p style="color: #7f8c8d; font-size: 12px;">Banque AVENIR - Alliance de Valeurs Économiques et Nationnales Investies Responsablement</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Savings rate notification sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send savings rate notification to ${email}:`, error);
      // Don't throw - notification is not critical
    }
  }

  /**
   * Get HTML template for confirmation email
   */
  private getConfirmationEmailTemplate(confirmationUrl: string, userName?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Confirm Your Email</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Banque AVENIR</h1>
                    <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 14px;">Alliance de Valeurs Économiques et Nationnales Investies Responsablement</p>
                  </td>
                </tr>
                
                <!-- Body -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Welcome${userName ? ', ' + userName : ''}!</h2>
                    <p style="color: #555555; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
                      Thank you for registering with Banque AVENIR. We're excited to have you join our modern banking platform.
                    </p>
                    <p style="color: #555555; line-height: 1.6; margin: 0 0 30px 0; font-size: 16px;">
                      To complete your registration and activate your account, please confirm your email address by clicking the button below:
                    </p>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding: 20px 0;">
                          <a href="${confirmationUrl}" 
                             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                    color: #ffffff; 
                                    padding: 16px 40px; 
                                    text-decoration: none; 
                                    border-radius: 6px; 
                                    font-weight: bold; 
                                    font-size: 16px;
                                    display: inline-block;
                                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            Confirm Email Address
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #777777; line-height: 1.6; margin: 30px 0 0 0; font-size: 14px;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color: #667eea; word-break: break-all; font-size: 13px; background-color: #f8f9fa; padding: 12px; border-radius: 4px; margin: 10px 0 0 0;">
                      ${confirmationUrl}
                    </p>
                    
                    <p style="color: #999999; line-height: 1.6; margin: 30px 0 0 0; font-size: 13px; font-style: italic;">
                      This link will expire in 24 hours. If you didn't create an account with Banque AVENIR, please ignore this email.
                    </p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                    <p style="color: #999999; margin: 0; font-size: 12px; line-height: 1.6;">
                      © 2025 Banque AVENIR. All rights reserved.<br>
                      Modern Banking for a Modern World
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  }
}
