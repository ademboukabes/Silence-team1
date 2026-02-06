import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateEntryDto {
    @ApiProperty({
        example: 'BOOK-DEMO-001',
        description: 'Booking reference code (from booking creation response)',
        required: false
    })
    @IsOptional()
    @IsString()
    bookingRef?: string;

    @ApiProperty({
        example: 'BASE64_ENCODED_QR_CODE_DATA',
        description: 'QR code data (generated after booking confirmation)',
        required: false
    })
    @IsOptional()
    @IsString()
    qrCode?: string;
}
