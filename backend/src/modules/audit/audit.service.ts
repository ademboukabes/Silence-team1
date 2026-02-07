import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    async logAction(
        userId: number,
        actionType: string,
        action: string,
        entityType: string,
        entityId: string,
        details?: any,
    ) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: userId === 0 ? null : userId,
                    actionType,
                    action,
                    entityType,
                    entityId,
                    details: details ? JSON.stringify(details) : null,
                },
            });
            this.logger.log(`Audit Log Created: ${userId === 0 ? 'SYSTEM' : `User ${userId}`} performed ${actionType}:${action} on ${entityType} ${entityId}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
        }
    }
}
