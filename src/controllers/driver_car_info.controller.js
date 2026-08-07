import * as driverCarInfoService from "../services/driver_car_info.service.js";
export const createDriverCarInfo = async (req, res, next) => {
    try {
        const data = req.body;
        const driverCarInfo = await driverCarInfoService.createDriverCarInfo(data);
        return res.status(201).json(driverCarInfo);
    }
    catch (error) {
        next(error);
    }
};
export const getByDriver = async (req, res, next) => {
    try {
        const id_driver = Number(req.params.id_driver);
        const driverCarInfo = await driverCarInfoService.getByDriver(id_driver);
        return res.status(200).json(driverCarInfo);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=driver_car_info.controller.js.map