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


/* import express from "express";
import { getTimeAndDistance, createClientRequest, getNearbyClientRequests, assignDriver, getByClientRequest, updateClientRequest, updateDriverRating, updateClientRating, getByDriverAssigned, getByClientAssigned } from "../controllers/client_request.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/:origin_lat/:origin_lng/:destination_lat/:destination_lng", authMiddleware, getTimeAndDistance);
router.post("/", authMiddleware, createClientRequest);
router.get("/:driver_lat/:driver_lng", authMiddleware, getNearbyClientRequests);
router.get("/:id", authMiddleware, getByClientRequest);
router.put("/updateDriverAssigned", authMiddleware, assignDriver);
router.put("/update_status", authMiddleware, updateClientRequest);
router.put("/update_client_rating", authMiddleware, updateClientRating);
router.put("/update_driver_rating", authMiddleware, updateDriverRating);
router.get("/client/assigned/:id_client", authMiddleware, getByClientAssigned);
router.get("/driver/assigned/:id_driver_assigned", authMiddleware, getByDriverAssigned);

export default router; */