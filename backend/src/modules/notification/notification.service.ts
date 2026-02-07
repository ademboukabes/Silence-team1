import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateNotificationDto } from './notificationDto/createNotification.dto';
import { Notification } from '@prisma/client';
import { WebsocketService } from 'src/modules/websocket/websocket.service';
import { MailService } from '../mail/mail.service';
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
  constructor(
    private prismaService: PrismaService,
    private websocketService: WebsocketService,
    private mailService: MailService,
  ) { }

  async createNotification(
    notificationDto: CreateNotificationDto,
  ): Promise<Notification | null> {
    try {
      let createdNotification = await this.prismaService.notification.create({
        data: notificationDto,
      });
      let { title, body } = notificationDto;

      // Emit WebSocket event for real-time notification delivery
      this.websocketService.notifyUser(
        createdNotification.userId.toString(),
        'NEW_NOTIFICATION',
        {
          notificationId: createdNotification.id,
          title: createdNotification.title,
          body: createdNotification.body,
          // type and relatedTerminalId are not supported in current Prisma schema
          // type: createdNotification.type,
          // relatedTerminalId: createdNotification.relatedTerminalId,
          timestamp: createdNotification.createdAt,
        }
      );

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

    let subject = `Booking ${type} - ${id}`;
    let html = '';

    if (type === 'CONFIRMATION') {
      html = `
        <h1>Booking Confirmed</h1>
        <p>Hello ${driverName},</p>
        <p>Your booking <strong>${id}</strong> has been CONFIRMED.</p>
        <p>Please present this QR code at the gate:</p>
        <img src="${qrCode}" alt="QR Code" />
      `;
    } else if (type === 'REJECTION') {
      html = `
        <h1>Booking Rejected</h1>
        <p>Hello,</p>
        <p>Your booking request <strong>${id}</strong> has been REJECTED by the terminal operator.</p>
      `;
    } else {
      html = `
        <h1>Booking Cancelled</h1>
        <p>Booking <strong>${id}</strong> has been CANCELLED.</p>
      `;
    }

    // Send real email via Resend
    await this.mailService.sendEmail(driverEmail, subject, html);

    return true;
  }
}
