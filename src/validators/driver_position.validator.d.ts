import { z } from "zod";
export declare const createDriverPositionSchema: z.ZodObject<{
    id_driver: z.ZodCoercedNumber<unknown>;
    lat: z.ZodCoercedNumber<unknown>;
    lng: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type CreateDriverPositionInput = z.infer<typeof createDriverPositionSchema>;
//# sourceMappingURL=driver_position.validator.d.ts.map