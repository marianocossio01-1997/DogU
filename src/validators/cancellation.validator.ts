import { z } from 'zod';

export const cancelTripSchema = z.object({
    id_client_request: z.number(),
    cancelled_by: z.enum(['CLIENT', 'DRIVER']),
    cancellation_reason: z.string().optional()
});

export type CancelTripInput = z.infer<typeof cancelTripSchema>;