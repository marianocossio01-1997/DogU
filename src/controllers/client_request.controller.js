import * as clientRequestService from "../services/client_request.service.js";
export const createClientRequest = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await clientRequestService.createClientRequest(body);
        return res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const assignDriver = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await clientRequestService.assignDriver(body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const updateClientRequest = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await clientRequestService.updateStatus(body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const getByClientAssigned = async (req, res, next) => {
    try {
        const id_client = Number(req.params.id_client);
        const result = await clientRequestService.getByClientAssigned(id_client);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const getByDriverAssigned = async (req, res, next) => {
    try {
        const id_driver_assigned = Number(req.params.id_driver_assigned);
        const result = await clientRequestService.getByDriverAssigned(id_driver_assigned);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const updateClientRating = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await clientRequestService.updateClientRating(body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const updateDriverRating = async (req, res, next) => {
    try {
        const body = req.body;
        const result = await clientRequestService.updateDriverRating(body);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const getNearbyClientRequests = async (req, res, next) => {
    try {
        const driverLat = Number(req.params.driver_lat);
        const driverLng = Number(req.params.driver_lng);
        if (isNaN(driverLat) || isNaN(driverLng)) {
            return res.status(400).json({ message: "Las coordenadas de latitud y longitud son inválidas" });
        }
        const result = await clientRequestService.getNearbyClientRequests(driverLat, driverLng);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("💥 Error en getNearbyClientRequests Controller:", error);
        next(error);
    }
};
export const getByClientRequest = async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const result = await clientRequestService.getByClientRequest(id);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
export const getTimeAndDistance = async (req, res, next) => {
    try {
        const originLat = Number(req.params.origin_lat);
        const originLng = Number(req.params.origin_lng);
        const destinationLat = Number(req.params.destination_lat);
        const destinationLng = Number(req.params.destination_lng);
        const data = await clientRequestService.getTimeAndDistance(originLat, originLng, destinationLat, destinationLng);
        return res.status(200).json(data);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=client_request.controller.js.map