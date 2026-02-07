import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateUserDto {
  @ApiProperty({
    description: 'name of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'email of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'password of the user',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  password: string;



  @ApiProperty({
    description: 'notification token',
    type: String,
  })
  @IsString()
  @IsOptional()
  notification_token?: string;

  @ApiProperty({ description: 'Optional Terminal ID', required: false })
  @IsOptional()
  terminalId?: number;

  @ApiProperty({ description: 'Optional Carrier ID', required: false })
  @IsOptional()
  carrierId?: number;
}
