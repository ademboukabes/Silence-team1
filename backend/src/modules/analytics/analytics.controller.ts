import { Controller, Get, Param, Query, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard, Roles } from '../../guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(AuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('capabilities')
    @Roles('ADMIN', 'TERMINAL_OPERATOR')
    getCapabilities() {
        return {
            ok: true,
            data: {
                operator_ai_overview: true,
                operator_logs: true,
                operator_metrics: true,
                congestion_events: false,
            },
        };
    }

    @Get('operators/:operatorId/logs')
    @Roles('ADMIN', 'TERMINAL_OPERATOR')
    async getOperatorLogs(
        @Param('operatorId') operatorId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('limit') limit?: number,
        @Query('cursor') cursor?: string,
        @Query('includeDetails') includeDetails?: boolean,
    ) {
        if (!from || !to) {
            throw new HttpException(
                { ok: false, error: { code: 'UNPROCESSABLE_ENTITY', message: 'from and to are required' } },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        return this.analyticsService.getOperatorLogs(
            operatorId,
            new Date(from),
            new Date(to),
            limit ? Number(limit) : 500,
            cursor,
            includeDetails === true || (includeDetails as any) === 'true',
        );
    }

    @Get('operators/:operatorId/metrics')
    @Roles('ADMIN', 'TERMINAL_OPERATOR')
    async getOperatorMetrics(
        @Param('operatorId') operatorId: string,
        @Query('from') from: string,
        @Query('to') to: string,
        @Query('groupBy') groupBy: 'day' | 'hour' = 'day',
        @Query('terminal') terminal?: string,
        @Query('gate') gate?: string,
    ) {
        if (!from || !to) {
            throw new HttpException(
                { ok: false, error: { code: 'UNPROCESSABLE_ENTITY', message: 'from and to are required' } },
                HttpStatus.UNPROCESSABLE_ENTITY,
            );
        }
        return this.analyticsService.getOperatorMetrics(
            operatorId,
            new Date(from),
            new Date(to),
            groupBy,
            terminal,
            gate,
        );
    }

    @Get('operations/congestion-events')
    @Roles('ADMIN', 'TERMINAL_OPERATOR')
    async getCongestionEvents() {
        throw new HttpException(
            { ok: false, error: { code: 'NOT_IMPLEMENTED', message: 'Congestion events not yet implemented' } },
            HttpStatus.NOT_IMPLEMENTED,
        );
    }
}
