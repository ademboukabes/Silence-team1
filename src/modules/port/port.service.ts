import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortDto } from './dto/create-port.dto';

@Injectable()
export class PortService {
    constructor(private prisma: PrismaService) { }

    create(createPortDto: CreatePortDto) {
        return this.prisma.port.create({
            data: createPortDto,
        });
    }

    findAll() {
        return this.prisma.port.findMany({
            include: { terminals: true },
        });
    }

    findOne(id: number) {
        return this.prisma.port.findUnique({
            where: { id },
            include: { terminals: true },
        });
    }
}
