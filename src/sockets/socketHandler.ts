import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";
import prisma from "../database/prismaClient.js";
import * as DriverWalletService from "../services/driver_wallet.service.js";
import { TransactionType } from "@prisma/client";

let io: Server;
const activeDriversMap = new Map<number, { id: number; lat: number; lng: number; updatedAt: number }>();
const socketToDriverMap = new Map<string, number>();
const getDistanceInKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
const formatImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || typeof imagePath !== 'string') return null;
    let cleanPath = imagePath.replace(/\\/g, '/').trim();
    if (cleanPath === '' || cleanPath === 'null' || cleanPath === 'undefined') return null;
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }
    const baseUrl = process.env.BASE_URL || process.env.SERVER_URL || `http://${process.env.HOST || '192.168.1.10'}:${process.env.PORT || '3000'}`;
    const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}${pathWithSlash}`;
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
            const driverId = Number(data?.id || data?.id_driver);
            const lat = Number(data?.lat);
            const lng = Number(data?.lng);
            if (driverId && !isNaN(lat) && !isNaN(lng)) {
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
                    d => Date.now() - d.updatedAt < 10 * 60 * 1000
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
                            clientObj = { ...clientObj, ...userDb };
                        }
                    } catch (dbError) {
                        console.warn("⚠️ No se pudo consultar prisma.user directamente:", dbError);
                    }
                }
                const incomingImage = data?.client?.image || data?.client_image || data?.image || "";
                const rawImage = (incomingImage && incomingImage.startsWith('http'))
                ? incomingImage
                : (clientObj?.image || incomingImage || "");
                const finalImageUrl = formatImageUrl(rawImage) || rawImage || "";
                const updatedClient = {
                    id: Number(idClient),
                    fullname: clientObj?.fullname || clientObj?.name || data?.fullname || 'Cliente',
                    phone: clientObj?.phone || data?.phone || '',
                    image: finalImageUrl,
                    client_image: finalImageUrl,
                    clientImage: finalImageUrl,
                    user_image: finalImageUrl
                };
                const pickupLat = Number(
                    data?.pickup_lat ??
                    data?.pickupLat ??
                    data?.pickup_position?.lat ??
                    data?.pickup_position?.x ??
                    0.0
                );
                const pickupLng = Number(
                    data?.pickup_lng ??
                    data?.pickupLng ??
                    data?.pickup_position?.lng ??
                    data?.pickup_position?.y ??
                    0.0
                );
                const destLat = Number(
                    data?.destination_lat ??
                    data?.destinationLat ??
                    data?.destination_position?.lat ??
                    data?.destination_position?.x ??
                    0.0
                );
                const destLng = Number(
                    data?.destination_lng ??
                    data?.destinationLng ??
                    data?.destination_position?.lng ??
                    data?.destination_position?.y ??
                    0.0
                );
                const clientRequest = {
                    ...data,
                    "id": Number(idRequest),
                    "id_socket": socket.id,
                    "id_client_request": Number(idRequest),
                    "id_client": Number(idClient),
                    "pet_count": Number(data?.pet_count ?? data?.petCount ?? 1),
                    "is_night_fare": Boolean(data?.is_night_fare ?? data?.isNightFare ?? false),
                    "is_rain_fare": Boolean(data?.is_rain_fare ?? data?.isRainFare ?? false),
                    "client": updatedClient,
                    "client_image": finalImageUrl,
                    "clientImage": finalImageUrl,
                    "user_image": finalImageUrl,
                    "payment_method": data?.payment_method || "CASH",
                    "payment_status": data?.payment_status || "PENDING",
                    "payment_id": data?.payment_id || null,
                    "pickupLat": pickupLat,
                    "pickupLng": pickupLng,
                    "pickup_lat": pickupLat,
                    "pickup_lng": pickupLng,
                    "destinationLat": destLat,
                    "destinationLng": destLng,
                    "destination_lat": destLat,
                    "destination_lng": destLng,
                    "pickup_position": { x: pickupLat, y: pickupLng, lat: pickupLat, lng: pickupLng },
                    "destination_position": { x: destLat, y: destLng, lat: destLat, lng: destLng }
                };
                console.log(`📍 Solicitud viaje #${idRequest} emitida por cliente #${idClient}`);
                if (!isNaN(pickupLat) && !isNaN(pickupLng) && pickupLat !== 0.0 && pickupLng !== 0.0) {
                    let notifiedCount = 0;
                    for (const [socketId, driverId] of socketToDriverMap.entries()) {
                        const driverPos = activeDriversMap.get(driverId);
                        if (driverPos && (Date.now() - driverPos.updatedAt < 15 * 60 * 1000)) {
                            const distanceKm = getDistanceInKm(pickupLat, pickupLng, driverPos.lat, driverPos.lng);
                            if (distanceKm <= 7.0) {
                                io.to(socketId).emit("created_client_request", clientRequest);
                                notifiedCount++;
                            }
                        }
                    }
                    console.log(`📡 'created_client_request' emitida a ${notifiedCount} conductores.`);
                } else {
                    io.emit("created_client_request", clientRequest);
                }
            } catch (error) {
                console.error("🚨 Error grave al procesar 'new_client_request':", error);
                io.emit("created_client_request", {
                    "id_socket": socket.id,
                    "id_client_request": data?.id_client_request || data?.id,
                    ...data
                });
            }
        });
        socket.on("resend_client_request", async (data: any) => {
            try {
                const idClientRequest = Number(data?.id_client_request || data?.idClientRequest || data?.id);
                if (!idClientRequest) return;
            
                const requestDb = await prisma.clientRequests.findUnique({
                    where: { id: idClientRequest }
                });

                if (requestDb) {
                    const reqAny = requestDb as any;
                    const idClient = reqAny?.id_client || reqAny?.idClient;
                    let clientData: any = null;
                    if (idClient) {
                        try {
                            clientData = await prisma.user.findUnique({
                                where: { id: Number(idClient) },
                                select: { id: true, fullname: true, email: true, phone: true, image: true }
                            });
                        } catch (uErr) {
                            console.warn("⚠️ Error al buscar usuario:", uErr);
                        }
                    }
                    const finalImageUrl = formatImageUrl(clientData?.image);
                    const pickupLat = Number(reqAny?.pickup_lat ?? reqAny?.pickupLat ?? 0.0);
                    const pickupLng = Number(reqAny?.pickup_lng ?? reqAny?.pickupLng ?? 0.0);
                    const payload = {
                        ...requestDb,
                        id: requestDb.id,
                        id_client_request: requestDb.id,
                        id_socket: socket.id,
                        client: clientData ? { ...clientData, image: finalImageUrl } : {},
                        client_image: finalImageUrl || "",
                        pickupLat: pickupLat,
                        pickupLng: pickupLng,
                        pickup_lat: pickupLat,
                        pickup_lng: pickupLng,
                    };
                    io.emit("created_client_request", payload);
                }
            } catch (error) {
                console.error("🚨 Error al procesar 'resend_client_request':", error);
            }
        });
        socket.on("cancel_client_request", async (data: any) => {
            try {
                const idClientRequest = Number(data?.id_client_request || data?.idClientRequest || data?.id);
                const cancelledBy: "CLIENT" | "DRIVER" = data?.cancelled_by || data?.cancelledBy || "CLIENT";
                const cancellationReason = data?.cancellation_reason || data?.cancellationReason || "Cancelado desde la app";
                if (!idClientRequest) return;

                const cancelPayload = {
                    id_client_request: idClientRequest,
                    id: idClientRequest,
                    status: "CANCELLED",
                    cancelled_by: cancelledBy,
                    cancellation_reason: cancellationReason
                };
                io.emit("client_request_cancelled", cancelPayload);
                io.emit(`new_status_trip/${idClientRequest}`, cancelPayload);
            } catch (error) {
                console.error("🚨 Error al procesar 'cancel_client_request':", error);
            }
        });
        socket.on("new_driver_offer", async (data: any) => {
            try {
                const rawIdReq = data?.id_client_request ?? data?.idClientRequest;
                if (!rawIdReq) {
                    console.log("⚠️ Evento 'new_driver_offer' recibido sin 'id_client_request'");
                    return;
                }
                const idClientRequest = Number(rawIdReq);
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
                            driverObj = { ...driverObj, ...driverDb };
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
                    "id_client_request": idClientRequest,
                    "idClientRequest": idClientRequest,
                    "driver": updatedDriver,
                    "driver_image": finalDriverImageUrl || ""
                };
                const targetChannel = `created_driver_offer/${idClientRequest}`;
                console.log(`📡 [SOCKET] Retransmitiendo oferta limpia a '${targetChannel}'`);
                io.emit(targetChannel, offerPayload);
                io.emit("created_driver_offer", offerPayload);
            } catch (error) {
                console.error("🚨 Error grave al procesar 'new_driver_offer':", error);
                const idClientRequest = Number(data?.id_client_request || data?.idClientRequest);
                if (idClientRequest) {
                    io.emit(`created_driver_offer/${idClientRequest}`, {
                        "id_socket": socket.id,
                        "id_client_request": idClientRequest,
                        ...data
                    });
                }
            }
        });
        socket.on("new_driver_assigned", (data: any) => {
            const idDriver = data?.id_driver;
            const idClientRequest = data?.id_client_request;
            const clientRequest = {
                "id_socket": socket.id,
                "id_client_request": idClientRequest,
                "id_driver": idDriver,
                "payment_method": data?.payment_method || "CASH",
                "payment_status": data?.payment_status || "PENDING",
                "payment_id": data?.payment_id || null
            };
            io.emit(`driver_assigned/${idDriver}`, clientRequest);
            if (idClientRequest) {
                io.emit('trip_assigned_to_other', {
                    id_client_request: Number(idClientRequest),
                    id_driver_assigned: Number(idDriver)
                });
            }
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
        socket.on("update_status_trip", async (data: any) => {
            try {
                const idClientRequest = Number(data?.id_client_request || data?.idClientRequest);
                const status = data?.status;
                const idDriver = Number(data?.id_driver || data?.idDriver);

                if (idClientRequest && status) {
                    await prisma.clientRequests.update({
                        where: { id: idClientRequest },
                        data: {
                            status: status,
                            ...(data?.payment_status ? { payment_status: data.payment_status } : {})
                        }
                    });
                }
                if ((status === "FINISHED" || status === "COMPLETED") && idDriver) {
                    const trip = await prisma.clientRequests.findUnique({ where: { id: idClientRequest } });
                    if (trip) {
                        const totalFare = Number(trip.fare_assigned ?? trip.fare_offered);
                        const paymentResult = await DriverWalletService.processTripPayment({
                            id_client_request: trip.id,
                            id_driver: idDriver,
                            total_fare: totalFare,
                            payment_method: trip.payment_method
                        });
                        const currentWalletBalance = paymentResult.wallet?.balance ?? 0;
                        io.emit(`wallet_updated/${idDriver}`, {
                            id_driver: idDriver,
                            new_balance: Number(currentWalletBalance)
                        });
                    }
                }

                const clientRequest = {
                    "id_socket": socket.id,
                    "id_client_request": idClientRequest,
                    "status": status,
                    "payment_method": data?.payment_method,
                    "payment_status": data?.payment_status,
                    "payment_id": data?.payment_id || null
                };
                io.emit(`new_status_trip/${idClientRequest}`, clientRequest);
            } catch (error) {
                console.error("🚨 Error grave al actualizar status de viaje:", error);
            }
        });
        socket.on("disconnect_driver", (data: any) => {
            const driverId = Number(data?.id || data?.id_driver);
            if (driverId) {
                activeDriversMap.delete(driverId);
                io.emit("driver_disconnected", {
                    id: driverId,
                    id_driver: driverId,
                    id_socket: socket.id
                });
            }
        });
        socket.on("disconnect", () => {
            console.log("🔴 Cliente/Conductor desconectado:", socket.id);
            const driverId = socketToDriverMap.get(socket.id);
            if (driverId) {
                activeDriversMap.delete(driverId);
                socketToDriverMap.delete(socket.id);
                io.emit("driver_disconnected", {
                    id: driverId,
                    id_driver: driverId,
                    id_socket: socket.id,
                });
            } else {
                io.emit("driver_disconnected", {
                    id_socket: socket.id,
                });
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