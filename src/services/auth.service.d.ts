import type { LoginInput } from "../validators/auth.validator.js";
import type { CreateUserInput } from "../validators/user.validator.js";
export declare const register: (data: CreateUserInput & {
    role?: string;
}) => Promise<{
    token: string;
    user: {
        id: number;
        fullname: string;
        email: string;
        phone: string;
        image: string | null;
        notification_token: string | null;
        role: string;
        driverCarInfo: null;
        roles: {
            id: string;
            fullname: string;
            route: string;
            image: string;
        }[];
    };
}>;
export declare const loginUser: (data: LoginInput) => Promise<{
    token: string;
    user: {
        image: string | null;
        role: string;
        driverCarInfo: {
            id_driver: number;
            brand: string;
            color: string;
            plate: string;
            created_at: Date;
            updated_at: Date;
        } | null;
        roles: {
            id: string;
            fullname: string;
            route: string;
            image: string;
        }[];
        fullname: string;
        email: string;
        phone: string;
        id: number;
        notification_token: string | null;
        create_at: Date;
        update_at: Date;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map