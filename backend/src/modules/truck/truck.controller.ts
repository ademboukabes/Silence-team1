import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { TruckService } from './truck.service';
import { CreateTruckDto } from './dto/create-truck.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Trucks')
@Controller('trucks')
export class TruckController {
    constructor(private readonly truckService: TruckService) { }

    @Post()
    create(@Body() createTruckDto: CreateTruckDto) {
        return this.truckService.create(createTruckDto);
    }

    @Get()
    findAll() {
        return this.truckService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.truckService.findOne(id);
    }
}
