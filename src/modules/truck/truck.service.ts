import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTruckDto } from './dto/create-truck.dto';

@Injectable()
export class TruckService {
    constructor(private prisma: PrismaService) { }

    create(createTruckDto: CreateTruckDto) {
        return this.prisma.truck.create({
            data: createTruckDto,
        });
    }

    findAll() {
        return this.prisma.truck.findMany({
            include: { carrier: true },
        });
    }

    findOne(id: number) {
        return this.prisma.truck.findUnique({
            where: { id },
            include: { bookings: true },
        });
    }
}
