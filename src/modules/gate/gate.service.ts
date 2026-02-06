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
        // 1. Validate input
        if (!dto.bookingRef && !dto.qrCode) {
            throw new BadRequestException('Either bookingRef or qrCode must be provided');
        }

        // 2. Find booking
        const booking = await this.prisma.booking.findFirst({
            where: {
                OR: [
                    { bookingRef: dto.bookingRef },
                    { qrCode: dto.qrCode },
                ],
            },
            include: {
                truck: true,
                gate: true,
                timeSlot: true,
                user: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        // 3. Verify booking status
        if (booking.status !== BookingStatus.CONFIRMED) {
            throw new BadRequestException(`Booking must be CONFIRMED first. Current status: ${booking.status}`);
        }

        // 4. Verify gate match
        if (booking.gateId !== gateId) {
            throw new ForbiddenException(`This booking is for gate "${booking.gate.name}", not this gate`);
        }

        // 5. Verify time window
        const now = new Date();
        if (now < booking.timeSlot.startTime || now > booking.timeSlot.endTime) {
            throw new BadRequestException(
                `Entry time window is ${booking.timeSlot.startTime.toISOString()} - ${booking.timeSlot.endTime.toISOString()}`
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

        // 8. Emit WebSocket event
        this.wsService.notifyOperators('ALL', 'GATE_PASSAGE', {
            gateId: booking.gateId,
            gateName: booking.gate.name,
            bookingRef: booking.bookingRef,
            truckPlate: booking.truck.licensePlate,
            timestamp: new Date(),
            status: 'GRANTED',
        });

        // 8.5 Notarize on Blockchain
        this.blockchainService.notarizeBooking(`ENTRY_${updatedBooking.id}`, {
            bookingRef: updatedBooking.bookingRef,
            truck: updatedBooking.truck.licensePlate,
            gate: updatedBooking.gate.name,
            passageTime: new Date().toISOString(),
            status: 'ENTRY_GRANTED',
        });

        // 9. Audit log
        await this.auditService.logAction(
            booking.userId,
            'GATE_PASSAGE',
            'BOOKING',
            booking.id.toString(),
            {
                gateId: booking.gateId,
                truckPlate: booking.truck.licensePlate,
            }
        );

        return {
            success: true,
            message: 'Entry granted',
            booking: {
                bookingRef: updatedBooking.bookingRef,
                truck: updatedBooking.truck.licensePlate,
                gate: updatedBooking.gate.name,
                status: updatedBooking.status,
            },
        };
    }
}
