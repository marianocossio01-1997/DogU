import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";
import prisma from "../database/prismaClient.js";

let io: Server;

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
        socket.on("send_message", async (data: any) => {
            try {
                const idClientRequest = data?.id_client_request || data?.idClientRequest;
                const idSender = data?.id_sender || data?.idSender;
                const idReceiver = data?.id_receiver || data?.idReceiver;
                const message = data?.message;

                if (!idClientRequest || !idSender || !idReceiver || !message) {
                    console.warn("⚠️ Evento 'send_message' incompleto recibido:", data);
                    return;
                }
                const payload = {
                    id_client_request: Number(idClientRequest),
                    id_sender: Number(idSender),
                    id_receiver: Number(idReceiver),
                    message: message,
                    created_at: new Date().toISOString()
                };
                const channel = `message_received/${idClientRequest}`;
                console.log(`💬 Retransmitiendo mensaje a '${channel}':`, message);
                io.emit(channel, payload);
                await prisma.chatMessage.create({
                    data: {
                        id_client_request: Number(idClientRequest),
                        id_sender: Number(idSender),
                        id_receiver: Number(idReceiver),
                        message: message,
                    }
                });
            } catch (error) {
                console.error("🚨 Error al procesar y guardar 'send_message':", error);
            }
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
                        console.warn("⚠️ No se pudo consultar prisma.user directamente:", dbError);
                    }
                }
                const rawImage = clientObj?.image || data?.client_image || data?.image || "";
                const finalImageUrl = formatImageUrl(rawImage);
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
                io.emit("created_client_request", {
                    "id_socket": socket.id,
                    "id_client_request": data?.id_client_request || data?.id,
                    ...data
                });
            }
        });
        socket.on("new_driver_offer", async (data: any) => {
            try {
                if (!data?.id_client_request) {
                    console.log("⚠️ Evento 'new_driver_offer' recibido sin 'id_client_request'");
                    return;
                }
                const idClientRequest = String(data.id_client_request).trim();
                const idDriver = data?.id_driver || data?.idDriver || data?.driver?.id;
                let driverObj = data?.driver || {};
                if (idDriver) {
                    try {
                        const driverDb = await prisma.user.findUnique({
                            where: { id: Number(idDriver) },
                            select: {
                                id: true,
                                fullname: true,
                                email: true,
                                phone: true,
                                image: true,
                            }
                        });

                        if (driverDb) {
                            driverObj = {
                                ...driverObj,
                                ...driverDb
                            };
                        }
                    } catch (dbError) {
                        console.warn("⚠️ No se pudo consultar prisma.user para el conductor:", dbError);
                    }
                }
                const rawDriverImage = driverObj?.image || data?.driver_image || data?.image || "";
                const finalDriverImageUrl = formatImageUrl(rawDriverImage);
                const updatedDriver = {
                    ...driverObj,
                    image: finalDriverImageUrl
                };
                const offerPayload = {
                    ...data,
                    "id_socket": socket.id,
                    "id_client_request": Number(idClientRequest),
                    "driver": updatedDriver,
                    "driver_image": finalDriverImageUrl || ""
                };
                const targetChannel = `created_driver_offer/${idClientRequest}`;
                console.log(`📡 [SOCKET] Retransmitiendo oferta del conductor con foto (${finalDriverImageUrl}) al canal: '${targetChannel}'`);
                io.emit(targetChannel, offerPayload);
            } catch (error) {
                console.error("🚨 Error grave al procesar 'new_driver_offer':", error);
                const idClientRequest = String(data?.id_client_request).trim();
                io.emit(`created_driver_offer/${idClientRequest}`, {
                    "id_socket": socket.id,
                    "id_client_request": Number(idClientRequest),
                    ...data
                });
            }
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