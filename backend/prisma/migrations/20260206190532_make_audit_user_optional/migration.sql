/*
  Warnings:

  - The primary key for the `Booking` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `endDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `resourceId` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `Availability` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `AvailabilitySlot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Resource` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `carrierId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverEmail` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverMatricule` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverName` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverPhone` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gateId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSlotId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `truckId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Booking` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CONSUMED');

-- CreateEnum
CREATE TYPE "GateType" AS ENUM ('IN', 'OUT', 'GENERIC');

-- DropForeignKey
ALTER TABLE "Availability" DROP CONSTRAINT "Availability_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "AvailabilitySlot" DROP CONSTRAINT "AvailabilitySlot_availabilityId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_resourceId_fkey";

-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_userId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_pkey",
DROP COLUMN "endDate",
DROP COLUMN "resourceId",
DROP COLUMN "startDate",
ADD COLUMN     "carrierId" INTEGER NOT NULL,
ADD COLUMN     "driverEmail" TEXT NOT NULL,
ADD COLUMN     "driverMatricule" TEXT NOT NULL,
ADD COLUMN     "driverName" TEXT NOT NULL,
ADD COLUMN     "driverPhone" TEXT NOT NULL,
ADD COLUMN     "gateId" INTEGER NOT NULL,
ADD COLUMN     "merchandiseDescription" TEXT,
ADD COLUMN     "qrCode" TEXT,
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "timeSlotId" INTEGER NOT NULL,
ADD COLUMN     "truckId" INTEGER NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET NOT NULL,
ALTER COLUMN "notes" DROP NOT NULL,
ADD CONSTRAINT "Booking_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Booking_id_seq";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "device_type" DROP NOT NULL,
ALTER COLUMN "notification_token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isAdmin",
ADD COLUMN     "carrierId" INTEGER,
ADD COLUMN     "role" TEXT NOT NULL DEFAULT 'CARRIER',
ADD COLUMN     "terminalId" INTEGER;

-- DropTable
DROP TABLE "Availability";

-- DropTable
DROP TABLE "AvailabilitySlot";

-- DropTable
DROP TABLE "Resource";

-- CreateTable
CREATE TABLE "Port" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Port_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Terminal" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "portId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Terminal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GateType" NOT NULL DEFAULT 'GENERIC',
    "terminalId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" SERIAL NOT NULL,
    "gateId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxCapacity" INTEGER NOT NULL,
    "currentBookings" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carrier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carrier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Truck" (
    "id" SERIAL NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "driverName" TEXT,
    "carrierId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Truck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "actionType" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "userId" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Carrier_code_key" ON "Carrier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Truck_licensePlate_key" ON "Truck"("licensePlate");

-- AddForeignKey
ALTER TABLE "Terminal" ADD CONSTRAINT "Terminal_portId_fkey" FOREIGN KEY ("portId") REFERENCES "Port"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gate" ADD CONSTRAINT "Gate_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Truck" ADD CONSTRAINT "Truck_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_terminalId_fkey" FOREIGN KEY ("terminalId") REFERENCES "Terminal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Carrier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_gateId_fkey" FOREIGN KEY ("gateId") REFERENCES "Gate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_timeSlotId_fkey" FOREIGN KEY ("timeSlotId") REFERENCES "TimeSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_truckId_fkey" FOREIGN KEY ("truckId") REFERENCES "Truck"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
