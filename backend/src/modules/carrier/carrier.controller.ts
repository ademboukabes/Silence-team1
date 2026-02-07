import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CarrierService } from './carrier.service';
import { CreateCarrierDto } from './dto/create-carrier.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Carriers')
@Controller('carriers')
export class CarrierController {
    constructor(private readonly carrierService: CarrierService) { }

    @Post()
    create(@Body() createCarrierDto: CreateCarrierDto) {
        return this.carrierService.create(createCarrierDto);
    }

    @Get()
    findAll() {
        return this.carrierService.findAll();
    }

    @Get(':id')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.carrierService.findOne(id);
    }
}
