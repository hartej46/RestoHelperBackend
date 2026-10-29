export type EmployeeStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export interface RestaurantEmployee {
    id: number;
    restaurant_id: string;
    user_id: number;
    role: string;
    status: EmployeeStatus | string;
    joined_at: Date;
}

export interface RestaurantEmployeeWithUser {
    id: number;
    restaurant_id: string;
    user_id: number;
    role: string;
    status: string;
    joined_at: Date;
    user_name: string;
    user_email: string;
    user_phone_no: string;
}

export interface AddEmployeeParams {
    restaurant_id: string;
    user_id: number;
    role?: string;
    status?: string;
}
