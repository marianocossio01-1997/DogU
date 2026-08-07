import prisma from "../database/prismaClient.js";
import { AppError } from "../utils/AppError.js";
export const createDriverCarInfo = async (data) => {
    const driverCarInfo = await prisma.driverCarInfo.create({
        data: {
            id_driver: data.id_driver,
            brand: data.brand,
            color: data.color,
            plate: data.plate
        }
    });
    return driverCarInfo;
};
export const getByDriver = async (idDriver) => {
    const car = await prisma.driverCarInfo.findUnique({
        where: { id_driver: idDriver }
    });
    if (!car) {
        throw new AppError("La informacion del auto no existe", 404);
    }
    return car;
};
//# sourceMappingURL=driver_car_info.service.js.map