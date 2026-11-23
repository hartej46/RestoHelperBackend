import { z } from "zod";

export const AddRestaurantTagsSchema = z.object({
    tags: z
        .union([
            z
                .string()
                .trim()
                .min(1, "Tag cannot be empty")
                .max(100, "Tag cannot exceed 100 characters"),
            z
                .array(
                    z
                        .string()
                        .trim()
                        .min(1, "Tag cannot be empty")
                        .max(100, "Tag cannot exceed 100 characters")
                )
                .min(1, "At least one tag is required"),
        ])
        .transform((val) => (Array.isArray(val) ? val : [val])),
});

export type RequestBodyAddRestaurantTags = z.infer<typeof AddRestaurantTagsSchema>;
