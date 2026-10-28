import { Router } from "express";
import {
    createNewRestaurant,
    getMyRestaurants,
    getRestaurant,
    toggleRestaurantStatus,
} from "../controllers/restaurant.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import { validateNewRestaurant } from "../middlewares/validateBody.ts";

const restaurantRouter = Router();

restaurantRouter.post("/", authentication, validateNewRestaurant, createNewRestaurant);
restaurantRouter.get("/my", authentication, getMyRestaurants);
restaurantRouter.get("/:id", getRestaurant);
restaurantRouter.patch("/:id/status", authentication, toggleRestaurantStatus);

export default restaurantRouter;
