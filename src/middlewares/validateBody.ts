import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import { CreateUserSchema } from "../schema/user.schema.ts";
import { CreateNewRestaurant } from "../schema/restaurant.schema.ts";
import {
    AddEmployeeSchema,
    UpdateEmployeeRoleSchema,
    UpdateEmployeeStatusSchema,
} from "../schema/restaurantEmployee.schema.ts";

export const validateNewUser = asyncHandler(async (req, res, next) => {
    const result = CreateUserSchema.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    return next();
});

export const validateNewRestaurant = asyncHandler(async (req, res, next) => {
    const result = CreateNewRestaurant.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    req.body = result.data;
    return next();
});

export const validateAddEmployee = asyncHandler(async (req, res, next) => {
    const result = AddEmployeeSchema.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    req.body = result.data;
    return next();
});

export const validateUpdateEmployeeRole = asyncHandler(async (req, res, next) => {
    const result = UpdateEmployeeRoleSchema.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    req.body = result.data;
    return next();
});

export const validateUpdateEmployeeStatus = asyncHandler(async (req, res, next) => {
    const result = UpdateEmployeeStatusSchema.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    req.body = result.data;
    return next();
});
