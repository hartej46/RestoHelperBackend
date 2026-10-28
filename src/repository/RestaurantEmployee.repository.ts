import Query from "../db/query.ts";
import AppError from "../utils/error.ts";
import {
    AddEmployeeParams,
    RestaurantEmployee,
    RestaurantEmployeeWithUser,
} from "../models/RestaurantEmployee.model.ts";

/**
 * Creates restaurant_employees Postgres SQL schema.
 *
 * The function is idempotent, so it can safely be executed multiple times.
 *
 * @throws {AppError} when schema creation fails
 */
export const createRestaurantEmployeeTable = async () => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS restaurant_employees (
        id SERIAL PRIMARY KEY,

        restaurant_id UUID NOT NULL
            REFERENCES restaurant(id) ON DELETE CASCADE,

        user_id INTEGER NOT NULL
            REFERENCES users(id) ON DELETE CASCADE,

        role VARCHAR(30) NOT NULL DEFAULT 'EMPLOYEE',
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE (restaurant_id, user_id)
    );`;

    try {
        await Query(createTableQuery, []);
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while creating table restaurant_employees";
        throw new AppError(errorMessage, 500);
    }
};

export const addEmployee = async (data: AddEmployeeParams): Promise<RestaurantEmployee> => {
    const query = `
        INSERT INTO restaurant_employees (restaurant_id, user_id, role, status)
        VALUES ($1, $2, COALESCE($3, 'EMPLOYEE'), COALESCE($4, 'ACTIVE'))
        RETURNING id, restaurant_id, user_id, role, status, joined_at;
    `;

    try {
        const role = data.role ? data.role.toUpperCase() : "EMPLOYEE";
        const status = data.status ? data.status.toUpperCase() : "ACTIVE";
        const res = await Query(query, [data.restaurant_id, data.user_id, role, status]);
        return res.rows[0];
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in addEmployee";
        throw new AppError(errorMessage, 500);
    }
};

export const getEmployeesByRestaurantId = async (
    restaurantId: string
): Promise<RestaurantEmployeeWithUser[]> => {
    const query = `
        SELECT 
            re.id,
            re.restaurant_id,
            re.user_id,
            re.role,
            re.status,
            re.joined_at,
            u.name AS user_name,
            u.email AS user_email,
            u.phone_no AS user_phone_no
        FROM restaurant_employees re
        JOIN users u ON re.user_id = u.id
        WHERE re.restaurant_id = $1
        ORDER BY re.joined_at DESC;
    `;

    try {
        const res = await Query(query, [restaurantId]);
        return res.rows;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getEmployeesByRestaurantId";
        throw new AppError(errorMessage, 500);
    }
};

export const getEmployeeById = async (id: number): Promise<RestaurantEmployee | null> => {
    const query = `
        SELECT id, restaurant_id, user_id, role, status, joined_at
        FROM restaurant_employees
        WHERE id = $1;
    `;

    try {
        const res = await Query(query, [id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getEmployeeById";
        throw new AppError(errorMessage, 500);
    }
};

export const getEmployeeByRestaurantAndUserId = async (
    restaurantId: string,
    userId: number
): Promise<RestaurantEmployee | null> => {
    const query = `
        SELECT id, restaurant_id, user_id, role, status, joined_at
        FROM restaurant_employees
        WHERE restaurant_id = $1 AND user_id = $2;
    `;

    try {
        const res = await Query(query, [restaurantId, userId]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Database error in getEmployeeByRestaurantAndUserId";
        throw new AppError(errorMessage, 500);
    }
};

export const updateEmployeeRole = async (
    id: number,
    role: string
): Promise<RestaurantEmployee | null> => {
    const query = `
        UPDATE restaurant_employees
        SET role = $1
        WHERE id = $2
        RETURNING id, restaurant_id, user_id, role, status, joined_at;
    `;

    try {
        const res = await Query(query, [role.toUpperCase(), id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in updateEmployeeRole";
        throw new AppError(errorMessage, 500);
    }
};

export const updateEmployeeStatus = async (
    id: number,
    status: string
): Promise<RestaurantEmployee | null> => {
    const query = `
        UPDATE restaurant_employees
        SET status = $1
        WHERE id = $2
        RETURNING id, restaurant_id, user_id, role, status, joined_at;
    `;

    try {
        const res = await Query(query, [status.toUpperCase(), id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in updateEmployeeStatus";
        throw new AppError(errorMessage, 500);
    }
};

export const removeEmployee = async (id: number): Promise<RestaurantEmployee | null> => {
    const query = `
        DELETE FROM restaurant_employees
        WHERE id = $1
        RETURNING id, restaurant_id, user_id, role, status;
    `;

    try {
        const res = await Query(query, [id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in removeEmployee";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantsByUserId = async (userId: number) => {
    const query = `
        SELECT 
            r.id,
            r.restaurant_name,
            r.description,
            r.address,
            r.phone_no,
            r.email_id,
            r.opening_time,
            r.closing_time,
            r.website_url,
            r.logo_id,
            r.avg_dining_price,
            r.status AS restaurant_status,
            r.is_open,
            re.role,
            re.status AS employee_status,
            re.joined_at
        FROM restaurant_employees re
        JOIN restaurant r ON re.restaurant_id = r.id
        WHERE re.user_id = $1
        ORDER BY re.joined_at DESC;
    `;

    try {
        const res = await Query(query, [userId]);
        return res.rows;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Database error in getRestaurantsByUserId";
        throw new AppError(errorMessage, 500);
    }
};
