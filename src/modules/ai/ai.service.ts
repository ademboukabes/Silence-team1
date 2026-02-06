import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class AiService {
    constructor(private prisma: PrismaService) { }

    async getSlotAvailability() {
        // Return structured table of OPEN slots
        // Note: Prisma doesn't support comparing two columns in 'where' easily.
        // We fetch future slots and filter in memory.
        const allSlots = await this.prisma.timeSlot.findMany({
            where: {
                startTime: { gte: new Date() }, // Future slots only
            },
            include: { gate: { include: { terminal: { include: { port: true } } } } },
            orderBy: { startTime: 'asc' },
        });

        // Filter for capacity
        const openSlots = allSlots.filter(slot => slot.currentBookings < slot.maxCapacity);

        return openSlots.map(slot => ({
            slotId: slot.id,
            gateId: slot.gateId, // For direct booking
            port: slot.gate.terminal.port.name,
            terminal: slot.gate.terminal.name,
            gate: slot.gate.name,
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: `${slot.currentBookings}/${slot.maxCapacity}`,
            status: 'AVAILABLE'
        }));
    }

    async getBookingStatus(ref?: string, plate?: string) {
        if (!ref && !plate) return { error: "Provide 'ref' or 'plate' query parameter" };

        const booking = await this.prisma.booking.findFirst({
            where: {
                OR: [
                    { bookingRef: ref },
                    { truck: { licensePlate: plate } }
                ]
            },
            include: { truck: true, gate: true, timeSlot: true, user: true },
        });

        if (!booking) return { status: 'NOT_FOUND' };

        return {
            bookingRef: booking.bookingRef,
            status: booking.status,
            carrier_user: booking.user.email,
            truck: booking.truck.licensePlate,
            gate: booking.gate.name,
            time: `${booking.timeSlot.startTime.toISOString()} - ${booking.timeSlot.endTime.toISOString()}`,
            qrCode: booking.qrCode ? 'GENERATED' : 'PENDING'
        };
    }

    async getPassageHistory() {
        // Return executed bookings
        const bookings = await this.prisma.booking.findMany({
            where: { status: BookingStatus.CONSUMED },
            orderBy: { updatedAt: 'desc' },
            take: 50,
            include: { truck: true, gate: true },
        });

        return bookings.map(b => ({
            date: b.updatedAt,
            truck: b.truck.licensePlate,
            gate: b.gate.name,
            action: 'PASSAGE_COMPLETE'
        }));
    }
}
