# Booking Event System

Система бронирования мест на события на основе NestJS. Позволяет пользователям резервировать места на мероприятия с уникальными ограничениями.

## Описание проекта

NestJS приложение для управления бронированиями событий с ключевой бизнес-логикой: один пользователь не может забронировать дважды на одно событие. Система обеспечивает создание событий, бронирование мест и отслеживание доступных мест.

## Основные возможности

- **Управление событиями**: создание, обновление, удаление и просмотр событий
- **Система бронирования**: резервирование мест с проверкой доступности
- **Уникальные ограничения**: одно бронирование на пользователя на событие
- **Отслеживание доступности**: автоматический подсчет свободных мест
- **Универсальный формат ответов**: единый формат `{success: boolean, data: T}` для всех API endpoints
- **Comprehensive тестирование**: полное покрытие unit и e2e тестами

## Технологический стек

- **Framework**: NestJS (Node.js фреймворк)
- **Language**: TypeScript с target ES2023
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: Yarn
- **Testing**: Jest для unit и e2e тестов
- **Validation**: class-validator + class-transformer
- **Code Quality**: ESLint + Prettier
- **Containerization**: Docker для базы данных

## Быстрый старт

1. **Установка зависимостей:**

   ```bash
   yarn install
   ```

2. **Запуск базы данных:**

   ```bash
   yarn db:up
   ```

3. **Выполнение миграций:**

   ```bash
   yarn prisma:migrate
   ```

4. **Генерация Prisma Client:**

   ```bash
   yarn prisma:generate
   ```

5. **Запуск приложения:**
   ```bash
   yarn start:dev
   ```

API будет доступно по адресу `http://localhost:3000`

## Документация API

Полная документация API доступна по ссылке: https://y0pi8hbxjb.apidog.io/

### Формат ответов

Все API endpoints возвращают ответы в едином формате:

**Успешный ответ:**

```json
{
  "success": true,
  "data": {
    // данные ответа
  }
}
```

**Ответ с ошибкой:**

```json
{
  "success": false,
  "data": {
    "statusCode": 400,
    "timestamp": "2023-01-01T00:00:00.000Z",
    "path": "/api/events",
    "message": "Описание ошибки"
  }
}
```

## Схема базы данных

### События (Events)

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  total_seats INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Бронирования (Bookings)

```sql
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id),
  user_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
```

## Разработка

### Основные команды

- `yarn start:dev` - запуск в режиме разработки с hot reload
- `yarn start:debug` - запуск в debug режиме
- `yarn build` - сборка приложения в production
- `yarn start:prod` - запуск production версии

### Тестирование и качество кода

- `yarn test` - запуск e2e тестов
- `yarn test:watch` - запуск тестов в watch режиме
- `yarn test:cov` - запуск тестов с coverage
- `yarn lint` - проверка и автоисправление ESLint ошибок
- `yarn format` - форматирование кода с помощью Prettier

### Управление базой данных

- `yarn db:up` - запуск PostgreSQL через Docker
- `yarn db:down` - остановка PostgreSQL
- `yarn prisma:studio` - открытие Prisma Studio
- `yarn prisma:reset` - сброс базы данных
- `yarn prisma:generate` - генерация Prisma Client

## Тестирование

Проект включает comprehensive покрытие тестами:

- **E2E тесты**: для API endpoints с полной интеграцией
- **Test helpers**: утилиты для настройки тестовой среды

Запуск тестов:

```bash
yarn test        # E2E тесты
```

## Архитектура

### Структура модулей

- **EventsModule**: управление событиями
- **BookingsModule**: система бронирования
- **PrismaModule**: интеграция с базой данных
- **Common**: общие интерцепторы, фильтры, интерфейсы

### Глобальные компоненты

- **ResponseInterceptor**: универсальная обертка ответов
- **HttpExceptionFilter**: обработка ошибок
- **ValidationPipe**: валидация входящих данных

## Бизнес-логика

### Ключевые ограничения

- Один пользователь может забронировать только одно место на событие
- Нельзя забронировать больше мест, чем доступно
- Проверка существования события перед бронированием
- Автоматический подсчет доступных мест

### API Endpoints

- **POST** `/api/events` - создание события
- **GET** `/api/events` - получение всех событий
- **GET** `/api/events/:id` - получение события по ID
- **GET** `/api/events/:id/available-seats` - доступные места
- **PATCH** `/api/events/:id` - обновление события
- **DELETE** `/api/events/:id` - удаление события
- **POST** `/api/bookings/reserve` - бронирование места
- **GET** `/api/bookings` - получение всех бронирований
- **GET** `/api/bookings/user/:userId` - бронирования пользователя
- **GET** `/api/bookings/event/:eventId` - бронирования события
- **DELETE** `/api/bookings/:id` - отмена бронирования
- **DELETE** `/api/bookings/event/:eventId/user/:userId` - отмена конкретного бронирования
