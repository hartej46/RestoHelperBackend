import  Query  from '../db/query.ts';
import AppError from '../utils/error.ts';

export const createRestaurantTable = async () => {
    const createTypeRestaurantStatus = `
        DO $$ BEGIN
            CREATE TYPE restaurant_status as ENUM('Active', 'Inactive');
        EXCEPTION
            WHEN duplicate_object THEN null;
        END $$;
    `;
    const createTableQuery = `CREATE TABLE IF NOT EXISTS restaurant (
        id UUID PRIMARY KEY,
        owner_id UUID NOT NULL,

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
        more_info TEXT[],

        status restaurant_status,
        is_open BOOLEAN DEFAULT false,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT fk_owner_id
        FOREIGN KEY (owner_id)
        REFERENCES "user"(id),
    )`

    try {
        await Query(createTypeRestaurantStatus, []);
        await Query(createTableQuery, []);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong in createRestaurantTable()";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantById = async (id: string) => {
    const query = `SELECT * FROM restaurant WHERE id = $1;`;
    
    try {
        const res = await Query(query, [id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Database error in getRestaurantById";
        throw new AppError(errorMessage, 500);
    }
};

export const getRestaurantsByOwnerId = async (ownerId: string) => {
    const query = `SELECT * FROM restaurant WHERE owner_id = $1 ORDER BY created_at DESC;`;
    
    try {
        const res = await Query(query, [ownerId]);
        return res.rows;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Database error in getRestaurantsByOwnerId";
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
        const errorMessage = error instanceof Error ? error.message : "Database error in updateRestaurantStatus";
        throw new AppError(errorMessage, 500);
    }
};

export const updateRestaurantContactDetails = async ( id: string, emailId: string, phoneNo: string, status: 'Active' | 'Inactive', opening_time: number, closing_time: number ) => {
    const query = `
        UPDATE restaurant 
        SET email_id = $1,
        phone_no = $2,
        status = $3,
        opening_time = $4,

        updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, restaurant_name, email_id, phone_no;
    `;
    try {
        const res = await Query(query, [emailId, phoneNo, id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Database error in updateRestaurantContactDetails";
        throw new AppError(errorMessage, 500);
    }
};
