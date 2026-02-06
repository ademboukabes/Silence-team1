import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateEntryDto {
    @ApiProperty({
        example: '550e8400-e29b-41d4-a716-446655440000',
        description: 'Booking UUID (from booking creation response)',
        required: false
    })
    @IsOptional()
    @IsString()
    bookingId?: string;

    @ApiProperty({
        example: 'BASE64_ENCODED_QR_CODE_DATA',
        description: 'QR code data (generated after booking confirmation)',
        required: false
    })
    @IsOptional()
    @IsString()
    qrCode?: string;
}
