/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestHelper } from './test-helpers';

describe('Bookings (e2e)', () => {
  let app: INestApplication;
  let testHelper: TestHelper;

  beforeAll(async () => {
    testHelper = new TestHelper();
    app = await testHelper.setupApp();
  });

  beforeEach(async () => {
    await testHelper.cleanDatabase();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('/api/bookings/reserve (POST)', () => {
    it('should create a new booking', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      const createBookingDto = {
        eventId: event.id,
        userId: 'user123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(createBookingDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(Number),
          eventId: event.id,
          userId: 'user123',
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          event: {
            id: event.id,
            name: 'Test Event',
          },
        },
      });
    });

    it('should return 404 for non-existent event', async () => {
      const createBookingDto = {
        eventId: 999,
        userId: 'user123',
      };

      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(createBookingDto)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Событие с id 999 не найдено',
        },
      });
    });

    it('should return 400 for duplicate booking', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      const createBookingDto = {
        eventId: event.id,
        userId: 'user123',
      };

      // First booking - should succeed
      await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(createBookingDto)
        .expect(201);

      // Second booking - should fail
      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(createBookingDto)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 400,
          message:
            'Пользователь уже забронировал это мероприятие. Допускается только одно бронирование на одно мероприятие от одного пользователя.',
        },
      });
    });

    it('should return 400 when no seats available', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Small Event',
        totalSeats: 1,
      });

      // Fill the only seat
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });

      const createBookingDto = {
        eventId: event.id,
        userId: 'user2',
      };

      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(createBookingDto)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 400,
          message: 'Нет доступных мест для бронирования',
        },
      });
    });

    it('should return validation error for invalid data', async () => {
      const invalidDto = {
        eventId: 'invalid',
        userId: '',
      };

      const response = await request(app.getHttpServer())
        .post('/api/bookings/reserve')
        .send(invalidDto)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 400,
          message: expect.any(Array),
        },
      });
    });
  });

  describe('/api/bookings (GET)', () => {
    it('should return all bookings', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user2',
      });

      const response = await request(app.getHttpServer())
        .get('/api/bookings')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user1',
            eventId: event.id,
          }),
          expect.objectContaining({
            userId: 'user2',
            eventId: event.id,
          }),
        ]),
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter bookings by userId', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user2',
      });

      const response = await request(app.getHttpServer())
        .get('/api/bookings?userId=user1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          expect.objectContaining({
            userId: 'user1',
            eventId: event.id,
          }),
        ],
      });
      expect(response.body.data).toHaveLength(1);
    });

    it('should filter bookings by eventId', async () => {
      const event1 = await testHelper.createTestEvent({
        name: 'Event 1',
        totalSeats: 100,
      });
      const event2 = await testHelper.createTestEvent({
        name: 'Event 2',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event1.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event2.id,
        userId: 'user1',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/bookings?eventId=${event1.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          expect.objectContaining({
            userId: 'user1',
            eventId: event1.id,
          }),
        ],
      });
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('/api/bookings/user/:userId (GET)', () => {
    it('should return bookings for specific user', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user2',
      });

      const response = await request(app.getHttpServer())
        .get('/api/bookings/user/user1')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          expect.objectContaining({
            userId: 'user1',
            eventId: event.id,
          }),
        ],
      });
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('/api/bookings/event/:eventId (GET)', () => {
    it('should return bookings for specific event', async () => {
      const event1 = await testHelper.createTestEvent({
        name: 'Event 1',
        totalSeats: 100,
      });
      const event2 = await testHelper.createTestEvent({
        name: 'Event 2',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event1.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event2.id,
        userId: 'user1',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/bookings/event/${event1.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [
          expect.objectContaining({
            userId: 'user1',
            eventId: event1.id,
          }),
        ],
      });
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('/api/bookings/:id (GET)', () => {
    it('should return booking by id', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      const booking = await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/bookings/${booking.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: booking.id,
          userId: 'user1',
          eventId: event.id,
          event: {
            id: event.id,
            name: 'Test Event',
          },
        },
      });
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/bookings/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Бронирование 999 не найдено',
        },
      });
    });
  });

  describe('/api/bookings/:id (DELETE)', () => {
    it('should cancel booking by id', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      const booking = await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });

      await request(app.getHttpServer())
        .delete(`/api/bookings/${booking.id}`)
        .expect(200);

      // Verify booking is deleted
      await request(app.getHttpServer())
        .get(`/api/bookings/${booking.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/bookings/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Бронирование не найдено',
        },
      });
    });
  });

  describe('/api/bookings/event/:eventId/user/:userId (DELETE)', () => {
    it('should cancel booking by event and user', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });

      await request(app.getHttpServer())
        .delete(`/api/bookings/event/${event.id}/user/user1`)
        .expect(200);

      // Verify booking is deleted
      const response = await request(app.getHttpServer())
        .get(`/api/bookings/user/user1`)
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/bookings/event/999/user/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Бронирование пользователя nonexistent на мероприятие 999',
        },
      });
    });
  });
});
