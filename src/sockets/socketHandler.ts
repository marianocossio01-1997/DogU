import { Server, Socket } from "socket.io";
import { Server as Httpserver } from "http";
import { AppError } from "../utils/AppError.js";
import prisma from "../database/prismaClient.js";
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
                const rawImage = clientObj?.image || data?.client_image || data?.image || "";
                const finalImageUrl = formatImageUrl(rawImage);
                const updatedClient = {
                    ...clientObj,
                    image: finalImageUrl
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
                    "client": updatedClient,
                    "client_image": finalImageUrl || "",
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
                console.log(`📍 Coordenadas de búsqueda recibidas: Pickup (${pickupLat}, ${pickupLng})`);
                if (!isNaN(pickupLat) && !isNaN(pickupLng) && pickupLat !== 0.0 && pickupLng !== 0.0) {
                    let notifiedCount = 0;
                    for (const [socketId, driverId] of socketToDriverMap.entries()) {
                        const driverPos = activeDriversMap.get(driverId);
                        if (driverPos && (Date.now() - driverPos.updatedAt < 15 * 60 * 1000)) {
                            const distanceKm = getDistanceInKm(pickupLat, pickupLng, driverPos.lat, driverPos.lng);
                            console.log(`📏 Distancia al conductor #${driverId}: ${distanceKm.toFixed(2)} km`);
                            if (distanceKm <= 5.0) {
                                io.to(socketId).emit("created_client_request", clientRequest);
                                notifiedCount++;
                            }
                        }
                    }
                    console.log(`📡 'created_client_request' emitida a ${notifiedCount} conductores dentro del rango de 5 KM.`);
                } else {
                    console.warn("⚠️ Coordenadas no válidas (0.0). Realizando emisión global.");
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
                if (!idClientRequest) {
                    console.warn("⚠️ 'resend_client_request' recibido sin id_client_request válido:", data);
                    return;
                }
                console.log(`🔄 Reenviando solicitud de viaje #${idClientRequest} a los conductores...`);
                
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
                                select: {
                                    id: true,
                                    fullname: true,
                                    email: true,
                                    phone: true,
                                    image: true
                                }
                            });
                        } catch (uErr) {
                            console.warn("⚠️ Error al buscar usuario del viaje:", uErr);
                        }
                    }

                    const finalImageUrl = formatImageUrl(clientData?.image);
                    const pickupLat = Number(
                        reqAny?.pickup_lat ??
                        reqAny?.pickupLat ??
                        reqAny?.pickup_position?.x ??
                        reqAny?.pickup_position?.lat ??
                        data?.pickup_lat ??
                        data?.pickupLat ?? 0.0
                    );
                    const pickupLng = Number(
                        reqAny?.pickup_lng ??
                        reqAny?.pickupLng ??
                        reqAny?.pickup_position?.y ??
                        reqAny?.pickup_position?.lng ??
                        data?.pickup_lng ??
                        data?.pickupLng ?? 0.0
                    );
                    const payload = {
                        ...requestDb,
                        id: requestDb.id,
                        id_client_request: requestDb.id,
                        id_socket: socket.id,
                        client: clientData ? {
                            ...clientData,
                            image: finalImageUrl
                        } : {},
                        client_image: finalImageUrl || "",
                        payment_method: reqAny?.payment_method || "CASH",
                        payment_status: reqAny?.payment_status || "PENDING",
                        payment_id: reqAny?.payment_id || null,
                        pickupLat: pickupLat,
                        pickupLng: pickupLng,
                        pickup_lat: pickupLat,
                        pickup_lng: pickupLng,
                        pickup_position: reqAny?.pickup_position || { x: pickupLat, y: pickupLng, lat: pickupLat, lng: pickupLng }
                    };
                    if (!isNaN(pickupLat) && !isNaN(pickupLng) && pickupLat !== 0.0 && pickupLng !== 0.0) {
                        let notifiedCount = 0;
                        for (const [socketId, driverId] of socketToDriverMap.entries()) {
                            const driverPos = activeDriversMap.get(driverId);
                            if (driverPos && (Date.now() - driverPos.updatedAt < 15 * 60 * 1000)) {
                                const distanceKm = getDistanceInKm(pickupLat, pickupLng, driverPos.lat, driverPos.lng);
                                if (distanceKm <= 5.0) {
                                    io.to(socketId).emit("created_client_request", payload);
                                    notifiedCount++;
                                }
                            }
                        }
                        console.log(`📡 'resend_client_request' emitida a ${notifiedCount} conductores dentro de los 5 KM.`);
                    } else {
                        io.emit("created_client_request", payload);
                    }
                } else {
                    io.emit("created_client_request", {
                        id_socket: socket.id,
                        id_client_request: idClientRequest,
                        id: idClientRequest,
                        ...data
                    });
                }
            } catch (error) {
                console.error("🚨 Error al procesar 'resend_client_request':", error);
            }
        });

        socket.on("cancel_client_request", async (data: any) => {
            try {
                const idClientRequest = Number(data?.id_client_request || data?.idClientRequest || data?.id);
                if (!idClientRequest) return;
                console.log(`❌ Cancelando solicitud de viaje #${idClientRequest}...`);

                try {
                    await prisma.clientRequests.update({
                        where: { id: idClientRequest },
                        data: { status: "CANCELLED" }
                    });
                } catch (dbError) {
                    console.warn("⚠️ No se pudo actualizar el status a CANCELLED en BD:", dbError);
                }

                io.emit("client_request_cancelled", {
                    id_client_request: idClientRequest,
                    id: idClientRequest
                });
            } catch (error) {
                console.error("🚨 Error al procesar 'cancel_client_request':", error);
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
                        console.warn("⚠ No se pudo consultar prisma.user para el conductor:", dbError);
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
                console.log(`📡 [SOCKET] Retransmitiendo oferta a '${targetChannel}'`);
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
            const idClientRequest = data?.id_client_request;
            const clientRequest = {
                "id_socket": socket.id,
                "id_client_request": idClientRequest,
                "id_driver": idDriver,
                "payment_method": data?.payment_method || "CASH",
                "payment_status": data?.payment_status || "PENDING",
                "payment_id": data?.payment_id || null
            };
            console.log(`🚕 Nuevo conductor asignado (${idDriver}) para viaje:`, clientRequest);
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
                console.log(`📌 Cambiando estado de viaje #${idClientRequest} a '${status}' para conductor #${idDriver}`);
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
                    const existingTx = await prisma.walletTransaction.findFirst({
                        where: { id_client_request: idClientRequest }
                    });
                    let currentWalletBalance: number | null = null;

                    if (!existingTx) {
                        const trip = await prisma.clientRequests.findUnique({
                            where: { id: idClientRequest }
                        });
                        const tripAny = trip as any;
                        const totalFare = Number(
                            tripAny?.fare ||
                            tripAny?.fare_offered ||
                            tripAny?.price ||
                            data?.fare ||
                            data?.total_fare ||
                            0
                        );
                        const commissionRate = 0.20; 
                        const commissionAmount = totalFare * commissionRate;

                        if (commissionAmount > 0) {
                            const walletRaw = await prisma.driverWallet.upsert({
                                where: { id_driver: idDriver },
                                update: {
                                    balance: {
                                        decrement: commissionAmount
                                    }
                                },
                                create: {
                                    id_driver: idDriver,
                                    balance: -commissionAmount
                                }
                            });
                            
                            const walletAny = walletRaw as any;
                            const walletId = walletAny?.id || walletAny?.id_wallet || walletAny?.id_driver_wallet || idDriver;
                            currentWalletBalance = Number(walletAny.balance);

                            await prisma.walletTransaction.create({
                                data: {
                                    id_driver_wallet: walletId,
                                    id_client_request: idClientRequest,
                                    amount: -commissionAmount,
                                    type: TransactionType.TRIP_COMMISSION_DEBIT,
                                    description: `Comisión (20%) por viaje #${idClientRequest}`
                                }
                            });

                            console.log(`💰 [BD ACTUALIZADA] Conductor #${idDriver} - Comisión descontada: -$${commissionAmount}. Saldo actual: $${currentWalletBalance}`);
                        }
                    } else {
                        const wallet = await prisma.driverWallet.findUnique({
                            where: { id_driver: idDriver }
                        });
                        currentWalletBalance = wallet ? Number(wallet.balance) : null;
                    }

                    if (currentWalletBalance !== null) {
                        io.emit(`wallet_updated/${idDriver}`, {
                            id_driver: idDriver,
                            new_balance: currentWalletBalance
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
                console.error("🚨 Error grave al actualizar status de viaje o comisión en BD:", error);
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