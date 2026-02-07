import { Module } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { AuditLogModule } from '../audit/audit.module';

@Module({
    imports: [AuditLogModule],
    providers: [BlockchainService],
    exports: [BlockchainService],
})
export class BlockchainModule { }
