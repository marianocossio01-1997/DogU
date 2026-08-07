import type { CreateDriverTripOfferInput } from "../validators/driver_trip_offer.validator.js";
export declare const createDriverTripOffer: (data: CreateDriverTripOfferInput) => Promise<{
    id: number;
    id_driver: number;
    created_at: Date;
    updated_at: Date;
    fare_offered: number;
    id_client_request: number;
    time: number;
    distance: number;
}>;
export declare const getByClientRequest: (idClientRequest: number) => Promise<{
    id: number;
    id_driver: number;
    id_client_request: number;
    fare_offered: number;
    time: number;
    distance: number;
    created_at: Date;
    updated_at: Date;
    driver: {
        id: number;
        fullname: string;
        phone: string;
        image: string | null;
    } | null;
    car: {
        brand: string;
        color: string;
        plate: string;
    } | null;
}[]>;
//# sourceMappingURL=driver_trip_offer.service.d.ts.map