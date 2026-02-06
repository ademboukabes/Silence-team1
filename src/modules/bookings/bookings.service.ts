import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateBookingDto } from './bookingDTO/createBooking.dto';
import { BookingStatus } from '@prisma/client';
import { WebsocketService } from '../websocket/websocket.service';
import { BookingCreatedPayload, CapacityAlertPayload } from '../websocket/interfaces/ws.interfaces';
import { AuditLogService } from '../audit/audit.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { NotificationService } from '../notification/notification.service';
import { BookingStatusUpdate } from './bookingDTO/updateBookingStatus.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger('BookingsService');
  constructor(
    private prisma: PrismaService,
    private wsService: WebsocketService,
    private auditService: AuditLogService,
    private blockchainService: BlockchainService,
    private notificationService: NotificationService,
  ) { }

  async createBooking(userId: number, role: string, dto: CreateBookingDto) {
    // 0. Enforce CARRIER role (or ADMIN)
    if (role !== 'CARRIER' && role !== 'ADMIN') {
      throw new HttpException('Only carriers can create bookings', HttpStatus.FORBIDDEN);
    }

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
        terminalId: "ALL",
        bookingId: booking.id as string,
        slotTime: slot.startTime
      };
      this.wsService.notifyOperators("ALL", "BOOKING_CREATED", bookingPayload);

      // Check Capacity and Alert if > 90%
      const capacityPercentage = (slot.currentBookings / slot.maxCapacity) * 100;
      if (capacityPercentage >= 90) {
        const alertPayload: CapacityAlertPayload = {
          gateId: slot.gateId.toString(),
          gateName: (slot as any).gate.name,
          currentLoad: slot.currentBookings,
          maxCapacity: slot.maxCapacity
        };
        this.wsService.notifyOperators("ALL", "CAPACITY_ALERT", alertPayload);
      }

      // Log Action
      await this.auditService.logAction(userId, 'BOOKING_CREATED', 'CREATED', 'BOOKING', booking.id, {
        timeSlotId: slot.id,
        truckId: dto.truckId,
        driverEmail: (dto as any).driverEmail
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

  async updateBookingStatus(id: string, status: BookingStatusUpdate, actorId: number, actorRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: { carrier: true, truck: true, gate: true, timeSlot: true, user: true }
    });

    if (!booking) throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);

    // 1. Authorization & Business Rules
    if (status === BookingStatusUpdate.CONFIRMED || status === BookingStatusUpdate.REJECTED) {
      const allowedRoles = ['TERMINAL_OPERATOR', 'PORT_ADMIN', 'ADMIN'];
      if (!allowedRoles.includes(actorRole)) {
        throw new HttpException('Only operators can confirm or reject bookings', HttpStatus.FORBIDDEN);
      }
    }

    if (status === BookingStatusUpdate.CANCELLED) {
      const allowedRoles = ['CARRIER', 'DRIVER', 'ADMIN'];
      if (!allowedRoles.includes(actorRole)) {
        throw new HttpException('Only carriers can cancel bookings', HttpStatus.FORBIDDEN);
      }
      if (actorRole === 'CARRIER' && booking.userId !== actorId) {
        throw new HttpException('You can only cancel your own bookings', HttpStatus.FORBIDDEN);
      }
    }

    if (booking.status === BookingStatus.CONSUMED) {
      throw new HttpException('Cannot change status of a consumed booking', HttpStatus.BAD_REQUEST);
    }

    // 2. Logic based on status
    let data: any = { status };
    let actionType = 'BOOKING_STATUS_UPDATE';
    let action = status.toString();

    if (status === BookingStatusUpdate.CONFIRMED) {
      if (booking.status !== BookingStatus.PENDING) {
        throw new HttpException('Can only confirm pending bookings', HttpStatus.BAD_REQUEST);
      }
      data.qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.id}`;
      actionType = 'BOOKING_CONFIRMED';

      // MOCK EMAIL SENDING
      this.logger.log(`📧 SENDING EMAIL to ${booking.driverEmail} with QR Code for booking ${booking.id}`);
    }

    if (status === BookingStatusUpdate.REJECTED || status === BookingStatusUpdate.CANCELLED) {
      // Free up capacity
      await this.prisma.timeSlot.update({
        where: { id: booking.timeSlotId },
        data: { currentBookings: { decrement: 1 } },
      });
      actionType = status === BookingStatusUpdate.REJECTED ? 'BOOKING_REJECTED' : 'BOOKING_CANCELLED';
    }

    // 3. Update & Log
    const updatedBooking = await this.prisma.booking.update({
      where: { id },
      data,
      include: { truck: true, gate: true, carrier: true, timeSlot: true, user: true },
    });

    await this.auditService.logAction(actorId, actionType, action, 'BOOKING', id);

    // AI-Ready Notification
    this.wsService.notifyUser(booking.userId.toString(), 'BOOKING_STATUS_CHANGED', {
      bookingId: id,
      newStatus: status
    });

    // Blockchain Notarization on confirmation
    if (status === BookingStatusUpdate.CONFIRMED) {
      this.blockchainService.notarizeBooking(updatedBooking.id, {
        bookingRef: updatedBooking.id,
        driver: updatedBooking.driverName,
        truck: updatedBooking.truck?.licensePlate,
        gate: updatedBooking.gate?.name,
        timestamp: new Date().toISOString(),
      });
    }

    return updatedBooking;
  }


  async findAll() {
    return this.prisma.booking.findMany({
      include: { truck: true, gate: true, carrier: true, timeSlot: true, user: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: { truck: true, gate: true, carrier: true, timeSlot: true },
    });
  }
}
