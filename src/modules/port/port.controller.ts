import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { PortService } from './port.service';
import { CreatePortDto } from './dto/create-port.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Ports')
@Controller('ports')
export class PortController {
    constructor(private readonly portService: PortService) { }

    @Post()
    create(@Body() createPortDto: CreatePortDto) {
        return this.portService.create(createPortDto);
    }

    @Get()
    findAll() {
        return this.portService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.portService.findOne(id);
    }
}
