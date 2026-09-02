import prisma from "../database/prismaClient.js";
import type { CreateDriverTripOfferInput } from "../validators/driver_trip_offer.validator.js";

const formatImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath.trim() === '' || imagePath === 'null') return null;
    const cleanPath = imagePath.trim();
    if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
        return cleanPath;
    }
    const pathWithSlash = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}${pathWithSlash}`;
    }
    const baseUrl = process.env.BASE_URL || process.env.SERVER_URL || process.env.PUBLIC_URL;
    if (baseUrl) {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBase}${pathWithSlash}`;
    }
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    return `http://${host}:${port}${pathWithSlash}`;
};
export const createDriverTripOffer = async (data: CreateDriverTripOfferInput) => {
    const driverTripOffer = await prisma.driverTripOffer.create({ 
        data: {
            id_driver: data.id_driver,
            id_client_request: data.id_client_request,
            time: data.time,
            distance: data.distance,
            fare_offered: data.fare_offered
        },
        include: {
            driver: {
                include: {
                    driverCarInfo: true
                }
            }
        }
    });
    return {
        id: driverTripOffer.id,
        id_driver: driverTripOffer.id_driver,
        id_client_request: driverTripOffer.id_client_request,
        fare_offered: driverTripOffer.fare_offered,
        time: driverTripOffer.time,
        distance: driverTripOffer.distance,
        created_at: driverTripOffer.created_at,
        updated_at: driverTripOffer.updated_at,
        driver: driverTripOffer.driver ? {
            id: driverTripOffer.driver.id,
            fullname: driverTripOffer.driver.fullname,
            phone: driverTripOffer.driver.phone,
            image: formatImageUrl(driverTripOffer.driver.image),
        } : null,
        car: driverTripOffer.driver?.driverCarInfo ? {
            brand: driverTripOffer.driver.driverCarInfo.brand,
            color: driverTripOffer.driver.driverCarInfo.color,
            plate: driverTripOffer.driver.driverCarInfo.plate
        } : null,
    };
};

export const getByClientRequest = async (idClientRequest: number) => {
    const offers = await prisma.driverTripOffer.findMany({
        where: { id_client_request: Number(idClientRequest) },
        include: {
            driver: {
                include: {
                    driverCarInfo: true
                }
            }
        }
    });
    return offers.map((offer: any) => ({
        id: offer.id,
        id_driver: offer.id_driver,
        id_client_request: offer.id_client_request,
        fare_offered: offer.fare_offered,
        time: offer.time,
        distance: offer.distance,
        created_at: offer.created_at,
        updated_at: offer.updated_at,
        driver: offer.driver ? {
            id: offer.driver.id,
            fullname: offer.driver.fullname,
            phone: offer.driver.phone,
            image: formatImageUrl(offer.driver.image),
        } : null,
        car: offer.driver?.driverCarInfo ? {
            brand: offer.driver.driverCarInfo.brand,
            color: offer.driver.driverCarInfo.color,
            plate: offer.driver.driverCarInfo.plate
        } : null,
    }));
};