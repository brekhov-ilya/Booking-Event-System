import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async reserve(createBookingDto: CreateBookingDto) {
    const { eventId, userId } = createBookingDto;

    try {
      // Проверяем существование события
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
        include: {
          _count: {
            select: { bookings: true },
          },
        },
      });

      if (!event) {
        throw new NotFoundException(`Событие с id ${eventId} не найдено`);
      }

      // Проверяем доступность мест
      if (event._count.bookings >= event.totalSeats) {
        throw new BadRequestException('Нет доступных мест для бронирования');
      }

      // Создаем бронирование
      return await this.prisma.booking.create({
        data: {
          eventId,
          userId,
        },
        include: {
          event: true,
        },
      });
    } catch (error) {
      // Обрабатываем ошибку уникальности (P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Пользователь уже забронировал это мероприятие. Допускается только одно бронирование на одно мероприятие от одного пользователя.',
          );
        }
      }
      throw error;
    }
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        event: true,
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        event: true,
      },
    });
  }

  async findByEvent(eventId: number) {
    return this.prisma.booking.findMany({
      where: { eventId },
      include: {
        event: true,
      },
    });
  }

  async findOne(id: number) {
    return this.prisma.booking.findUnique({
      where: { id },
      include: {
        event: true,
      },
    });
  }

  async cancel(id: number) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new NotFoundException(`Бронирование не найдено`);
    }

    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async cancelByUserAndEvent(eventId: number, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });

    if (!booking) {
      throw new NotFoundException(
        `Бронирование пользователя ${userId} на мероприятие ${eventId}`,
      );
    }

    return this.prisma.booking.delete({
      where: {
        eventId_userId: {
          eventId,
          userId,
        },
      },
    });
  }
}
