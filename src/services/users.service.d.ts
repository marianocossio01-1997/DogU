import type { UpdateUserInput } from "../validators/user.validator.js";
export declare const update: (id: number, data: UpdateUserInput, file?: Express.Multer.File) => Promise<{
    image: string | null;
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
}>;
export declare const findByEmail: (email: string) => Promise<{
    fullname: string;
    email: string;
    phone: string;
    password: string;
    id: number;
    image: string | null;
    notification_token: string | null;
    create_at: Date;
    update_at: Date;
} | null>;
export declare const findById: (id: number) => Promise<{
    image: string | null;
    fullname: string;
    email: string;
    phone: string;
    id: number;
    notification_token: string | null;
    create_at: Date;
    update_at: Date;
}>;
//# sourceMappingURL=users.service.d.ts.map