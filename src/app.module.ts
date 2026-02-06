import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { AuthModule } from './modules/auth/auth.module';
import { CacheConfigModule } from './modules/cache/cache.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { PaginationInterceptor } from './interceptors/pagination.interceptor';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { NotificationModule } from './modules/notification/notification.module';
import { PortModule } from './modules/port/port.module';
import { TerminalModule } from './modules/terminal/terminal.module';
import { GateModule } from './modules/gate/gate.module';
import { CarrierModule } from './modules/carrier/carrier.module';
import { TruckModule } from './modules/truck/truck.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { AuditLogModule } from './modules/audit/audit.module';
import { BlockchainModule } from './modules/blockchain/blockchain.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';


@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    CacheConfigModule,
    UserModule,
    BookingsModule,
    AuthModule,
    PrismaModule,
    NotificationModule,
    PortModule,
    TerminalModule,
    GateModule,
    CarrierModule,
    TruckModule,
    WebsocketModule,
    AuditLogModule,
    BlockchainModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: PaginationInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule { }
