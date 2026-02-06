import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';

@Injectable()
export class CarrierService {
    constructor(private prisma: PrismaService) { }

    create(createCarrierDto: CreateCarrierDto) {
        return this.prisma.carrier.create({
            data: createCarrierDto,
        });
    }

    findAll() {
        return this.prisma.carrier.findMany({
            include: { trucks: true },
        });
    }

    findOne(id: number) {
        return this.prisma.carrier.findUnique({
            where: { id },
            include: { trucks: true, bookings: true },
        });
    }
}
