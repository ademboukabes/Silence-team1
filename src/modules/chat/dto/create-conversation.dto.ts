import { IsInt, IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
    @ApiProperty({ description: 'User ID', example: 1, required: false })
    @IsOptional()
    @IsInt()
    userId?: number;

    @ApiProperty({ description: 'User role (ADMIN, OPERATOR, CARRIER)', example: 'CARRIER' })
    @IsString()
    @IsNotEmpty()
    userRole: string;
}
