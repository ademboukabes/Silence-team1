import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TerminalService } from './terminal.service';
import { CreateTerminalDto } from './dto/create-terminal.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Terminals')
@Controller('terminals')
export class TerminalController {
    constructor(private readonly terminalService: TerminalService) { }

    @Post()
    create(@Body() createTerminalDto: CreateTerminalDto) {
        return this.terminalService.create(createTerminalDto);
    }

    @Get()
    findAll() {
        return this.terminalService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.terminalService.findOne(id);
    }
}
