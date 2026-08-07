import { z } from "zod";
export declare const createDriverCarInfoSchema: z.ZodObject<{
    id_driver: z.ZodCoercedNumber<unknown>;
    brand: z.ZodCoercedString<unknown>;
    color: z.ZodCoercedString<unknown>;
    plate: z.ZodCoercedString<unknown>;
}, z.core.$strip>;
export type CreateDriverCarInfoInput = z.infer<typeof createDriverCarInfoSchema>;
//# sourceMappingURL=driver_car_info.validatot.d.ts.map