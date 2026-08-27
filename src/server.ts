import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import userRouter from "./routes/users.routes.js";
import { errorHandler } from './middlewares/errorHandler.js';
import authRouter from "./routes/autn.routes.js"; 
import clientRequestRouter from "./routes/client_request.routes.js";
import driverPositionRouter from "./routes/driver_position.routes.js";
import driverTripOfferRouter from "./routes/driver_trip_offer.routes.js";
import driverCarInfoRautes from "./routes/driver_car_info.routes.js";
import { initializaSocket } from './sockets/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Rutas de carpetas
const publicDir = path.join(__dirname, "../public");
const baseUploadsDir = path.join(publicDir, "uploads");
const usersUploadsDir = path.join(baseUploadsDir, "users");

// Creación segura de carpetas si no existen
if (!fs.existsSync(baseUploadsDir)) {
  fs.mkdirSync(baseUploadsDir, { recursive: true });
}
if (!fs.existsSync(usersUploadsDir)) {
  fs.mkdirSync(usersUploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// 🔴 CORRECCIÓN CLAVE DE RUTAS ESTÁTICAS PARA RAILWAY:
// Sirve la carpeta 'public' completa para rutas como /public/uploads/users/...
app.use("/public", express.static(publicDir));
// Sirve la carpeta 'uploads' para rutas como /uploads/users/...
app.use("/uploads", express.static(baseUploadsDir));
// Sirve archivos directos en raíz pública
app.use(express.static(publicDir));

// Rutas API
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/drivers-position", driverPositionRouter);
app.use("/client-requests", clientRequestRouter);
app.use("/driver-trip-offers", driverTripOfferRouter);
app.use("/driver-car-info", driverCarInfoRautes);

app.get("/", (req, res) => {
  res.json({ message: "BIENVENIDOS A TODOS" });
});

app.use(errorHandler);

const server = http.createServer(app);
initializaSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🟢 Servidor corriendo exitosamente en el puerto ${PORT}`);
});