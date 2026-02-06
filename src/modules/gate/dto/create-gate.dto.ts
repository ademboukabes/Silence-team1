import { IsString, IsNotEmpty, IsInt, IsEnum, IsOptional } from 'class-validator';
import { GateType } from '@prisma/client';

export class CreateGateDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsEnum(GateType)
    @IsOptional()
    type?: GateType;

    @IsInt()
    @IsNotEmpty()
    terminalId: number;
}
