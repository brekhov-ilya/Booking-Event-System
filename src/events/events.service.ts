import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async create(createEventDto: CreateEventDto) {
    return this.prisma.event.create({
      data: createEventDto,
    });
  }

  async findAll() {
    return this.prisma.event.findMany();
  }

  async findOne(id: number) {
    return this.prisma.event.findUnique({
      where: { id },
      include: {
        bookings: true,
        _count: {
          select: { bookings: true },
        },
      },
    });
  }

  async update(id: number, updateEventDto: UpdateEventDto) {
    return this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });
  }

  async remove(id: number) {
    await this.prisma.event.delete({
      where: { id },
    });
  }

  async getAvailableSeats(id: number) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!event) {
      return null;
    }

    return event.totalSeats - event._count.bookings;
  }
}
