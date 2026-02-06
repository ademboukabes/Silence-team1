import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';

@Injectable()
export class TerminalService {
    constructor(private prisma: PrismaService) { }

    create(createTerminalDto: CreateTerminalDto) {
        return this.prisma.terminal.create({
            data: createTerminalDto,
        });
    }

    findAll() {
        return this.prisma.terminal.findMany({
            include: { port: true, gates: true },
        });
    }

    findOne(id: number) {
        return this.prisma.terminal.findUnique({
            where: { id },
            include: { gates: true },
        });
    }
}
