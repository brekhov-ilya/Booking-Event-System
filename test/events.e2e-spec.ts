/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { TestHelper } from './test-helpers';

describe('Events (e2e)', () => {
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

  describe('/api/events (POST)', () => {
    it('should create a new event', async () => {
      const createEventDto = {
        name: 'Test Concert',
        totalSeats: 100,
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
        .send(createEventDto)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: expect.any(Number),
          name: 'Test Concert',
          totalSeats: 100,
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        },
      });
    });

    it('should return validation error for invalid data', async () => {
      const invalidDto = {
        name: '',
        totalSeats: -1,
      };

      const response = await request(app.getHttpServer())
        .post('/api/events')
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

  describe('/api/events (GET)', () => {
    it('should return all events', async () => {
      // Create test events
      await testHelper.createTestEvent({ name: 'Event 1', totalSeats: 50 });
      await testHelper.createTestEvent({ name: 'Event 2', totalSeats: 100 });

      const response = await request(app.getHttpServer())
        .get('/api/events')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            name: 'Event 1',
            totalSeats: 50,
          }),
          expect.objectContaining({
            name: 'Event 2',
            totalSeats: 100,
          }),
        ]),
      });
      expect(response.body.data).toHaveLength(2);
    });

    it('should return empty array when no events', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
      });
    });
  });

  describe('/api/events/:id (GET)', () => {
    it('should return event by id', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 75,
      });

      const response = await request(app.getHttpServer())
        .get(`/api/events/${event.id}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: event.id,
          name: 'Test Event',
          totalSeats: 75,
          bookings: [],
          _count: { bookings: 0 },
        },
      });
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Событие 999 не найдено',
        },
      });
    });
  });

  describe('/api/events/:id/available-seats (GET)', () => {
    it('should return available seats', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Test Event',
        totalSeats: 100,
      });

      // Create some bookings
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user1',
      });
      await testHelper.createTestBooking({
        eventId: event.id,
        userId: 'user2',
      });

      const response = await request(app.getHttpServer())
        .get(`/api/events/${event.id}/available-seats`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          availableSeats: 98, // 100 - 2
        },
      });
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/events/999/available-seats')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Событие 999 не найдено',
        },
      });
    });
  });

  describe('/api/events/:id (PATCH)', () => {
    it('should update event', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Original Event',
        totalSeats: 50,
      });

      const updateDto = {
        name: 'Updated Event',
        totalSeats: 75,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/events/${event.id}`)
        .send(updateDto)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: event.id,
          name: 'Updated Event',
          totalSeats: 75,
        },
      });
    });

    it('should return 404 for non-existent event', async () => {
      const updateDto = {
        name: 'Updated Event',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/events/999')
        .send(updateDto)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Событие 999 не найдено',
        },
      });
    });
  });

  describe('/api/events/:id (DELETE)', () => {
    it('should delete event', async () => {
      const event = await testHelper.createTestEvent({
        name: 'Event to Delete',
        totalSeats: 50,
      });

      await request(app.getHttpServer())
        .delete(`/api/events/${event.id}`)
        .expect(200);

      // Verify event is deleted
      await request(app.getHttpServer())
        .get(`/api/events/${event.id}`)
        .expect(404);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/events/999')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        data: {
          statusCode: 404,
          message: 'Событие 999 не найдено',
        },
      });
    });
  });
});
