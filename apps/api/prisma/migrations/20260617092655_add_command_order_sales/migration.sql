-- CreateEnum
CREATE TYPE "SalesOrderSyncCommandStatus" AS ENUM ('ACCEPTED', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "SalesOrderSyncCommandSource" AS ENUM ('API2', 'JOB', 'ADMIN');
