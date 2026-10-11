import type { Request, Response, NextFunction } from 'express';
import * as CancellationService from '../services/cancellation.service.js';
import { cancelTripSchema, type CancelTripInput } from '../validators/cancellation.validator.js';

export const cancelTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData: CancelTripInput = cancelTripSchema.parse(req.body);
        const result = await CancellationService.cancelTrip(validatedData);
        return res.status(200).json({
            message: 'Viaje cancelado exitosamente',
            data: result
        });
    } catch (error) {
        next(error);
    }
};