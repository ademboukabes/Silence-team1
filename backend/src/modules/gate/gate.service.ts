import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGateDto } from './dto/create-gate.dto';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';
import { ValidateEntryDto } from './dto/validate-entry.dto';
import { WebsocketService } from '../websocket/websocket.service';
import { AuditLogService } from '../audit/audit.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class GateService {
    constructor(
        private prisma: PrismaService,
        private wsService: WebsocketService,
        private auditService: AuditLogService,
        private blockchainService: BlockchainService,
    ) { }

    create(createGateDto: CreateGateDto) {
        return this.prisma.gate.create({
            data: createGateDto,
        });
    }

    findAll() {
        return this.prisma.gate.findMany({
            include: { terminal: true },
        });
    }

    findOne(id: number) {
        return this.prisma.gate.findUnique({
            where: { id },
            include: { timeSlots: true },
        });
    }

    addTimeSlot(dto: CreateTimeSlotDto) {
        return this.prisma.timeSlot.create({
            data: {
                gateId: dto.gateId,
                startTime: new Date(dto.startTime),
                endTime: new Date(dto.endTime),
                maxCapacity: dto.maxCapacity,
            },
        });
    }

    async validateEntry(gateId: number, dto: ValidateEntryDto) {
        // 1. Find booking by UUID
        const booking = await this.prisma.booking.findUnique({
            where: { id: dto.bookingId },
            include: {
                truck: true,
                gate: true,
                timeSlot: true,
                user: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found or invalid QR');
        }

        // 2. Audit QR Scan Attempt
        await this.auditService.logAction(
            0, // System actor for gate sensor
            'QR_SCANNED',
            'SCAN',
            'BOOKING',
            booking.id,
            { gateId }
        );

        // 3. Verify booking status
        if (booking.status !== BookingStatus.CONFIRMED) {
            throw new BadRequestException(`Access denied. Booking status: ${booking.status}`);
        }

        // 4. Verify gate match
        if (booking.gateId !== gateId) {
            throw new ForbiddenException(`Incorrect gate. Registered for "${booking.gate.name}"`);
        }

        // 5. Verify time window
        const now = new Date();
        if (now < booking.timeSlot.startTime || now > booking.timeSlot.endTime) {
            throw new BadRequestException(
                `Out of time slot window. Slot: ${booking.timeSlot.startTime.toISOString()} - ${booking.timeSlot.endTime.toISOString()}`
            );
        }

        // 6. Update booking status to CONSUMED
        const updatedBooking = await this.prisma.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.CONSUMED },
            include: {
                truck: true,
                gate: true,
            },
        });

        // 7. Emit WebSocket event
        this.wsService.notifyOperators('ALL', 'GATE_PASSAGE', {
            gateId: booking.gateId,
            gateName: booking.gate.name,
            bookingRef: booking.id,
            truckPlate: booking.truck?.licensePlate,
            timestamp: new Date(),
            status: 'GRANTED',
        });

        // 8. Notarize on Blockchain
        this.blockchainService.notarizeBooking(`ENTRY_${updatedBooking.id}`, {
            bookingRef: updatedBooking.id,
            driver: (updatedBooking as any).driverName,
            truck: updatedBooking.truck?.licensePlate,
            gate: updatedBooking.gate?.name,
            passageTime: new Date().toISOString(),
            status: 'ENTRY_GRANTED',
        });

        // 9. Audit log entry grant
        await this.auditService.logAction(
            0,
            'ENTRY_GRANTED',
            'GRANTED',
            'BOOKING',
            booking.id,
            {
                gateId: booking.gateId,
                truckPlate: (booking as any).truck?.licensePlate,
            }
        );

        return {
            success: true,
            message: 'Entry granted. Barrier opening...',
            booking: {
                bookingRef: updatedBooking.id,
                driver: (updatedBooking as any).driverName,
                truck: (updatedBooking as any).truck?.licensePlate,
                gate: (updatedBooking as any).gate?.name,
                status: updatedBooking.status,
            },
        };
    }
}
