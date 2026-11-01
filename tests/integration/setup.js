import { beforeEach, afterAll } from "vitest";
import prisma from "@/lib/prisma";

if (new URL(process.env.DATABASE_URL).pathname !== "/shortlys_integration_test") {
  throw new Error("Refusing to clean a database outside the integration test sandbox.");
}

beforeEach(async () => {
  await prisma.visit.deleteMany();
  await prisma.qrCode.deleteMany();
  await prisma.url.deleteMany();
  await prisma.rateLimit.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
