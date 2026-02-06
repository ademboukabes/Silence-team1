import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { GateService } from './gate.service';
import { CreateGateDto } from './dto/create-gate.dto';
import { CreateTimeSlotDto } from './dto/create-timeslot.dto';
import { ValidateEntryDto } from './dto/validate-entry.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Gates')
@Controller('gates')
export class GateController {
    constructor(private readonly gateService: GateService) { }

    @Post()
    create(@Body() createGateDto: CreateGateDto) {
        return this.gateService.create(createGateDto);
    }

    @Get()
    findAll() {
        return this.gateService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.gateService.findOne(id);
    }

    @Post(':id/slots')
    addSlot(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateTimeSlotDto) {
        return this.gateService.addTimeSlot({ ...dto, gateId: id });
    }

    @Post(':id/validate-entry')
    validateEntry(@Param('id', ParseIntPipe) id: number, @Body() dto: ValidateEntryDto) {
        return this.gateService.validateEntry(id, dto);
    }
}
