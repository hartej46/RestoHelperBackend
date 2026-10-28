import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import { Request, Response } from "express";
import { User } from "../models/User.model.ts";
import {
    createRestaurant,
    getRestaurantById,
    getRestaurantsByOwnerId,
    updateRestaurantStatus,
    updateRestaurantContactDetails,
} from "../repository/Restaurant.repository.ts";
import { RequestBodyCreateRestaurant } from "../schema/restaurant.schema.ts";

interface AuthenticatedRequest extends Request {
    user?: User;
}

const formatTimeString = (time: string | undefined): string => {
    if (!time) return "00:00:00";
    const parts = time.split(":");
    const h = parts[0]?.padStart(2, "0") || "00";
    const m = parts[1]?.padStart(2, "0") || "00";
    const s = parts[2]?.padStart(2, "0") || "00";
    return `${h}:${m}:${s}`;
};

export const createNewRestaurant = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        if (!user) {
            throw new AppError("Authentication is required to create a restaurant", 401);
        }

        const body: RequestBodyCreateRestaurant = req.body;

        const ownerId = parseInt(user.id, 10);
        if (Number.isNaN(ownerId)) {
            throw new AppError("Invalid user ID", 400);
        }

        const restaurantName = body.restaurantName.trim();
        const address = body.address.trim();
        const description = body.description?.trim() || null;
        const phoneNo = body.phone_no?.trim() || body.restaurantPhoneNumber?.trim() || null;
        const emailId = body.email_id?.trim() || user.email;

        const rawOpeningTime = body.opening_time || body.openingTimeSchema;
        const rawClosingTime = body.closing_time || body.closingTime;

        if (!rawOpeningTime || !rawClosingTime) {
            throw new AppError("Both opening and closing times are required", 400);
        }

        const openingTime = formatTimeString(rawOpeningTime);
        const closingTime = formatTimeString(rawClosingTime);
        const websiteUrl = body.website_url?.trim() || null;
        const logoId = body.logo_id?.trim() || null;
        const avgDiningPrice = body.avg_dining_price?.trim() || null;

        let moreInfo: string[] | null = null;
        if (Array.isArray(body.more_info)) {
            moreInfo = body.more_info;
        } else if (typeof body.more_info === "string" && body.more_info.trim() !== "") {
            moreInfo = [body.more_info.trim()];
        }

        const newRestaurant = await createRestaurant({
            owner_id: ownerId,
            restaurant_name: restaurantName,
            description,
            address,
            phone_no: phoneNo,
            email_id: emailId,
            opening_time: openingTime,
            closing_time: closingTime,
            website_url: websiteUrl,
            logo_id: logoId,
            avg_dining_price: avgDiningPrice,
            more_info: moreInfo,
            status: "Active",
            is_open: false,
        });

        return res.status(201).json({
            success: true,
            message: "Restaurant created successfully",
            data: newRestaurant,
        });
    }
);

export const getMyRestaurants = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
        throw new AppError("Authentication is required", 401);
    }

    const restaurants = await getRestaurantsByOwnerId(user.id);

    return res.status(200).json({
        success: true,
        message: "Restaurants fetched successfully",
        data: restaurants,
    });
});

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
    const rawId = req.params.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
        throw new AppError("Restaurant ID is required", 400);
    }

    const restaurant = await getRestaurantById(id);
    if (!restaurant) {
        throw new AppError("Restaurant not found", 404);
    }

    return res.status(200).json({
        success: true,
        message: "Restaurant fetched successfully",
        data: restaurant,
    });
});

export const toggleRestaurantStatus = asyncHandler(
    async (req: AuthenticatedRequest, res: Response) => {
        const rawId = req.params.id;
        const id = Array.isArray(rawId) ? rawId[0] : rawId;
        const { isOpen } = req.body;

        if (!id) {
            throw new AppError("Restaurant ID is required", 400);
        }

        if (typeof isOpen !== "boolean") {
            throw new AppError("isOpen boolean field is required", 400);
        }

        const restaurant = await getRestaurantById(id);
        if (!restaurant) {
            throw new AppError("Restaurant not found", 404);
        }

        if (String(restaurant.owner_id) !== String(req.user?.id)) {
            throw new AppError("You are not authorized to update this restaurant", 403);
        }

        const updated = await updateRestaurantStatus(id, isOpen);

        return res.status(200).json({
            success: true,
            message: `Restaurant is now ${isOpen ? "open" : "closed"}`,
            data: updated,
        });
    }
);
