import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateTerminalDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsInt()
    @IsNotEmpty()
    portId: number;
}
