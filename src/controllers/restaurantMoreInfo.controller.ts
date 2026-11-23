import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import { Request, Response } from "express";
import { User } from "../models/User.model.ts";
import { getRestaurantById, getRestaurantMoreInfo } from "../repository/Restaurant.repository.ts";
import { getParamString, verifyRestaurantOwner } from "../services/restaurantEmployee.service.ts";
import {
    addTagsToRestaurant,
    removeTagFromRestaurant,
} from "../services/restaurantMoreInfo.service.ts";
import { RequestBodyAddRestaurantTags } from "../schema/restaurantMoreInfo.schema.ts";

interface AuthenticatedRequest extends Request {
    user?: User;
}

export const getRestaurantTags = asyncHandler(async (req: Request, res: Response) => {
    const restaurantId = getParamString(req.params.restaurantId || req.params.id);
    if (!restaurantId) {
        throw new AppError("Access denied", 403);
    }

    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant) {
        throw new AppError("Access denied", 403);
    }

    const tags = await getRestaurantMoreInfo(restaurantId);

    return res.status(200).json({
        success: true,
        message: "Restaurant tags fetched successfully",
        data: tags,
    });
});

export const addRestaurantTags = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { restaurantId } = await verifyRestaurantOwner(
        req.user,
        req.params.restaurantId || req.params.id
    );

    const body: RequestBodyAddRestaurantTags = req.body;
    const tagsToAdd = body.tags;

    const addedTags = await addTagsToRestaurant(restaurantId, tagsToAdd);
    const allTags = await getRestaurantMoreInfo(restaurantId);

    return res.status(201).json({
        success: true,
        message: "Tags added successfully",
        data: {
            added: addedTags,
            tags: allTags,
        },
    });
});

export const deleteRestaurantTag = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const { restaurantId } = await verifyRestaurantOwner(
            req.user,
            req.params.restaurantId || req.params.id
        );

        const tag = getParamString(req.params.tag);
        if (!tag || tag.trim() === "") {
            throw new AppError("Tag name is required", 400);
        }

        const removed = await removeTagFromRestaurant(restaurantId, tag.trim());
        if (!removed) {
            throw new AppError("Tag not found", 404);
        }

        const allTags = await getRestaurantMoreInfo(restaurantId);

        return res.status(200).json({
            success: true,
            message: "Tag removed successfully",
            data: {
                removed: tag.trim(),
                tags: allTags,
            },
        });
    }
);
