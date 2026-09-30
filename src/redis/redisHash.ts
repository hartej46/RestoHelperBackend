import client from "../db/redis";
import redisClient from "../db/redis";
import AppError from "../utils/error";
import { CreateUser as newUserModel } from "../models/User.model";

interface newUserModelWithOTP extends newUserModel {
    otp: string;
}

type RedisHashValue = string | number | boolean;
type RedisHash = Record<string, RedisHashValue>;

export const setRedisHash = async (
    key: string,
    data: RedisHash,
    expiresInSeconds: number
): Promise<void> => {
    if (!key.trim()) throw new Error("Redis key is required");

    if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
        throw new Error("Redis expiry must be a positive integer in seconds");
    }

    const hashData = Object.fromEntries(
        Object.entries(data).map(([field, value]) => [field, String(value)])
    );

    try {
        await redisClient.hSet(key, hashData);
        await redisClient.expire(key, expiresInSeconds);
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while storing data in Redis";
        throw new AppError(errorMessage, 500);
    }
};

export const getRedisHash = async (key: string) => {
    const data = await client.hGetAll(key);
    if (!data || Object.keys(data).length == 0)
        throw new AppError("No such user found please try again later", 404);

    return data as unknown as newUserModelWithOTP;
};
