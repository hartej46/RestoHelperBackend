import WhatsAppOtpVerifier from "angelos";
import redisClient from "../db/redis.ts";

const phoneVerificationTtl = 180;

const redisStorage = {
    async get(key: string) {
        const value = await redisClient.get(key);
        return typeof value === "string" ? value : "";
    },
    async set(key: string, value: string, expiresAt: number) {
        await redisClient.set(key, value, { PXAT: expiresAt });
    },
    async delete(key: string) {
        await redisClient.del(key);
    },
};

export const whatsappOtpVerifier = new WhatsAppOtpVerifier({
    businessPhoneNumber: process.env.WHATSAPP_PHONE_NUMBER!,
    webhookVerifyToken: process.env.META_VERIFY_TOKEN!,
    appSecret: process.env.META_APP_SECRET,
    storage: redisStorage,
    defaultTtlSeconds: phoneVerificationTtl,
});

export const getPhoneVerificationKey = (sessionId: string) =>
    `wa_verify_status:${sessionId}`;

export { phoneVerificationTtl };
