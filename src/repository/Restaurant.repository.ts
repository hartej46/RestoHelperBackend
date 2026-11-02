import Query from "../db/query.ts";
import { withTransaction } from "../db/db.ts";
import AppError from "../utils/error.ts";
import { CreateRestaurantParams, Restaurant } from "../models/Restaurant.model.ts";

export const createRestaurantTable = async () => {
    const createTypeRestaurantStatus = `
        DO $$ BEGIN
            CREATE TYPE restaurant_status as ENUM('Active', 'Inactive');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `;
    const createTableQuery = `CREATE TABLE IF NOT EXISTS restaurant (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_id INTEGER NOT NULL,

        restaurant_name VARCHAR(100) NOT NULL,
        description TEXT ,
        address TEXT NOT NULL,

        phone_no VARCHAR(15),
        email_id VARCHAR(100) NOT NULL,

        opening_time TIME NOT NULL,
        closing_time TIME NOT NULL,

        website_url VARCHAR(255),
        logo_id TEXT,
        
        avg_dining_price VARCHAR(10),

        status restaurant_status,
        is_open BOOLEAN DEFAULT false,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_owner_id
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
    )`;

    const createMoreInfoTableQuery = `CREATE TABLE IF NOT EXISTS restaurant_more_info (
        id SERIAL PRIMARY KEY,

        restaurant_id UUID NOT NULL
            REFERENCES restaurant(id) ON DELETE CASCADE,

        info VARCHAR(100) NOT NULL,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (restaurant_id, info)
    )`;

    try {
        await Query(createTypeRestaurantStatus, []);
        await Query(createTableQuery, []);
        await Query(createMoreInfoTableQuery, []);
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong in createRestaurantTable()";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantById = async (id: string): Promise<Restaurant | null> => {
    const query = `
        SELECT 
            r.*,
            COALESCE(
                ARRAY_AGG(rmi.info) FILTER (WHERE rmi.info IS NOT NULL),
                '{}'
            ) AS more_info
        FROM restaurant r
        LEFT JOIN restaurant_more_info rmi ON r.id = rmi.restaurant_id
        WHERE r.id = $1
        GROUP BY r.id;
    `;

    try {
        const res = await Query(query, [id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getRestaurantById";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantsByOwnerId = async (ownerId: string): Promise<Restaurant[]> => {
    const query = `
        SELECT 
            r.*,
            COALESCE(
                ARRAY_AGG(rmi.info) FILTER (WHERE rmi.info IS NOT NULL),
                '{}'
            ) AS more_info
        FROM restaurant r
        LEFT JOIN restaurant_more_info rmi ON r.id = rmi.restaurant_id
        WHERE r.owner_id = $1
        GROUP BY r.id
        ORDER BY r.created_at DESC;
    `;

    try {
        const res = await Query(query, [ownerId]);
        return res.rows;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getRestaurantsByOwnerId";
        throw new AppError(errorMessage, 500);
    }
};

export const updateRestaurantStatus = async (id: string, isOpen: boolean) => {
    const query = `
        UPDATE restaurant 
        SET is_open = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, restaurant_name, is_open;
    `;

    try {
        const res = await Query(query, [isOpen, id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in updateRestaurantStatus";
        throw new AppError(errorMessage, 500);
    }
};

export const updateRestaurantContactDetails = async (
    id: string,
    emailId: string,
    phoneNo: string,
    status: "Active" | "Inactive",
    opening_time: string,
    closing_time: string
) => {
    const query = `
        UPDATE restaurant 
        SET email_id = $1,
        phone_no = $2,
        status = $3,
        opening_time = $4,
        closing_time = $5,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
        RETURNING id, restaurant_name, email_id, phone_no;
    `;
    try {
        const res = await Query(query, [emailId, phoneNo, status, opening_time, closing_time, id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Database error in updateRestaurantContactDetails";
        throw new AppError(errorMessage, 500);
    }
};

export const createRestaurant = async (data: CreateRestaurantParams): Promise<Restaurant> => {
    try {
        return await withTransaction(async (client) => {
            const query = `
                INSERT INTO restaurant (
                    owner_id,
                    restaurant_name,
                    description,
                    address,
                    phone_no,
                    email_id,
                    opening_time,
                    closing_time,
                    website_url,
                    logo_id,
                    avg_dining_price,
                    status,
                    is_open
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
                )
                RETURNING *;
            `;

            const values = [
                data.owner_id,
                data.restaurant_name,
                data.description || null,
                data.address,
                data.phone_no || null,
                data.email_id,
                data.opening_time,
                data.closing_time,
                data.website_url || null,
                data.logo_id || null,
                data.avg_dining_price || null,
                data.status || "Active",
                data.is_open ?? false,
            ];

            const res = await client.query(query, values);
            const restaurant = res.rows[0];

            const moreInfoList: string[] = [];
            if (data.more_info && data.more_info.length > 0) {
                const uniqueInfo = [
                    ...new Set(data.more_info.map((i) => i.trim()).filter(Boolean)),
                ];
                for (const info of uniqueInfo) {
                    await client.query(
                        `INSERT INTO restaurant_more_info (restaurant_id, info)
                         VALUES ($1, $2)
                         ON CONFLICT (restaurant_id, info) DO NOTHING;`,
                        [restaurant.id, info]
                    );
                    moreInfoList.push(info);
                }
            }

            restaurant.more_info = moreInfoList;
            return restaurant;
        });
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in createRestaurant";
        throw new AppError(errorMessage, 500);
    }
};

export const addRestaurantMoreInfo = async (restaurantId: string, info: string) => {
    const query = `
        INSERT INTO restaurant_more_info (restaurant_id, info)
        VALUES ($1, $2)
        ON CONFLICT (restaurant_id, info) DO NOTHING
        RETURNING id, restaurant_id, info, created_at;
    `;
    try {
        const res = await Query(query, [restaurantId, info.trim()]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in addRestaurantMoreInfo";
        throw new AppError(errorMessage, 500);
    }
};

export const removeRestaurantMoreInfo = async (restaurantId: string, info: string) => {
    const query = `
        DELETE FROM restaurant_more_info
        WHERE restaurant_id = $1 AND info = $2
        RETURNING id, restaurant_id, info;
    `;
    try {
        const res = await Query(query, [restaurantId, info.trim()]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in removeRestaurantMoreInfo";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantMoreInfo = async (restaurantId: string): Promise<string[]> => {
    const query = `
        SELECT info FROM restaurant_more_info
        WHERE restaurant_id = $1
        ORDER BY created_at ASC;
    `;
    try {
        const res = await Query(query, [restaurantId]);
        return res.rows.map((row) => row.info);
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getRestaurantMoreInfo";
        throw new AppError(errorMessage, 500);
    }
};
