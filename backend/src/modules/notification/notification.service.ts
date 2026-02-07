import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateNotificationDto } from './notificationDto/createNotification.dto';
import { Notification } from '@prisma/client';
import * as firebase from 'firebase-admin';
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
  constructor(private prismaService: PrismaService) { }

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
        console.warn('Firebase not initialized, skipping push notification.');
      }
      return createdNotification;
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }

  async sendBookingEmail(type: 'CONFIRMATION' | 'REJECTION' | 'CANCELLATION', booking: any) {
    const { driverEmail, driverName, id, qrCode } = booking;

    // In a real production system, this would use a service like SendGrid, Mailgun, or AWS SES
    console.log(`--- [PRODUCTION NOTIFICATION LOG] ---`);
    console.log(`To: ${driverEmail} (${driverName})`);
    console.log(`Subject: Booking ${type} - ${id}`);

    if (type === 'CONFIRMATION') {
      console.log(`Body: Hello ${driverName}, your booking ${id} has been CONFIRMED.`);
      console.log(`QR Code URL: ${qrCode}`);
      console.log(`Please present this QR code at the gate.`);
    } else if (type === 'REJECTION') {
      console.log(`Body: Hello, your booking request ${id} has been REJECTED by the terminal operator.`);
    } else {
      console.log(`Body: Booking ${id} has been CANCELLED.`);
    }
    console.log(`-------------------------------------`);

    // We could also record this in the database if needed
    return true;
  }
}
