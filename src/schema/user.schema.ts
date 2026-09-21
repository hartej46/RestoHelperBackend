import { z } from "zod";

export const CreateUserSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    phone_no: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export type requestBodyCreateUser = z.infer<typeof CreateUserSchema>;

