import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('api/events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() createEventDto: CreateEventDto) {
    return this.eventsService.create(createEventDto);
  }

  @Get()
  findAll() {
    return this.eventsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    if (!event) {
      throw new NotFoundException(`Событие ${id} не найдено`);
    }
    return event;
  }

  @Get(':id/available-seats')
  async getAvailableSeats(@Param('id', ParseIntPipe) id: number) {
    const availableSeats = await this.eventsService.getAvailableSeats(id);
    if (availableSeats === null) {
      throw new NotFoundException(`Событие ${id} не найдено`);
    }
    return { availableSeats };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    const event = await this.eventsService.findOne(id);
    if (!event) {
      throw new NotFoundException(`Событие ${id} не найдено`);
    }
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const event = await this.eventsService.findOne(id);
    if (!event) {
      throw new NotFoundException(`Событие ${id} не найдено`);
    }
    return this.eventsService.remove(id);
  }
}
