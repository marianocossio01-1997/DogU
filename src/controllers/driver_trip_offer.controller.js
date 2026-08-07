import * as driverTripOfferService from "../services/driver_trip_offer.service.js";
import { AppError } from '../utils/AppError.js';
import { clearScreenDown } from 'readline';
export const createDriverTripOffer = async (req, res, next) => {
    try {
        const data = req.body;
        const driverTripOffer = await driverTripOfferService.createDriverTripOffer(data);
        return res.status(201).json(driverTripOffer);
    }
    catch (error) {
        next(error);
    }
};
export const getByClientRequest = async (req, res, next) => {
    try {
        const id_client_request = Number(req.params.id_client_request);
        const result = await driverTripOfferService.getByClientRequest(id_client_request);
        return res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=driver_trip_offer.controller.js.map