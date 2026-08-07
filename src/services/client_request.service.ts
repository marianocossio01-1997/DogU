import prisma from '../database/prismaClient.js';
import { AppError } from '../utils/AppError.js';
import axios from 'axios';
import type { AssignDriverInput, CreateClientRequestInput, UpdateClientRatingInput, UpdateClientRequestInput, UpdateDriverRatingInput } from '../validators/client_request.validator.js';
import type { ClientRequestStatus } from '../generated/prisma/enums.js';

const normalizeBigInt = (obj: any) => JSON.parse(
    JSON.stringify(obj, (_, value) => typeof value === 'bigint' ? Number(value) : value)
);
const parseJsonIfNeeded = (val: any) => {
    if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
    }
    return val;
};
export const createClientRequest = async (data: CreateClientRequestInput) => {
    try {
        const result = await prisma.$transaction(async (tx) => {
            await tx.$executeRaw`
                INSERT INTO client_requests(
                    id_client,
                    fare_offered,
                    pickup_position,
                    destination_position,
                    pickup_description,
                    destination_description,
                    status,
                    created_at,
                    updated_at
                )
                VALUES (
                    ${data.id_client},
                    ${data.fare_offered},
                    ST_GeomFromText(CONCAT('POINT(', ${data.pickup_lng}, ' ', ${data.pickup_lat}, ')'), 4326),
                    ST_GeomFromText(CONCAT('POINT(', ${data.destination_lng}, ' ', ${data.destination_lat}, ')'), 4326),
                    ${data.pickup_description},
                    ${data.destination_description},
                    'CREATED',
                    NOW(),
                    NOW()
                )
            `;
            const [row] = await tx.$queryRaw<{ id: bigint }[]>`
                SELECT LAST_INSERT_ID() AS id
            `;
            return row?.id ? Number(row?.id) : null;
        });
        return result;
    } catch (e) {
        throw new AppError(`Error al crear la solicitud de viaje: ${e}`, 500);
    }
};
export const assignDriver = async (data: AssignDriverInput) => {
    const clientRequest = await prisma.clientRequests.findUnique({
        where: { id: data.id }
    });
    if (!clientRequest) {
        throw new AppError(`La solicitud de viaje no existe`, 404);
    }
    const updatedDriverAssigned = await prisma.clientRequests.update({
        where: { id: data.id },
        data: {
            id_driver_assigned: data.id_driver_assigned,
            status: 'ACCEPTED',
            fare_assigned: data.fare_assigned
        }
    });
    return updatedDriverAssigned;
};
export const updateStatus = async (data: UpdateClientRequestInput) => {
    const clientRequest = await prisma.clientRequests.findUnique({
        where: { id: data.id }
    });
    if (!clientRequest) {
        throw new AppError(`La solicitud de viaje no existe`, 404);
    }
    const updatedClientRequest = await prisma.clientRequests.update({
        where: { id: data.id },
        data: {
            status: data.status as ClientRequestStatus,
        }
    });
    return updatedClientRequest;
};
export const updateClientRating = async (data: UpdateClientRatingInput) => {
    const clientRequest = await prisma.clientRequests.findUnique({
        where: { id: data.id }
    });
    if (!clientRequest) {
        throw new AppError(`La solicitud de viaje no existe`, 404);
    }
    const updatedClientRequest = await prisma.clientRequests.update({
        where: { id: data.id },
        data: {
            client_rating: data.client_rating
        }
    });
    return updatedClientRequest;
};
export const updateDriverRating = async (data: UpdateDriverRatingInput) => {
    const clientRequest = await prisma.clientRequests.findUnique({
        where: { id: data.id }
    });
    if (!clientRequest) {
        throw new AppError(`La solicitud de viaje no existe`, 404);
    }
    const updatedClientRequest = await prisma.clientRequests.update({
        where: { id: data.id },
        data: {
            driver_rating: data.driver_rating
        }
    });
    return updatedClientRequest;
};
export const getTimeAndDistance = async (
    originLat: number,
    originLng: number,
    destinationLat: number,
    destinationLng: number
) => {
    const apikey = process.env.GOOGLE_MAPS_API_KEY;
    const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
    let response;
    try {
        response = await axios.get(url, {
            params: {
                origins: `${originLat},${originLng}`,
                destinations: `${destinationLat},${destinationLng}`,
                units: "metric",
                key: apikey
            }
        });
    } catch (error: any) {
        throw new AppError("Error al conectarse al API de Google Distance", 500);
    } 
    const body = response.data;
    
    if (body.status !== 'OK') {
        throw new AppError(`Respuesta no valida del API de Google: ${body.status}`, 500);
    }
    const element = body.rows?.[0]?.elements?.[0];

    if (!element || element.status !== "OK") {
        throw new AppError(`No se puede calcular la distancia y duracion`, 500);
    }
    const distanceValue = element.distance.value;
    const durationValue = element.duration.value;
    const km = distanceValue / 1000;
    const KM_PRICE_USD = 1.50; 
    const recommendedValue = Math.round(KM_PRICE_USD * km);
    return {
        distance: {
            text: element.distance.text,
            value: distanceValue
        },
        duration: {
            text: element.duration.text,
            value: durationValue
        },
        origin_addresses: body.origin_addresses[0],
        destination_addresses: body.destination_addresses[0],
        recommended_value: recommendedValue,
    };
};
export const getNearbyClientRequests = async (driverLat: number, driverLng: number) => {
    try {
        const rawData = await prisma.$queryRaw<any[]>`
            SELECT
                CR.id,
                CR.id_client, 
                CR.fare_offered,
                CR.pickup_description,
                CR.destination_description,
                CR.status,
                CR.updated_at,
                JSON_OBJECT(
                    'x', ST_X(pickup_position),
                    'y', ST_Y(pickup_position)
                ) AS pickup_position,
                JSON_OBJECT(
                    'x', ST_X(destination_position),
                    'y', ST_Y(destination_position)
                ) AS destination_position,
                ST_Distance_Sphere(pickup_position, ST_GeomFromText(CONCAT('POINT(', ${driverLng}, ' ', ${driverLat}, ')'), 4326)) AS distance,
                timestampdiff(MINUTE, CR.updated_at, NOW()) AS time_difference,
                JSON_OBJECT(
                    'fullname', U.fullname,
                    'phone', U.phone,
                    'image', U.image
                ) AS client
            FROM
                client_requests AS CR  
            INNER JOIN
                users AS U  
            ON
                U.id = CR.id_client  
            WHERE
                timestampdiff(MINUTE, CR.updated_at, NOW()) < 10000 AND status = "CREATED"  
            HAVING
                distance <= 5000000  
        `;

        if (!rawData || !rawData.length) {
            return [];
        }
        const data = rawData.map(item => ({
            ...item,
            pickup_position: parseJsonIfNeeded(item.pickup_position),
            destination_position: parseJsonIfNeeded(item.destination_position),
            client: parseJsonIfNeeded(item.client)
        }));

        const apikey = process.env.GOOGLE_MAPS_API_KEY;
        const url = "https://maps.googleapis.com/maps/api/distancematrix/json";
        let elements: any[] = [];

        try {
            const destinations = data.map(item => `${item.pickup_position.y},${item.pickup_position.x}`).join("|");
            const response = await axios.get(url, {
                params: {
                    origins: `${driverLat},${driverLng}`,
                    destinations,
                    units: "metric",
                    key: apikey
                }
            });

            if (response.data?.status === 'OK' && response.data?.rows?.[0]?.elements) {
                elements = response.data.rows[0].elements;
            }
        } catch (error) {
            console.warn("⚠️ Google Distance Matrix falló o devolvió error, omitiendo distancia exacta:", error);
        }
        const formatted = data.map((item, index) => {
            const clientObj = item.client || {};
            const clientImage = clientObj.image 
                ? (clientObj.image.startsWith('http') 
                    ? clientObj.image 
                    : `http://${process.env.HOST}:${process.env.PORT}${clientObj.image}`) 
                : null;

            return {
                ...item,
                client: {
                    ...clientObj,
                    image: clientImage
                },
                google_distance_metrix: {
                    status: elements[index]?.status ?? "OK",
                    distance: elements[index]?.distance ?? { text: `${Math.round(item.distance / 1000)} km`, value: item.distance },
                    duration: elements[index]?.duration ?? { text: "N/A", value: 0 }
                }
            };
        });
        return normalizeBigInt(formatted);

    } catch (e: any) {
        console.error("💥 Error detallado en getNearbyClientRequests Service:", e);
        throw new AppError(`Error interno al obtener solicitudes cercanas: ${e.message || e}`, 500);
    }
};
export const getByClientRequest = async (id: number) => {
    const rawData = await prisma.$queryRaw<any[]>`
        SELECT
            CR.id,
            CR.id_client, 
            CR.id_driver_assigned,
            CR.fare_offered,
            CR.fare_assigned,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            JSON_OBJECT(
                'x', ST_X(pickup_position),
                'y', ST_Y(pickup_position)
            ) AS pickup_position,
            JSON_OBJECT(
                'x', ST_X(destination_position),
                'y', ST_Y(destination_position)
            ) AS destination_position,
            JSON_OBJECT(
                'fullname', U.fullname,
                'phone', U.phone,
                'image', U.image
            ) AS client,
            JSON_OBJECT(
                'fullname', D.fullname,
                'phone', D.phone,
                'image', D.image
            ) AS driver,
            JSON_OBJECT(
                'brand', DCI.brand,
                'color', DCI.color,
                'plate', DCI.plate
            ) AS car
        FROM
            client_requests AS CR  
        INNER JOIN
            users AS U  
        ON
            U.id = CR.id_client  
        LEFT JOIN
            users AS D  
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            driver_car_info AS DCI
        ON
            DCI.id_driver = CR.id_driver_assigned  
        WHERE
            CR.id = ${id} AND status = 'ACCEPTED'    
    `;
    if (!rawData.length) return null;  
    const item = rawData[0];
    const clientObj = parseJsonIfNeeded(item.client) || {};
    const driverObj = parseJsonIfNeeded(item.driver) || {};
    const formatted = {
        ...item,
        pickup_position: parseJsonIfNeeded(item.pickup_position),
        destination_position: parseJsonIfNeeded(item.destination_position),
        car: parseJsonIfNeeded(item.car),
        client: {
            ...clientObj,
            image: clientObj.image ? `http://${process.env.HOST}:${process.env.PORT}${clientObj.image}` : null
        },
        driver: {
            ...driverObj,
            image: driverObj.image ? `http://${process.env.HOST}:${process.env.PORT}${driverObj.image}` : null
        },
    };
    return normalizeBigInt(formatted);
};
export const getByClientAssigned = async (id_client: number) => {
    const rawData = await prisma.$queryRaw<any[]>`
        SELECT
            CR.id,
            CR.id_client, 
            CR.id_driver_assigned,
            CR.fare_offered,
            CR.fare_assigned,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.client_rating,
            CR.driver_rating,
            JSON_OBJECT(
                'x', ST_X(pickup_position),
                'y', ST_Y(pickup_position)
            ) AS pickup_position,
            JSON_OBJECT(
                'x', ST_X(destination_position),
                'y', ST_Y(destination_position)
            ) AS destination_position,
            JSON_OBJECT(
                'fullname', U.fullname,
                'phone', U.phone,
                'image', U.image
            ) AS client,
            JSON_OBJECT(
                'fullname', D.fullname,
                'phone', D.phone,
                'image', D.image
            ) AS driver,
            JSON_OBJECT(
                'brand', DCI.brand,
                'color', DCI.color,
                'plate', DCI.plate
            ) AS car
        FROM
            client_requests AS CR  
        INNER JOIN
            users AS U  
        ON
            U.id = CR.id_client  
        LEFT JOIN
            users AS D  
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            driver_car_info AS DCI
        ON
            DCI.id_driver = CR.id_driver_assigned  
        WHERE
            CR.id_client = ${id_client} AND CR.status = 'FINISHED'    
    `;
    if (!rawData.length) return [];  
    const formatted = rawData.map(item => {
        const clientObj = parseJsonIfNeeded(item.client) || {};
        const driverObj = parseJsonIfNeeded(item.driver) || {};
        return {
            ...item,
            pickup_position: parseJsonIfNeeded(item.pickup_position),
            destination_position: parseJsonIfNeeded(item.destination_position),
            car: parseJsonIfNeeded(item.car),
            client: {
                ...clientObj,
                image: clientObj.image ? `http://${process.env.HOST}:${process.env.PORT}${clientObj.image}` : null
            },
            driver: {
                ...driverObj,
                image: driverObj.image ? `http://${process.env.HOST}:${process.env.PORT}${driverObj.image}` : null
            },
        };
    });
    return normalizeBigInt(formatted);
};
export const getByDriverAssigned = async (id_driver_assigned: number) => {
    const rawData = await prisma.$queryRaw<any[]>`
        SELECT
            CR.id,
            CR.id_client, 
            CR.id_driver_assigned,
            CR.fare_offered,
            CR.fare_assigned,
            CR.pickup_description,
            CR.destination_description,
            CR.status,
            CR.updated_at,
            CR.client_rating,
            CR.driver_rating,
            JSON_OBJECT(
                'x', ST_X(pickup_position),
                'y', ST_Y(pickup_position)
            ) AS pickup_position,
            JSON_OBJECT(
                'x', ST_X(destination_position),
                'y', ST_Y(destination_position)
            ) AS destination_position,
            JSON_OBJECT(
                'fullname', U.fullname,
                'phone', U.phone,
                'image', U.image
            ) AS client,
            JSON_OBJECT(
                'fullname', D.fullname,
                'phone', D.phone,
                'image', D.image
            ) AS driver,
            JSON_OBJECT(
                'brand', DCI.brand,
                'color', DCI.color,
                'plate', DCI.plate
            ) AS car
        FROM
            client_requests AS CR  
        INNER JOIN
            users AS U  
        ON
            U.id = CR.id_client  
        LEFT JOIN
            users AS D  
        ON
            D.id = CR.id_driver_assigned
        LEFT JOIN
            driver_car_info AS DCI
        ON
            DCI.id_driver = CR.id_driver_assigned  
        WHERE
            CR.id_driver_assigned = ${id_driver_assigned} AND CR.status = 'FINISHED'    
    `;
    if (!rawData.length) return [];  
    const formatted = rawData.map(item => {
        const clientObj = parseJsonIfNeeded(item.client) || {};
        const driverObj = parseJsonIfNeeded(item.driver) || {};
        return {
            ...item,
            pickup_position: parseJsonIfNeeded(item.pickup_position),
            destination_position: parseJsonIfNeeded(item.destination_position),
            car: parseJsonIfNeeded(item.car),
            client: {
                ...clientObj,
                image: clientObj.image ? `http://${process.env.HOST}:${process.env.PORT}${clientObj.image}` : null
            },
            driver: {
                ...driverObj,
                image: driverObj.image ? `http://${process.env.HOST}:${process.env.PORT}${driverObj.image}` : null
            },
        };
    });
    return normalizeBigInt(formatted);
};