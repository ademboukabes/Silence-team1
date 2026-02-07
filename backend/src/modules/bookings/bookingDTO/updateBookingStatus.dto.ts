import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum BookingStatusUpdate {
    CONFIRMED = 'CONFIRMED',
    REJECTED = 'REJECTED',
    CANCELLED = 'CANCELLED',
}

export class UpdateBookingStatusDto {
    @ApiProperty({
        enum: BookingStatusUpdate,
        example: 'CONFIRMED',
        description: 'The new status for the booking',
    })
    @IsEnum(BookingStatusUpdate)
    @IsNotEmpty()
    status: BookingStatusUpdate;
}
