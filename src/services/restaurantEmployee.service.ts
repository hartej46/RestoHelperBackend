import { User } from "../models/User.model.ts";
import { getRestaurantById } from "../repository/Restaurant.repository.ts";
import AppError from "../utils/error.ts";

export const getParamString = (param: string | string[] | undefined): string | undefined => {
    return Array.isArray(param) ? param[0] : param;
};

/**
 * Validates requester authentication, restaurant presence, and ownership.
 * Throws a single unified error to prevent information leakage to attackers.
 */
export const verifyRestaurantOwner = async (
    user: User | undefined,
    rawRestaurantId: string | string[] | undefined
) => {
    const restaurantId = getParamString(rawRestaurantId);
    if (!user || !restaurantId) {
        throw new AppError("Access denied", 403);
    }

    const restaurant = await getRestaurantById(restaurantId);
    if (!restaurant || String(restaurant.owner_id) !== String(user.id)) {
        throw new AppError("Access denied", 403);
    }

    return { restaurant, restaurantId };
};