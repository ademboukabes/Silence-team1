import { Module } from '@nestjs/common';
import { GateController } from './gate.controller';
import { GateService } from './gate.service';
import { WebsocketModule } from '../websocket/websocket.module';
import { AuditLogModule } from '../audit/audit.module';
import { BlockchainModule } from '../blockchain/blockchain.module';

@Module({
  imports: [WebsocketModule, AuditLogModule, BlockchainModule],
  controllers: [GateController],
  providers: [GateService]
})
export class GateModule { }
