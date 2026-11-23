import { Router } from "express";
import {
    getRestaurantTags,
    addRestaurantTags,
    deleteRestaurantTag,
} from "../controllers/restaurantMoreInfo.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import { validateAddRestaurantTags } from "../middlewares/validateBody.ts";

const restaurantMoreInfoRouter = Router({ mergeParams: true });

restaurantMoreInfoRouter.get("/", getRestaurantTags);
restaurantMoreInfoRouter.post("/", authentication, validateAddRestaurantTags, addRestaurantTags);
restaurantMoreInfoRouter.delete("/:tag", authentication, deleteRestaurantTag);

export default restaurantMoreInfoRouter;
