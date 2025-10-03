import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

export class TestHelper {
  private app: INestApplication;
  private prismaService: PrismaService;

  async setupApp(): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.prismaService = this.app.get<PrismaService>(PrismaService);

    // Apply the same configuration as in main.ts
    this.app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    this.app.useGlobalInterceptors(new ResponseInterceptor());
    this.app.useGlobalFilters(new HttpExceptionFilter());

    await this.app.init();
    return this.app;
  }

  async cleanDatabase(): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await this.prismaService.booking.deleteMany();
    await this.prismaService.event.deleteMany();
  }

  async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  getPrismaService(): PrismaService {
    return this.prismaService;
  }

  getApp(): INestApplication {
    return this.app;
  }

  // Helper method to create test event
  async createTestEvent(data: { name: string; totalSeats: number }) {
    return this.prismaService.event.create({
      data,
    });
  }

  // Helper method to create test booking
  async createTestBooking(data: { eventId: number; userId: string }) {
    return this.prismaService.booking.create({
      data,
      include: {
        event: true,
      },
    });
  }
}
