import { Router } from "express";
import {
    addEmployeeToRestaurant,
    getRestaurantEmployees,
    updateRole,
    updateStatus,
    removeEmployeeFromRestaurant,
} from "../controllers/restaurantEmployee.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import {
    validateAddEmployee,
    validateUpdateEmployeeRole,
    validateUpdateEmployeeStatus,
} from "../middlewares/validateBody.ts";

const restaurantEmployeeRouter = Router({ mergeParams: true });

restaurantEmployeeRouter.post("/", authentication, validateAddEmployee, addEmployeeToRestaurant);

restaurantEmployeeRouter.get("/", authentication, getRestaurantEmployees);

restaurantEmployeeRouter.patch(
    "/:employeeId/role",
    authentication,
    validateUpdateEmployeeRole,
    updateRole
);

restaurantEmployeeRouter.patch(
    "/:employeeId/status",
    authentication,
    validateUpdateEmployeeStatus,
    updateStatus
);

restaurantEmployeeRouter.delete("/:employeeId", authentication, removeEmployeeFromRestaurant);

export default restaurantEmployeeRouter;
