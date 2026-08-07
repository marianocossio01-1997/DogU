import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRouter from "./routes/users.routes.js";
import { errorHandler } from './middlewares/errorHandler.js';
import authRouter from "./routes/autn.routes.js";
import clientRequestRouter from "./routes/client_request.routes.js";
import driverPositionRouter from "./routes/driver_position.routes.js";
import driverTripOfferRouter from "./routes/driver_trip_offer.routes.js";
import driverCarInfoRautes from "./routes/driver_car_info.routes.js";
import path from "path";
import { file } from 'zod';
import { fileURLToPath } from 'url';
import { initializaSocket } from './sockets/socketHandler.js';
import http from 'http';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
app.use(cors());
app.use(express.json());
app.use("/users", userRouter);
app.use("/auth", authRouter);
app.use("/drivers-position", driverPositionRouter);
app.use("/client-requests", clientRequestRouter);
app.use("/driver-trip-offers", driverTripOfferRouter);
app.use("/driver-car-info", driverCarInfoRautes);
app.get("/", (req, res) => {
    res.json({
        message: "BIENVENIDOS A TODOS"
    });
});
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));
app.use(errorHandler);
const server = http.createServer(app);
initializaSocket(server);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";
server.listen(Number(PORT), HOST, () => {
    console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
});
//# sourceMappingURL=server.js.map