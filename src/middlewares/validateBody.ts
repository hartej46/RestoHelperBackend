import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import { CreateUserSchema } from "../schema/user.schema.ts";
import { CreateNewRestaurant } from "../schema/restaurant.schema.ts";

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
