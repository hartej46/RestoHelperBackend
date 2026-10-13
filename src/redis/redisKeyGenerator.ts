import { z } from "zod";
import crypto from "node:crypto";
import AppError from "../utils/error";

const emailSchema = z.string().email("Invalid email address").toLowerCase();

const redisKeyGenerator = (email: string): string => {
    const result = emailSchema.safeParse(email);

    if (!result.success) {
        throw new AppError(result.error.issues[0].message, 400);
    }

    return `key:${result.data}`;
};

const passwordResetKeyGenerator = (email: string): string => {
    const result = emailSchema.safeParse(email);

    if (!result.success) {
        throw new AppError(result.error.issues[0].message, 400);
    }

    return `password-reset:${result.data}`;
};

const signupRegistrationKeyGenerator = (registrationId: string): string => {
    if (!registrationId.trim()) {
        throw new AppError("Registration id is required", 400);
    }

    return `signup:${registrationId}`;
};

const generateSignupRegistrationId = (): string => crypto.randomUUID();

export {
    passwordResetKeyGenerator,
    redisKeyGenerator,
    signupRegistrationKeyGenerator,
    generateSignupRegistrationId,
};
