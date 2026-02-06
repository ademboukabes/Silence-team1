import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    private readonly logger = new Logger(AnalyticsService.name);

    constructor(private prisma: PrismaService) { }

    async getOperatorLogs(
        operatorId: string,
        from: Date,
        to: Date,
        limit: number,
        cursor?: string,
        includeDetails?: boolean,
    ) {
        const opIdNum = parseInt(operatorId, 10);

        // Simple offset pagination based on id if cursor is not provided
        // If cursor is provided, we decode it. For simplicity, we use id as cursor.
        const skip = cursor ? 0 : 0;
        const cursorObj = cursor ? { id: parseInt(cursor, 10) } : undefined;

        const logs = await this.prisma.auditLog.findMany({
            where: {
                userId: opIdNum,
                timestamp: {
                    gte: from,
                    lte: to,
                },
            },
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursorObj,
            orderBy: { timestamp: 'desc' },
            include: { user: true },
        });

        const mappedLogs = logs.map((log) => ({
            event_id: `evt_${log.id}`,
            timestamp: log.timestamp.toISOString(),
            action_type: log.actionType,
            action: log.action,
            resource_type: log.entityType,
            resource_id: log.entityId,
            terminal: null, // Would need more joining if terminalId was tracked per log
            gate: null,
            slot_id: null,
            carrier_id: null,
            driver_id: null,
            reason_code: null,
            notes: null,
            metadata: log.details ? JSON.parse(log.details) : {},
        }));

        const next_cursor = logs.length === limit ? logs[logs.length - 1].id.toString() : null;

        return {
            ok: true,
            data: {
                operator_id: operatorId,
                range: { from: from.toISOString(), to: to.toISOString() },
                logs: mappedLogs,
                next_cursor,
            },
        };
    }

    async getOperatorMetrics(
        operatorId: string,
        from: Date,
        to: Date,
        groupBy: 'day' | 'hour',
        terminal?: string,
        gate?: string,
    ) {
        const opIdNum = parseInt(operatorId, 10);

        // Fetch relevant audit logs for the period
        const logs = await this.prisma.auditLog.findMany({
            where: {
                userId: opIdNum,
                timestamp: {
                    gte: from,
                    lte: to,
                },
                actionType: 'BOOKING_DECISION',
            },
        });

        // Simple aggregation
        const buckets: Record<string, any> = {};

        logs.forEach((log) => {
            const date = new Date(log.timestamp);
            let bucketKey = date.toISOString().split('T')[0]; // Default Day
            if (groupBy === 'hour') {
                bucketKey = `${bucketKey}T${date.getHours().toString().padStart(2, '0')}:00:00Z`;
            }

            if (!buckets[bucketKey]) {
                buckets[bucketKey] = {
                    bucket: bucketKey,
                    bookings_accepted: 0,
                    bookings_rejected: 0,
                    manual_overrides: 0,
                    avg_queue_minutes: 0, // Mocked for now as we don't track wait times explicitly
                    saturation_ratio: 0, // Mocked
                    no_show_rate: 0,
                    late_rate: 0,
                    cancellation_rate: 0,
                    congestion_events: 0,
                };
            }

            if (log.action === 'ACCEPTED') buckets[bucketKey].bookings_accepted++;
            if (log.action === 'REJECTED') buckets[bucketKey].bookings_rejected++;
            // We can define what a manual override is, e.g., a specific detail or action
            if (log.details && log.details.includes('OVERRIDE')) buckets[bucketKey].manual_overrides++;
        });

        const series = Object.values(buckets).sort((a, b) => a.bucket.localeCompare(b.bucket));

        const totals = {
            bookings_accepted: series.reduce((acc, curr) => acc + curr.bookings_accepted, 0),
            bookings_rejected: series.reduce((acc, curr) => acc + curr.bookings_rejected, 0),
            manual_overrides: series.reduce((acc, curr) => acc + curr.manual_overrides, 0),
            congestion_events: 0,
        };

        return {
            ok: true,
            data: {
                operator_id: operatorId,
                range: { from: from.toISOString(), to: to.toISOString() },
                group_by: groupBy,
                series,
                totals,
            },
        };
    }
}
