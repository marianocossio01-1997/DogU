import { z } from "zod";
export const createDriverPositionSchema = z.object({
    id_driver: z.coerce.number().refine((val) => val > 0, { message: "El id del conductor es obligatorio" }),
    lat: z.coerce.number().refine((val) => val > 0, { message: "La latitud es obligatorio" }),
    lng: z.coerce.number().refine((val) => val > 0, { message: "La longitud es obligatorio" }),
});
//# sourceMappingURL=driver_position.validator.js.map