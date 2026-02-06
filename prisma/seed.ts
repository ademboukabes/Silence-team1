import { PrismaClient, BookingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding data...');

    // Cleanup
    await prisma.auditLog.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.timeSlot.deleteMany();
    await prisma.truck.deleteMany();
    await prisma.gate.deleteMany();
    await prisma.terminal.deleteMany();
    await prisma.user.deleteMany();
    await prisma.carrier.deleteMany();
    await prisma.port.deleteMany();

    console.log('Database cleared.');


    // 1. Create Port
    const port = await prisma.port.create({
        data: {
            name: 'Rotterdam World Gateway',
            location: 'Rotterdam, NL',
            terminals: {
                create: {
                    name: 'Delta Terminal',
                    operators: {
                        create: {
                            name: 'Op Jane',
                            email: 'op@port.com',
                            password: await bcrypt.hash('123456', 10),
                            role: 'TERMINAL_OPERATOR',
                        }
                    },
                    gates: {
                        create: {
                            name: 'Gate A - Inbound',
                            // Add TimeSlots
                            timeSlots: {
                                create: [
                                    {
                                        startTime: new Date(new Date().setDate(new Date().getDate() + 1)), // Same time tomorrow
                                        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(new Date().getHours() + 1)),
                                        maxCapacity: 5,
                                        currentBookings: 0
                                    },
                                    {
                                        startTime: new Date(new Date().setDate(new Date().getDate() + 2)), // Day after tomorrow
                                        endTime: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(15, 0, 0, 0)),
                                        maxCapacity: 2,
                                        currentBookings: 0
                                    }
                                ]
                            }
                        }
                    }
                }
            }
        },
        include: { terminals: { include: { gates: { include: { timeSlots: true } } } } }
    });

    const terminal = port.terminals[0];
    const gate = terminal.gates[0];
    const slot = gate.timeSlots[0];

    console.log('Created Port structure:', port.name);

    // 2. Create Carrier
    const carrier = await prisma.carrier.create({
        data: {
            name: 'Maersk Logistics',
            code: 'MAERSK-001',
            users: {
                create: {
                    name: 'Driver John',
                    email: 'driver@maersk.com',
                    password: await bcrypt.hash('123456', 10),
                }
            },
            trucks: {
                create: {
                    licensePlate: 'AB-123-CD',
                    driverName: 'John Doe'
                }
            }
        },
        include: { users: true, trucks: true }
    });

    const carrierUser = carrier.users[0];
    const truck = carrier.trucks[0];

    console.log('Created Carrier:', carrier.name);

    // 3. Create Booking (Pending)
    const booking = await prisma.booking.create({
        data: {
            userId: carrierUser.id,
            carrierId: carrier.id,
            gateId: gate.id,
            truckId: truck.id,
            timeSlotId: slot.id,
            notes: 'Demo booking',
        }
    });

    // Update capacity manually for seed
    await prisma.timeSlot.update({
        where: { id: slot.id },
        data: { currentBookings: { increment: 1 } }
    });

    console.log('Created Booking:', booking.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
