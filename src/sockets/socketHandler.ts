import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";
import prisma from "../database/prismaClient.js";

let io: Server;
const activeDriversMap = new Map<number, { id: number; lat: number; lng: number; updatedAt: number }>();
const socketToDriverMap = new Map<string, number>();

const formatImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null') return null;
    const cleanPath = imagePath.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }
    const baseUrl = process.env.PUBLIC_URL || process.env.RAILWAY_STATIC_URL || "https://dogu-production-813e.up.railway.app";
    const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `${baseUrl}${pathWithSlash}`;
};

export const initializaSocket = (server: Httpserver) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });

    io.on("connection", (socket: Socket) => {
        console.log("🟢 Cliente/Conductor conectado a Socket.io:", socket.id);

        socket.on("change_driver_position", (data: any) => {
            const driverId = Number(data?.id || data?.id_driver);
            const lat = Number(data?.lat);
            const lng = Number(data?.lng);

            if (driverId && lat && lng) {
                socketToDriverMap.set(socket.id, driverId);

                activeDriversMap.set(driverId, {
                    id: driverId,
                    lat: lat,
                    lng: lng,
                    updatedAt: Date.now()
                });

                const position = {
                    "id_socket": socket.id,
                    "id": driverId,
                    "id_driver": driverId,
                    "lat": lat,
                    "lng": lng,
                };
                io.emit("new_driver_position", position);
            }
        });

        socket.on("get_nearby_drivers", async (data: any) => {
            try {
                const driversFromMemory = Array.from(activeDriversMap.values()).filter(
                    d => Date.now() - d.updatedAt < 5 * 60 * 1000 
                );

                if (driversFromMemory.length > 0) {
                    socket.emit("nearby_drivers", driversFromMemory);
                    return;
                }

                const dbDrivers = await prisma.driverPosition.findMany({
                    take: 15
                });
                const formattedDrivers = dbDrivers.map((d: any) => ({
                    id: d.id_driver || d.id,
                    id_driver: d.id_driver || d.id,
                    lat: Number(d.lat),
                    lng: Number(d.lng)
                }));

                socket.emit("nearby_drivers", formattedDrivers);
            } catch (error) {
                console.error("🚨 Error al procesar 'get_nearby_drivers':", error);
                socket.emit("nearby_drivers", []);
            }
        });

        socket.on("created_client_request", (data: any) => {
            console.log("📢 Nueva solicitud de viaje creada:", data?.id || data?.id_client_request);
            io.emit("created_client_request", data);
            io.emit("new_client_request", data);
        });

        socket.on("new_client_request", (data: any) => {
            console.log("📢 Nueva solicitud de viaje creada (alias):", data?.id || data?.id_client_request);
            io.emit("created_client_request", data);
            io.emit("new_client_request", data);
        });

        // 📢 RETRANSMISIÓN DE OFERTAS DEL CONDUCTOR -> AL CLIENTE (FIX)
        socket.on("new_driver_offer", (data: any) => {
            console.log("📢 Nueva oferta enviada por conductor:", data);
            const idClientRequest = data?.id_client_request || data?.idClientRequest;

            if (idClientRequest) {
                io.emit(`created_driver_offer/${idClientRequest}`, data);
            }
            io.emit("new_driver_offer", data);
            io.emit("created_driver_offer", data);
        });

        socket.on("disconnect_driver", (data: any) => {
            const driverId = Number(data?.id || data?.id_driver) || socketToDriverMap.get(socket.id);
            
            if (driverId) {
                activeDriversMap.delete(driverId);
                socketToDriverMap.delete(socket.id);
                console.log(`🔴 Conductor ${driverId} desconectado explícitamente.`);
                io.emit("driver_disconnected", { id: driverId, id_socket: socket.id });
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 Socket desconectado:", socket.id);
            const driverId = socketToDriverMap.get(socket.id);
            
            if (driverId) {
                activeDriversMap.delete(driverId);
                socketToDriverMap.delete(socket.id);
                console.log(`🔴 Conductor ${driverId} desconectado por pérdida de socket.`);
                io.emit("driver_disconnected", { id: driverId, id_socket: socket.id });
            }
        });
    });
};

export const getIO = (): Server => { 
    if (!io) {
        throw new AppError("Socket.io no ha sido inicializado", 500);
    }
    return io;
};