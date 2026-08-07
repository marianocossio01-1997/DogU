import { z } from "zod";
export declare const createDriveTripOfferSchema: z.ZodObject<{
    id_driver: z.ZodCoercedNumber<unknown>;
    id_client_request: z.ZodCoercedNumber<unknown>;
    fare_offered: z.ZodCoercedNumber<unknown>;
    time: z.ZodCoercedNumber<unknown>;
    distance: z.ZodCoercedNumber<unknown>;
}, z.core.$strip>;
export type CreateDriverTripOfferInput = z.infer<typeof createDriveTripOfferSchema>;
//# sourceMappingURL=driver_trip_offer.validator.d.ts.map