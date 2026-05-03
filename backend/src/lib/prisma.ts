import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check backend/.env");
}

const prisma = new PrismaClient();

export default prisma;
