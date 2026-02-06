import { IsString, IsNotEmpty, IsInt, IsOptional } from 'class-validator';

export class CreateTruckDto {
    @IsString()
    @IsNotEmpty()
    licensePlate: string;

    @IsString()
    @IsOptional()
    driverName?: string;

    @IsInt()
    @IsNotEmpty()
    carrierId: number;
}
