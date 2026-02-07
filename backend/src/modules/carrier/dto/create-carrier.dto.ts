import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateCarrierDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    code: string;

    @IsEmail()
    @IsOptional()
    contactEmail?: string;
}
