import { IsNotEmpty, IsInt, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: 4,
    description: 'ID of the gate where the truck will enter',
    type: Number
  })
  @IsInt()
  @IsNotEmpty()
  gateId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the truck making the booking',
    type: Number
  })
  @IsInt()
  @IsNotEmpty()
  truckId: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the carrier company',
    type: Number
  })
  @IsInt()
  @IsNotEmpty()
  carrierId: number;

  @ApiProperty({
    example: 5,
    description: 'ID of the desired time slot (get from /ai/slot-availability)',
    type: Number
  })
  @IsInt()
  @IsNotEmpty()
  timeSlotId: number;

  @ApiProperty({
    example: 'Fragile cargo - handle with care',
    description: 'Optional notes for the booking',
    required: false
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
