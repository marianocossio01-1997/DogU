import * as driverPositionService from "../services/driver_position.service.js";
import { AppError } from '../utils/AppError.js';
export const create = async (req, res, next) => {
    try {
        const data = req.body;
        const driverPosition = await driverPositionService.createDriverPosition(data);
        return res.status(201).json(driverPosition);
    }
    catch (error) {
        next(error);
    }
};
export const getDriverPosition = async (req, res, next) => {
    try {
        const id_driver = Number(req.params.id_driver);
        const driverPosition = await driverPositionService.getDriverPosition(id_driver);
        return res.status(200).json(driverPosition);
    }
    catch (error) {
        next(error);
    }
};
export const getNearbyDrivers = async (req, res, next) => {
    try {
        const lat = Number(req.params.lat);
        const lng = Number(req.params.lng);
        const driverPosition = await driverPositionService.getNearbyDrivers(lat, lng);
        return res.status(200).json(driverPosition);
    }
    catch (error) {
        next(error);
    }
};
export const deleteDriverPosition = async (req, res, next) => {
    try {
        const id_driver = Number(req.params.id_driver);
        await driverPositionService.deleteDriverPosition(id_driver);
        return res.status(200).json(true);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=driver_position.controller.js.map