import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";

let io: Server;
export const initializaSocket = (server: Httpserver) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on("connection", (socket: Socket) => {
        console.log("🟢 Cliente/Conductor conectado a Socket.io:", socket.id);
        socket.on("message", (data: any) => {
            console.log("Mensaje recibido:", data);
            io.emit("new_message", "Saludos desde el servidor");
        });
        socket.on("change_driver_position", (data: any) => {
            const position = {
                "id_socket": socket.id,
                "id": data?.id,
                "lat": data?.lat,
                "lng": data?.lng,
            };
            io.emit("new_driver_position", position);
        });
        socket.on("new_client_request", (data: any) => {
            const idRequest = data?.id_client_request || data?.id;
            const clientRequest = {
                "id_socket": socket.id,
                "id_client_request": idRequest,
                ...data
            };
            console.log("📡 Retransmitiendo 'created_client_request' a todos los conductores:", clientRequest);
            io.emit("created_client_request", clientRequest);
        });
        socket.on("new_driver_offer", (data: any) => {
            if (!data?.id_client_request) {
                console.log("⚠️ Evento 'new_driver_offer' recibido sin 'id_client_request'");
                return;
            }
            const idClientRequest = String(data.id_client_request).trim();
            const offerPayload = {
                "id_socket": socket.id,
                "id_client_request": Number(idClientRequest),
                ...data
            };
            const targetChannel = `created_driver_offer/${idClientRequest}`;
            console.log(`📡 [SOCKET] Retransmitiendo oferta del conductor al canal: '${targetChannel}'`);
            io.emit(targetChannel, offerPayload);
        });
        socket.on("new_driver_assigned", (data: any) => {
            const idDriver = data?.id_driver;
            const clientRequest = {
                "id_socket": socket.id,
                "id_client_request": data?.id_client_request,
                "id_driver": idDriver
            };
            console.log(`🚕 Nuevo conductor asignado (${idDriver}) para viaje:`, clientRequest);
            io.emit(`driver_assigned/${idDriver}`, clientRequest);
        });
        socket.on("trip_change_driver_position", (data: any) => {
            const idClient = data?.id_client;
            const driverPosition = {
                "id_socket": socket.id,
                "lat": data?.lat,
                "lng": data?.lng
            };
            io.emit(`trip_new_driver_position/${idClient}`, driverPosition);
        });
        socket.on("update_status_trip", (data: any) => {
            const idClientRequest = data?.id_client_request;
            const clientRequest = {
                "id_socket": socket.id,
                "id_client_request": idClientRequest,
                "status": data?.status
            };
            io.emit(`new_status_trip/${idClientRequest}`, clientRequest);
        });
        socket.on("disconnect_driver", (data: any) => {
            io.emit("driver_disconnected", { 
                id: data?.id, 
                id_socket: socket.id 
            });
        });
        socket.on("disconnect", () => {
            console.log("🔴 Cliente desconectado:", socket.id);
            io.emit("driver_disconnected", { 
                id_socket: socket.id,
            });
        });
    });
};
export const getIO = (): Server => { 
    if (!io) {
        throw new AppError("Socket.io no ha sido inicializado", 500);
    }
    return io;
};

