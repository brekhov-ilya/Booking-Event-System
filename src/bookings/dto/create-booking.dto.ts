import { IsInt, IsString } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  eventId: number;

  @IsString()
  userId: string;
}
