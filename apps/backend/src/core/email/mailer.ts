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
    return Boolean(
      config.email.brevoApiKey ||
      (config.email.smtp.host && config.email.smtp.user && config.email.smtp.pass)
    );
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

    if (config.email.brevoApiKey) {
      await this.sendWithBrevo(payload);
      return;
    }

    const transportOptions = {
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.secure,
      family: 4,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
      tls: {
        servername: config.email.smtp.host,
      },
    };

    const transporter = nodemailer.createTransport(transportOptions as any);

    await transporter.sendMail({
      from: config.email.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    });
  }

  private async sendWithBrevo(payload: MailPayload): Promise<void> {
    const from = this.parseFromAddress(config.email.from);
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': config.email.brevoApiKey!,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: from,
        to: [{ email: payload.to }],
        subject: payload.subject,
        htmlContent: payload.html,
        textContent: payload.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Brevo email send failed: ${response.status} ${body}`);
    }
  }

  private parseFromAddress(from: string): { name?: string; email: string } {
    const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (!match) {
      return { email: from.replace(/"/g, '').trim() };
    }

    return {
      name: match[1].replace(/"/g, '').trim() || undefined,
      email: match[2].trim(),
    };
  }
}
