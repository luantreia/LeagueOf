import nodemailer from 'nodemailer';
import { config } from '@/config/environment';
import { logger } from '@/core/logging/logger';

interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class Mailer {
  isConfigured(): boolean {
    return Boolean(config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass);
  }

  async send(payload: MailPayload): Promise<void> {
    if (!this.isConfigured()) {
      if (config.env === 'production') {
        throw new Error('Email delivery is not configured');
      }

      logger.warn('Email is not configured. Outgoing email was skipped.', {
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
      });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });

    await transporter.sendMail({
      from: config.email.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }
}
