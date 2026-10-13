import client from "../db/redis";
import redisClient from "../db/redis";
import AppError from "../utils/error";
import { CreateUser as newUserModel } from "../models/User.model";

interface newUserModelWithOTP extends newUserModel {
    name: string;
    email: string;
    password: string;
    phone_no: string;
    emailOtp: string;
    emailVerified: boolean;
}

export const setRedis = async (
    key: string,
    data: string,
    expiresInSeconds: number
): Promise<void> => {
    if (!key.trim()) throw new Error("Redis key is required");

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
        throw new Error("Redis expiry must be a positive integer in seconds");
    }

    try {
        await redisClient.set(key, data, {
                EX: expiresInSeconds,
            });
    }
    catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while storing data in Redis";
        throw new AppError(errorMessage, 500);
    }
}

export const getRedis = async  <T = newUserModelWithOTP>(key: string): Promise<T> => {
    const data = await redisClient.get(key);
    if (!data || typeof data != "string" || data.trim() == ""){
        throw new AppError("No such user found please try again later", 404);
    }

    try {
        const parsed = JSON.parse(data) as T;
        return parsed;
    } catch (parseError ) {
        console.error(`Malformed JSON payload in Redis key "${key}":`, parseError);
        throw new AppError("Corrupted data encountered in cache", 500);
    }
}


export const deleteRedis = async (key: string): Promise<void> => {
    try {
        await redisClient.del(key);
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while deleting data from Redis";
        throw new AppError(errorMessage, 500);
    }
};
