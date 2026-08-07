import type { AssignDriverInput, CreateClientRequestInput, UpdateClientRatingInput, UpdateClientRequestInput, UpdateDriverRatingInput } from '../validators/client_request.validator.js';
import type { ClientRequestStatus } from '../generated/prisma/enums.js';
export declare const createClientRequest: (data: CreateClientRequestInput) => Promise<number | null>;
export declare const assignDriver: (data: AssignDriverInput) => Promise<{
    id: number;
    created_at: Date;
    updated_at: Date;
    id_client: number;
    fare_offered: number;
    pickup_description: string;
    destination_description: string;
    fare_assigned: number | null;
    id_driver_assigned: number | null;
    status: ClientRequestStatus;
    client_rating: number | null;
    driver_rating: number | null;
}>;
export declare const updateStatus: (data: UpdateClientRequestInput) => Promise<{
    id: number;
    created_at: Date;
    updated_at: Date;
    id_client: number;
    fare_offered: number;
    pickup_description: string;
    destination_description: string;
    fare_assigned: number | null;
    id_driver_assigned: number | null;
    status: ClientRequestStatus;
    client_rating: number | null;
    driver_rating: number | null;
}>;
export declare const updateClientRating: (data: UpdateClientRatingInput) => Promise<{
    id: number;
    created_at: Date;
    updated_at: Date;
    id_client: number;
    fare_offered: number;
    pickup_description: string;
    destination_description: string;
    fare_assigned: number | null;
    id_driver_assigned: number | null;
    status: ClientRequestStatus;
    client_rating: number | null;
    driver_rating: number | null;
}>;
export declare const updateDriverRating: (data: UpdateDriverRatingInput) => Promise<{
    id: number;
    created_at: Date;
    updated_at: Date;
    id_client: number;
    fare_offered: number;
    pickup_description: string;
    destination_description: string;
    fare_assigned: number | null;
    id_driver_assigned: number | null;
    status: ClientRequestStatus;
    client_rating: number | null;
    driver_rating: number | null;
}>;
export declare const getTimeAndDistance: (originLat: number, originLng: number, destinationLat: number, destinationLng: number) => Promise<{
    distance: {
        text: any;
        value: any;
    };
    duration: {
        text: any;
        value: any;
    };
    origin_addresses: any;
    destination_addresses: any;
    recommended_value: number;
}>;
export declare const getNearbyClientRequests: (driverLat: number, driverLng: number) => Promise<any>;
export declare const getByClientRequest: (id: number) => Promise<any>;
export declare const getByClientAssigned: (id_client: number) => Promise<any>;
export declare const getByDriverAssigned: (id_driver_assigned: number) => Promise<any>;
//# sourceMappingURL=client_request.service.d.ts.map