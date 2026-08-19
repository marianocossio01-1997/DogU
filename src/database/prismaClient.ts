import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const dbUrl = new URL(process.env.DATABASE_URL || "mysql://root:mariano154367892@localhost:3306/doguber_1");

const adapter = new PrismaMariaDb({
  host: dbUrl.hostname,
  port: Number(dbUrl.port) || 3306,
  user: dbUrl.username,
  password: dbUrl.password,
  database: dbUrl.pathname.replace("/", ""),
  connectionLimit: 10,
  allowPublicKeyRetrieval: true
});

const prisma = new PrismaClient({ adapter });

export default prisma;