import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";
import prisma from "../database/prismaClient.js";

let io: Server;

// Helper para garantizar que la imagen siempre tenga el dominio/host correcto de Railway
const formatImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null') return null;
    const cleanPath = imagePath.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }
    const host = process.env.HOST || '192.168.1.10';
    const port = process.env.PORT || '3000';
    const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    return `http://${host}:${port}${pathWithSlash}`;
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

        socket.on("new_client_request", async (data: any) => {
            try {
                const idRequest = data?.id_client_request || data?.id;
                const idClient = data?.id_client || data?.client?.id || data?.idClient;
                let clientObj = data?.client || {};

                // 1. Buscamos el usuario cliente en la tabla `users` (plural en Prisma)
                if (idClient) {
                    try {
                        const userDb = await prisma.user.findUnique({
                            where: { id: Number(idClient) },
                            select: {
                                id: true,
                                fullname: true,
                                email: true,
                                phone: true,
                                image: true,
                            }
                        });

                        if (userDb) {
                            clientObj = {
                                ...clientObj,
                                ...userDb
                            };
                        }
                    } catch (dbError) {
                        console.warn("⚠️ No se pudo consultar prisma.users directamente:", dbError);
                    }
                }

                // 2. Resolver la ruta final de la foto formateada
                const rawImage = clientObj?.image || data?.client_image || data?.image || "";
                const finalImageUrl = formatImageUrl(rawImage);

                // 3. Estructurar cliente con la URL procesada
                const updatedClient = {
                    ...clientObj,
                    image: finalImageUrl
                };

                const clientRequest = {
                    ...data,
                    "id": Number(idRequest),
                    "id_socket": socket.id,
                    "id_client_request": Number(idRequest),
                    "client": updatedClient,
                    "client_image": finalImageUrl || ""
                };

                console.log("📡 Retransmitiendo 'created_client_request' con foto:", {
                    id_request: idRequest,
                    client_name: updatedClient?.fullname,
                    client_image: finalImageUrl
                });

                io.emit("created_client_request", clientRequest);
            } catch (error) {
                console.error("🚨 Error grave al procesar 'new_client_request':", error);
                
                // Fallback de retransmisión
                io.emit("created_client_request", {
                    "id_socket": socket.id,
                    "id_client_request": data?.id_client_request || data?.id,
                    ...data
                });
            }
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




/* import { Server, Socket } from "socket.io";
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

 */