import { IsNotEmpty, IsInt, IsOptional, IsString, IsEmail } from 'class-validator';
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

  // Driver information (required)
  @ApiProperty({
    example: 'Jean Dupont',
    description: 'Full name of the driver'
  })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiProperty({
    example: 'jean.dupont@transporteur.fr',
    description: 'Driver email for QR code delivery'
  })
  @IsEmail()
  @IsNotEmpty()
  driverEmail: string;

  @ApiProperty({
    example: '+33612345678',
    description: 'Driver phone number'
  })
  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @ApiProperty({
    example: 'DRV-FR-2024-001',
    description: 'Driver license or matricule number'
  })
  @IsString()
  @IsNotEmpty()
  driverMatricule: string;

  @ApiProperty({
    example: '40ft container - Electronics',
    description: 'Description of merchandise being transported',
    required: false
  })
  @IsString()
  @IsOptional()
  merchandiseDescription?: string;
}
