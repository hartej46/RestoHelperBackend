import { createClient } from "redis";

const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});

client.on("error", (error) => {
    console.error("Redis client error:", error);
});

export const connectRedis = async () => {
    if (!client.isOpen) {
        await client.connect();
    }
};

export default client;
