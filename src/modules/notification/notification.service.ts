import { HttpException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateNotificationDto } from './notificationDto/createNotification.dto';
import { Notification } from '@prisma/client';
import * as firebase from 'firebase-admin';
import { Resend } from 'resend';
import * as path from 'path';
import * as fs from 'fs';

const firebaseConfigPath = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'firebase-adminsdk.json',
);

if (fs.existsSync(firebaseConfigPath)) {
  firebase.initializeApp({
    credential: firebase.credential.cert(firebaseConfigPath),
  });
} else {
  console.warn(
    'firebase-adminsdk.json not found. Push notifications will be disabled.',
  );
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private resend: Resend;

  constructor(private prismaService: PrismaService) {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async createNotification(
    notificationDto: CreateNotificationDto,
  ): Promise<Notification | null> {
    try {
      let createdNotification = await this.prismaService.notification.create({
        data: notificationDto,
      });
      let { title, body } = notificationDto;
      if (firebase.apps.length > 0) {
        await firebase
          .messaging()
          .send({
            notification: { title, body },
            token: notificationDto.notification_token,
          })
          .catch((error: any) => {
            console.error('error while sending message: ', error);
          });
      } else {
        // console.warn('Firebase not initialized, skipping push notification.');
      }
      return createdNotification;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendBookingEmail(type: 'CONFIRMATION' | 'REJECTION' | 'CANCELLATION', booking: any) {
    const { driverEmail, driverName, id, qrCode } = booking;

    // Default fallback if no API key
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 're_123456789') {
      this.logger.warn('RESEND_API_KEY not set or is default. Skipping actual email sending.');
      return false;
    }

    try {
      let subject = `Booking Update: ${type} - ${id}`;
      let htmlContent = `<p>Hello ${driverName},</p>`;

      if (type === 'CONFIRMATION') {
        htmlContent += `
                <p>Your booking <strong>${id}</strong> has been <strong>CONFIRMED</strong>.</p>
                <p>Please present the QR code below at the gate:</p>
                <img src="${qrCode}" alt="Booking QR Code" style="width: 200px; height: 200px;" />
            `;
      } else if (type === 'REJECTION') {
        htmlContent += `<p>Your booking request <strong>${id}</strong> has been <strong>REJECTED</strong> by the terminal operator.</p>`;
      } else {
        htmlContent += `<p>Booking <strong>${id}</strong> has been <strong>CANCELLED</strong>.</p>`;
      }

      htmlContent += `<br/><p>Best regards,<br/>Smart Port Logistics Team</p>`;

      const response = await this.resend.emails.send({
        from: 'Smart Port <onboarding@resend.dev>', // Use default Resend domain for testing
        to: [driverEmail],
        subject: subject,
        html: htmlContent,
      });

      this.logger.log(`📧 Email sent to ${driverEmail}: ${response.data?.id}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send email: ${error.message}`);
      return false;
    }
  }
}
