import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('api/bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post('reserve')
  reserve(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.reserve(createBookingDto);
  }

  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('eventId') eventId?: string,
  ) {
    if (userId) {
      return this.bookingsService.findByUser(userId);
    }
    if (eventId) {
      return this.bookingsService.findByEvent(parseInt(eventId));
    }
    return this.bookingsService.findAll();
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('event/:eventId')
  findByEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.bookingsService.findByEvent(eventId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const booking = await this.bookingsService.findOne(id);
    if (!booking) {
      throw new NotFoundException(`Бронирование ${id} не найдено`);
    }
    return booking;
  }

  @Delete(':id')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.cancel(id);
  }

  @Delete('event/:eventId/user/:userId')
  cancelByUserAndEvent(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('userId') userId: string,
  ) {
    return this.bookingsService.cancelByUserAndEvent(eventId, userId);
  }
}
