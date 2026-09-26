import { z } from "zod";
import AppError from "./error";

const emailSchema = z.string().email("Invalid email address").toLowerCase();

const redisKeyGenerator = (email: string): string => {
    const result = emailSchema.safeParse(email);

    if (!result.success) {
        throw new AppError(result.error.issues[0].message, 400);
    }

    return `key:${result.data}`;
};

export { redisKeyGenerator };
export default redisKeyGenerator;