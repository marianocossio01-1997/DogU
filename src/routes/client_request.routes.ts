import { Router } from 'express';
import * as clientRequestController from '../controllers/client_request.controller.js';

const router = Router();
router.get('/time-and-distance', clientRequestController.getTimeAndDistance);
router.post('/', clientRequestController.createClientRequest);
router.put('/updateDriverAssigned', clientRequestController.assignDriver);
router.put('/update_status', clientRequestController.updateClientRequest);
router.put('/update_client_rating', clientRequestController.updateClientRating);
router.put('/update_driver_rating', clientRequestController.updateDriverRating);
router.get('/client/assigned/:id_client', clientRequestController.getByClientAssigned);
router.get('/driver/assigned/:id_driver_assigned', clientRequestController.getByDriverAssigned);
router.get('/:driver_lat/:driver_lng', clientRequestController.getNearbyClientRequests);
router.get('/:id', clientRequestController.getByClientRequest);

export default router;