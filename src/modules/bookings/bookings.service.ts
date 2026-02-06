import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateBookingDto } from './bookingDTO/createBooking.dto';
import { BookingStatus } from '@prisma/client';
import { WebsocketService } from '../websocket/websocket.service';
import { BookingCreatedPayload, CapacityAlertPayload } from '../websocket/interfaces/ws.interfaces';
import { AuditLogService } from '../audit/audit.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private wsService: WebsocketService,
    private auditService: AuditLogService,
    private blockchainService: BlockchainService,
  ) { }

  async createBooking(userId: number, dto: CreateBookingDto) {
    // 1. Validate Time Slot
    const slot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.timeSlotId },
      include: {
        bookings: true,
        gate: true, // Include gate relation for capacity alert
      },
    });

    if (!slot) throw new HttpException('TimeSlot not found', HttpStatus.NOT_FOUND);

    if (slot.currentBookings >= slot.maxCapacity) {
      throw new HttpException('TimeSlot is full', HttpStatus.CONFLICT);
    }

    // 2. Reserve Spot (Increment count) - Optimistic
    await this.prisma.timeSlot.update({
      where: { id: slot.id },
      data: { currentBookings: { increment: 1 } },
    });

    // 3. Create Booking
    // 3. Create Booking
    try {
      const booking = await this.prisma.booking.create({
        data: {
          ...dto,
          userId,
          status: BookingStatus.PENDING,
        },
      });

      // Notify Operators
      const bookingPayload: BookingCreatedPayload = {
        terminalId: "ALL", // Ideally we get this from Gate -> Terminal
        bookingId: booking.id.toString(),
        slotTime: slot.startTime
      };
      this.wsService.notifyOperators("ALL", "BOOKING_CREATED", bookingPayload);

      // Check Capacity and Alert if > 90%
      const capacityPercentage = (slot.currentBookings / slot.maxCapacity) * 100;
      if (capacityPercentage >= 90) {
        const alertPayload: CapacityAlertPayload = {
          gateId: slot.gateId.toString(),
          gateName: slot.gate.name,
          currentLoad: slot.currentBookings,
          maxCapacity: slot.maxCapacity
        };
        this.wsService.notifyOperators("ALL", "CAPACITY_ALERT", alertPayload);
      }

      // Log Action
      await this.auditService.logAction(userId, 'CREATE_BOOKING', 'BOOKING', booking.id.toString(), {
        timeSlotId: slot.id,
        truckId: dto.truckId
      });

      return booking;
    } catch (e) {
      // Rollback count if failed
      await this.prisma.timeSlot.update({
        where: { id: slot.id },
        data: { currentBookings: { decrement: 1 } },
      });
      throw e;
    }
  }

  async confirmBooking(id: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);

    if (booking.status !== BookingStatus.PENDING) {
      throw new HttpException('Booking already processed', HttpStatus.BAD_REQUEST);
    }

    // Generate QR Code (Mock URL)
    const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.bookingRef}`;

    await this.auditService.logAction(booking.userId, 'CONFIRM_BOOKING', 'BOOKING', booking.id.toString());

    await this.auditService.logAction(booking.userId, 'CONFIRM_BOOKING', 'BOOKING', booking.id.toString());

    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CONFIRMED,
        qrCode,
      },
      include: { truck: true, gate: true, carrier: true, timeSlot: true, user: true },
    });

    // Notarize on Blockchain
    this.blockchainService.notarizeBooking(updatedBooking.id.toString(), {
      bookingRef: updatedBooking.bookingRef,
      carrier: updatedBooking.carrier?.name,
      truck: updatedBooking.truck?.licensePlate,
      gate: updatedBooking.gate?.name,
      timeSlot: updatedBooking.timeSlot?.startTime,
      user: updatedBooking.user?.email,
      timestamp: new Date().toISOString(),
    });

    return updatedBooking;
  }

  async rejectBooking(id: number) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);

    if (booking.status !== BookingStatus.PENDING) {
      // Allow rejecting confirmed? Maybe.
      // logic: if confirmed, we free up the slot?
    }

    // Free up capacity
    await this.prisma.timeSlot.update({
      where: { id: booking.timeSlotId },
      data: { currentBookings: { decrement: 1 } },
    });

    await this.auditService.logAction(booking.userId, 'REJECT_BOOKING', 'BOOKING', booking.id.toString());

    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.REJECTED },
    });
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: { truck: true, gate: true, carrier: true, timeSlot: true, user: true },
    });
  }

  async findOne(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { truck: true, gate: true, carrier: true, timeSlot: true },
    });
  }
}
