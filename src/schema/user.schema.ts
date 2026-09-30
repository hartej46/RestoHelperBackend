import { z } from "zod";

export const CreateUserSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    phone_no: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format"),
    email: z.string().email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const validateOtpSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits")
})

export const resetPasswordOtpSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
});

export const resetPasswordSchema = z.object({
    email: z.string().email("Invalid email address").toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const validateLoginSchema = z.object({
    email: z.string().trim().email("Invalid email address").toLowerCase().optional(),
    phoneNumber: z.string().trim().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),

    password: z.string().min(8, "Password must be at least 8 characters long"),
})
.refine((data) => data.email || data.phoneNumber, {
    message: "You must provide either an email or a phone number to log in",
    path: ["email"],
});

export type requestBodyCreateUser = z.infer<typeof CreateUserSchema>;

export type requestBodyLogin = z.infer<typeof validateLoginSchema>;;