// src/auth/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SentMessageInfo, Options } from 'nodemailer/lib/smtp-transport';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter<SentMessageInfo, Options>;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async sendResetPasswordEmail(to: string, resetLink: string) {
    const mailOptions = {
      from: `"Support Team @Social-Chat-app" <${process.env.MAIL_USER}>`,
      to: to,
      subject: 'Reset Your Password',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d9488;">Password Reset Request</h2>
          <p>You requested to reset your password. Click the button below to proceed:</p>
          <a href="${resetLink}" style="background-color: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px;">Or copy this link:</p>
          <p style="color: #555;">${resetLink}</p>
          <p>This link will expire in 10 minutes.</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }
}
