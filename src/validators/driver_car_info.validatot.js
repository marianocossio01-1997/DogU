import { z } from "zod";
export const createDriverCarInfoSchema = z.object({
    id_driver: z.coerce.number().refine((val) => val > 0, { message: "El id del conductor es obligatorio" }),
    brand: z.coerce.string().min(2, { message: "Minimo 2 caracteres" }),
    color: z.coerce.string().min(3, { message: "Minimo 2 caracteres" }),
    plate: z.coerce.string().min(4, { message: "Minimo 2 caracteres" }),
});
//# sourceMappingURL=driver_car_info.validatot.js.map