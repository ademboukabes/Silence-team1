import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
    private resend: Resend;

    constructor() {
        this.resend = new Resend(process.env.RESEND_API_KEY);
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            const data = await this.resend.emails.send({
                from: 'onboarding@resend.dev',
                to,
                subject,
                html,
            });
            console.log('Email sent:', data);
            return data;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }
}
