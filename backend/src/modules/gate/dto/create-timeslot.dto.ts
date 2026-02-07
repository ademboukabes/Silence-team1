import { IsNotEmpty, IsInt, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTimeSlotDto {
    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    gateId: number;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    startTime: string;

    @ApiProperty()
    @IsDateString()
    @IsNotEmpty()
    endTime: string;

    @ApiProperty()
    @IsInt()
    @IsNotEmpty()
    maxCapacity: number;
}
