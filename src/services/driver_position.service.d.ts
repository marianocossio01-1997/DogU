import type { CreateDriverPositionInput } from '../validators/driver_position.validator.js';
export declare const createDriverPosition: (data: CreateDriverPositionInput) => Promise<{
    id_driver: number;
    lat: number;
    lng: number;
}>;
export declare const getDriverPosition: (id_driver: number) => Promise<{
    id_driver: number | undefined;
    lat: number;
    lng: number;
}>;
export declare const getNearbyDrivers: (lat: number, lng: number) => Promise<{
    id_driver: number;
    position: {
        lat: number;
        lng: number;
    };
    distance: number;
}[]>;
export declare const deleteDriverPosition: (id_driver: number) => Promise<void>;
//# sourceMappingURL=driver_position.service.d.ts.map