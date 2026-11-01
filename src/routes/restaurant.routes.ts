import { Router } from "express";
import {
    createNewRestaurant,
    getMyRestaurants,
    getRestaurant,
    toggleRestaurantStatus,
} from "../controllers/restaurant.controller.ts";
import { getMyEmployedRestaurants } from "../controllers/restaurantEmployee.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import { validateNewRestaurant } from "../middlewares/validateBody.ts";
import restaurantEmployeeRouter from "./restaurantEmployee.routes.ts";

const restaurantRouter = Router();

restaurantRouter.post("/", authentication, validateNewRestaurant, createNewRestaurant);
restaurantRouter.get("/my", authentication, getMyRestaurants);
restaurantRouter.get("/employee/my", authentication, getMyEmployedRestaurants);
restaurantRouter.get("/:id", getRestaurant);
restaurantRouter.patch("/:id/status", authentication, toggleRestaurantStatus);

restaurantRouter.use("/:restaurantId/employees", restaurantEmployeeRouter);

export default restaurantRouter;
