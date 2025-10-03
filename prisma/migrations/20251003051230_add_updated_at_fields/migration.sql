/*
  Warnings:

  - Added the required column `updated_at` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
