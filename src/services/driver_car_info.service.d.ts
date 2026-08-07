import type { CreateDriverCarInfoInput } from "../validators/driver_car_info.validatot.js";
export declare const createDriverCarInfo: (data: CreateDriverCarInfoInput) => Promise<{
    id_driver: number;
    brand: string;
    color: string;
    plate: string;
    created_at: Date;
    updated_at: Date;
}>;
export declare const getByDriver: (idDriver: number) => Promise<{
    id_driver: number;
    brand: string;
    color: string;
    plate: string;
    created_at: Date;
    updated_at: Date;
}>;
//# sourceMappingURL=driver_car_info.service.d.ts.map