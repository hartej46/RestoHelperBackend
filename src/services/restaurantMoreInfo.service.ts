import {
    addRestaurantMoreInfo,
    removeRestaurantMoreInfo,
} from "../repository/Restaurant.repository.ts";

export const addTagsToRestaurant = async (
    restaurantId: string,
    tags: string[]
): Promise<string[]> => {
    const uniqueTags = [...new Set(tags.map((t) => t.trim()).filter(Boolean))];
    const addedTags: string[] = [];

    for (const tag of uniqueTags) {
        await addRestaurantMoreInfo(restaurantId, tag);
        addedTags.push(tag);
    }

    return addedTags;
};

export const removeTagFromRestaurant = async (
    restaurantId: string,
    tag: string
): Promise<boolean> => {
    const result = await removeRestaurantMoreInfo(restaurantId, tag);
    return result !== null;
};
