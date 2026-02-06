import { Controller, Get, Query } from '@nestjs/common';
import { AiService } from './ai.service';
import { ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('AI-Agent')
@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

    @Get('slot-availability')
    getSlots() {
        return this.aiService.getSlotAvailability();
    }

    @Get('booking-status')
    @ApiQuery({ name: 'ref', required: false })
    @ApiQuery({ name: 'plate', required: false })
    getBooking(@Query('ref') ref?: string, @Query('plate') plate?: string) {
        return this.aiService.getBookingStatus(ref, plate);
    }

    @Get('passage-history')
    getHistory() {
        return this.aiService.getPassageHistory();
    }
}
