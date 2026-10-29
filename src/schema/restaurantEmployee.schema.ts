import { z } from "zod";

export const AddEmployeeSchema = z
    .object({
        email: z.string().trim().email("Invalid email address").toLowerCase().optional(),
        phone_no: z
            .string()
            .trim()
            .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
            .optional(),
        role: z
            .string()
            .trim()
            .min(1, "Role must be at least 1 character long")
            .max(30, "Role cannot exceed 30 characters")
            .optional(),
        status: z
            .string()
            .trim()
            .min(1, "Status must be at least 1 character long")
            .max(20, "Status cannot exceed 20 characters")
            .optional(),
    })
    .refine((data) => data.email || data.phone_no, {
        message: "You must provide either an email or a phone number to add an employee",
        path: ["email"],
    });

export const UpdateEmployeeRoleSchema = z.object({
    role: z.string().trim().min(1, "Role is required").max(30, "Role cannot exceed 30 characters"),
});

export const UpdateEmployeeStatusSchema = z.object({
    status: z
        .string()
        .trim()
        .min(1, "Status is required")
        .max(20, "Status cannot exceed 20 characters"),
});

export type RequestBodyAddEmployee = z.infer<typeof AddEmployeeSchema>;

export type RequestBodyUpdateEmployeeRole = z.infer<typeof UpdateEmployeeRoleSchema>;

export type RequestBodyUpdateEmployeeStatus = z.infer<typeof UpdateEmployeeStatusSchema>;
