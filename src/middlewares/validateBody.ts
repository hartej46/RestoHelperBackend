import asyncHandler from "../utils/asyncHandler";
import AppError from "../utils/error";
import { CreateUserSchema } from "../schema/user.schema";

export const validateNewUser = asyncHandler(async (req, res, next) => {
    const result = CreateUserSchema.safeParse(req.body);

    if (!result.success) throw new AppError(result.error.issues[0].message, 400);

    return next();
});
