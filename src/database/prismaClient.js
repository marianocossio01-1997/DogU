import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";
const adapter = new PrismaMariaDb({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "mariano154367892",
    database: "doguber_1",
    connectionLimit: 10,
    allowPublicKeyRetrieval: true
});
const prisma = new PrismaClient({ adapter });
export default prisma;
//# sourceMappingURL=prismaClient.js.map