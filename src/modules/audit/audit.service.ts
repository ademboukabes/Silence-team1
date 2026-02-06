import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
    private readonly logger = new Logger(AuditLogService.name);

    constructor(private prisma: PrismaService) { }

    async logAction(
        userId: number,
        action: string,
        entityType: string,
        entityId: string,
        details?: any,
    ) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId,
                    action,
                    entityType,
                    entityId,
                    details: details ? JSON.stringify(details) : null,
                },
            });
            this.logger.log(`Audit Log Created: User ${userId} performed ${action} on ${entityType} ${entityId}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
        }
    }
}
