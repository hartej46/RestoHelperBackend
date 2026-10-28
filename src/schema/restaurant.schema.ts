import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

export const CreateNewRestaurant = z
    .object({
        restaurantName: z.string().trim().min(1, "Restaurant name is required."),
        description: z.string().trim().optional(),
        address: z.string().trim().min(5, "Address must be at least 5 characters long."),
        restaurantPhoneNumber: z
            .string()
            .trim()
            .transform((val) => (val === "" ? undefined : val))
            .pipe(
                z
                    .string()
                    .min(10, { message: "Phone number must be at least 10 characters long" })
                    .optional()
            )
            .optional(),
        phone_no: z.string().trim().optional(),
        email_id: z.string().trim().email("Invalid email address").optional(),
        openingTimeSchema: z
            .string()
            .trim()
            .regex(timeRegex, {
                message: "Invalid time format. Expected HH:MM or HH:MM:SS (24-hour format)",
            })
            .optional(),
        opening_time: z
            .string()
            .trim()
            .regex(timeRegex, {
                message: "Invalid time format. Expected HH:MM or HH:MM:SS (24-hour format)",
            })
            .optional(),
        closing_time: z
            .string()
            .trim()
            .regex(timeRegex, {
                message: "Invalid time format. Expected HH:MM or HH:MM:SS (24-hour format)",
            })
            .optional(),
        closingTime: z
            .string()
            .trim()
            .regex(timeRegex, {
                message: "Invalid time format. Expected HH:MM or HH:MM:SS (24-hour format)",
            })
            .optional(),
        website_url: z.string().trim().optional(),
        logo_id: z.string().trim().optional(),
        avg_dining_price: z.string().trim().optional(),
        more_info: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .refine((data) => data.opening_time || data.openingTimeSchema, {
        message: "Opening time is required (e.g. '09:00')",
        path: ["opening_time"],
    })
    .refine((data) => data.closing_time || data.closingTime, {
        message: "Closing time is required (e.g. '22:00')",
        path: ["closing_time"],
    });

export type RequestBodyCreateRestaurant = z.infer<typeof CreateNewRestaurant>;
