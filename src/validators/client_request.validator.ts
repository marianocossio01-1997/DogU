import { z } from "zod";

export const createClientRequestSchema = z.object ({
    id_client: z.coerce.number().refine((val) => val > 0, {message: "El id del cliente es obligatorio"}),
    fare_offered: z.coerce.number().refine((val) => val > 0, {message: "La oferta de tarifa es obligatorio"}),
    pickup_lat: z.coerce.number().refine((val) => val > 0, {message: "La latitud de recogida es obligatorio"}),
    pickup_lng: z.coerce.number().refine((val) => val > 0, {message: "La longitud de recogidaes obligatorio"}),
    destination_lat: z.coerce.number().refine((val) => val > 0, {message: "La latitud de destino es obligatorio"}),
    destination_lng: z.coerce.number().refine((val) => val > 0, {message: "La longitud de destino es obligatorio"}),
    pickup_description: z.string().min(2, {message: "La descripcion de recogida es obligatorio"}),
    destination_description: z.string().min(2, {message: "La descripcion de destino es obligatorio"}),
});
export const assingDriverSchema = z.object ({
    id: z.coerce.number().refine((val) => val > 0, {message: "El id de la solicitud es obligatorio"}),
    fare_assigned: z.coerce.number().refine((val) => val > 0, {message: "La oferta de tarifa es obligatorio"}),
    id_driver_assigned: z.coerce.number().refine((val) => val > 0, {message: "El estado del viaje es obligatorio"}),
});
export const updateClientRequestSchema = z.object ({
    id: z.coerce.number().refine((val) => val > 0, {message: "El id de la solicitud es obligatorio"}),
    status: z.string().min(2, {message: "La descripcion de destino es obligatorio"}),
});
export const updateClientRatingSchema = z.object ({
    id: z.coerce.number().refine((val) => val > 0, {message: "El id de la solicitud es obligatorio"}),
    client_rating: z.coerce.number().refine((val) => val > 0, {message: "La calificación del cliente es obligatoria"}),
});
export const updateDriverRatingSchema = z.object ({
    id: z.coerce.number().refine((val) => val > 0, {message: "El id de la solicitud es obligatorio"}),
    driver_rating: z.coerce.number().refine((val) => val > 0, {message: "La calificación del conductor es obligatoria"}),
});
export type CreateClientRequestInput = z.infer<typeof createClientRequestSchema>;
export type AssignDriverInput = z.infer<typeof assingDriverSchema>;
export type UpdateClientRequestInput = z.infer<typeof updateClientRequestSchema>;
export type UpdateClientRatingInput = z.infer<typeof updateClientRatingSchema>;
export type UpdateDriverRatingInput = z.infer<typeof updateDriverRatingSchema>;