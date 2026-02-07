import { Controller, Get, Post, Body, Param, ParseIntPipe, UseGuards, Request, Put } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookingDTO/createBooking.dto';
import { UpdateBookingStatusDto } from './bookingDTO/updateBookingStatus.dto';
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
    return this.bookingsService.createBooking(req.user.sub, req.user.role, dto);
  }

  @Put(':id/status')
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto
  ) {
    return this.bookingsService.updateBookingStatus(id, dto.status, req.user.sub, req.user.role);
  }

  @Get()

  findAll() {
    return this.bookingsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }
}
