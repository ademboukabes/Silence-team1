import { IsString, IsNotEmpty } from 'class-validator';

export class CreatePortDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    location: string;
}
