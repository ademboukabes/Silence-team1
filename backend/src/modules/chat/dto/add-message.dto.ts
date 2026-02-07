import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddMessageDto {
    @ApiProperty({ description: 'Message role (USER or ASSISTANT)', example: 'USER' })
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiProperty({ description: 'Message content', example: 'What is my booking status?' })
    @IsString()
    @IsNotEmpty()
    content: string;

    @ApiProperty({ description: 'Detected intent', example: 'booking_status_query', required: false })
    @IsString()
    @IsOptional()
    intent?: string;

    @ApiProperty({ description: 'Additional metadata', required: false })
    @IsOptional()
    metadata?: any;
}
