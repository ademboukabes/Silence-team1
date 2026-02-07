import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  providers: [NotificationService],
  controllers: [NotificationController],
  imports: [PrismaModule, WebsocketModule, MailModule],
  exports: [NotificationService],
})
export class NotificationModule { }
