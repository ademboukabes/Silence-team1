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
}
