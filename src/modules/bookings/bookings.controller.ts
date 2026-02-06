import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request, Put } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookingDTO/createBooking.dto';
import { AuthGuard } from '../../guards/auth.guard';
import { RolesGuard, Roles } from '../../guards/roles.guard';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Bookings')
@Controller('bookings')
@UseGuards(AuthGuard, RolesGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }

  @Post()

  create(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.sub, dto);
  }

  @Put(':id/confirm')

  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.confirmBooking(id);
  }

  @Put(':id/reject')

  reject(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.rejectBooking(id);
  }

  @Get()

  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }
}
