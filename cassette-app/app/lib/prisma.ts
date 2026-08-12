import { PrismaClient } from "@prisma/client";

// Prevent multiple PrismaClient instances in Next.js hot-reload (dev)
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Test connection on initialization
if (process.env.NODE_ENV === "production") {
  prisma.$connect()
    .then(() => console.log("✓ Prisma connected to database"))
    .catch((err) => console.error("✗ Prisma connection failed:", err.message));
}
