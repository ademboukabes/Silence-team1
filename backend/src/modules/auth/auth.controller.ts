import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Response,
  UseGuards,
} from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { CreateUserDto } from 'src/modules/user/userDTO/createUser.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './authDto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @HttpCode(HttpStatus.OK)
  @Post('signup')
  async signUp(
    @Body() signUpDto: CreateUserDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.signUp(signUpDto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false, // Set to true in production
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });
    return {
      message: 'Signup successful',
      access_token: result.access_token, // Keeping backward compatibility
    };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() signInDto: LoginDto,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const result = await this.authService.login(signInDto);
    res.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: false, // Set to true in production (requires HTTPS)
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutes
    });
    return {
      message: 'Login successful',
      access_token: result.access_token, // Keeping backward compatibility
    };
  }

  @Post('logout')
  logout(@Response({ passthrough: true }) res: ExpressResponse) {
    res.clearCookie('access_token');
    return { message: 'Logged out' };
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
