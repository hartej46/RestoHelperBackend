export type RestaurantStatus = "Active" | "Inactive";

export interface Restaurant {
    id: string;
    owner_id: number;
    restaurant_name: string;
    description: string | null;
    address: string;
    phone_no: string | null;
    email_id: string;
    opening_time: string;
    closing_time: string;
    website_url: string | null;
    logo_id: string | null;
    avg_dining_price: string | null;
    more_info: string[] | null;
    status: RestaurantStatus;
    is_open: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface CreateRestaurantParams {
    owner_id: number;
    restaurant_name: string;
    description?: string | null;
    address: string;
    phone_no?: string | null;
    email_id: string;
    opening_time: string;
    closing_time: string;
    website_url?: string | null;
    logo_id?: string | null;
    avg_dining_price?: string | null;
    more_info?: string[] | null;
    status?: RestaurantStatus;
    is_open?: boolean;
}
