import { z } from "zod";
export declare const createClientRequestSchema: z.ZodObject<{
    id_client: z.ZodCoercedNumber<unknown>;
    fare_offered: z.ZodCoercedNumber<unknown>;
    pickup_lat: z.ZodCoercedNumber<unknown>;
    pickup_lng: z.ZodCoercedNumber<unknown>;
    destination_lat: z.ZodCoercedNumber<unknown>;
    destination_lng: z.ZodCoercedNumber<unknown>;
    pickup_description: z.ZodString;
    destination_description: z.ZodString;
}, z.core.$strip>;
export declare const assingDriverSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
    fare_assigned: z.ZodCoercedNumber<unknown>;
    id_driver_assigned: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const updateClientRequestSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
    status: z.ZodString;
}, z.core.$strip>;
export declare const updateClientRatingSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
    client_rating: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export declare const updateDriverRatingSchema: z.ZodObject<{
    id: z.ZodCoercedNumber<unknown>;
    driver_rating: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type CreateClientRequestInput = z.infer<typeof createClientRequestSchema>;
export type AssignDriverInput = z.infer<typeof assingDriverSchema>;
export type UpdateClientRequestInput = z.infer<typeof updateClientRequestSchema>;
export type UpdateClientRatingInput = z.infer<typeof updateClientRatingSchema>;
export type UpdateDriverRatingInput = z.infer<typeof updateDriverRatingSchema>;
//# sourceMappingURL=client_request.validator.d.ts.map