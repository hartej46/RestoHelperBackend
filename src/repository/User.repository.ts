import  Query  from '../db/query.ts';
import AppError from '../utils/error.ts';
import { hashPassword } from '../utils/password.ts';

/**
 * Creates user Postgres SQL schema required for user;
 * 
 * The function is idempotent, so it can safely be executed multiple times.
 * 
 * @throws {AppError} when schema creation fails
 */

export const createTableUser = async () => {
    const createTableQuery = `CREATE TABLE IF NOT EXISTS users(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,

        phone_no VARCHAR (15) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        verified BOOLEAN DEFAULT FALSE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
    );`;

    try {
        await Query(createTableQuery, [])
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while creating table User";
        throw new AppError(errorMessage, 500);
    }
};

export const createUser = async(name: string, phone_no: string, email: string, password: string, verified: boolean) => {
    const hashedPassword = await hashPassword(password);
    const query = `INSERT INTO users(name, phone_no, email, password, verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, phone_no, email, verified, created_at;
    `;

    try {
        const res = await Query(query, [name, phone_no, email, hashedPassword, verified]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while creating new user";
        throw new AppError(errorMessage, 500);
    }
    
};

export const getUserDetailsById = async ( id : string ) => {
    const query = `SELECT id, name, phone_no, email, created_at, updated_at, last_login FROM users WHERE id = $1;`
    try {
        const res = await Query(query, [ id ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while getting details by id";
        throw new AppError(errorMessage, 500);
    }
};

export const getUserByEmail = async (email : string) => {
    const query = `SELECT id, name, phone_no, email, created_at, updated_at, last_login FROM users WHERE email = $1;`;
    try {
        const res = await Query(query, [email]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while getting details by email";
        throw new AppError(errorMessage, 500);
    }
};

export const getUserByPhoneNumber = async (phone_no : string) => {
    const query = `SELECT id, name, phone_no, email, created_at, updated_at, last_login FROM users WHERE phone_no = $1;`;
    try {
        const res = await Query(query, [phone_no]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while getting details by phone number";
        throw new AppError(errorMessage, 500);
    }
};

export const deleteUser = async( id : string ) => {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, name, email;';

    try {
        const res = await Query(query, [ id ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while deleting";
        throw new AppError(errorMessage, 500);
    }
};

export const getUserByEmailWithPassword = async ( email: string ) => {
    const query = `SELECT * FROM users WHERE email = $1;`;
    try {
        const res = await Query(query, [ email ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while getting details with email";
        throw new AppError(errorMessage, 500);
    }
};

export const updatePassword = async ( id : string, password : string ) => {
    const query = `UPDATE users SET password = $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, phone_no, email;`;
    const hashedPassword = await hashPassword( password );

    try {
        const res = await Query( query, [ hashedPassword , id ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while updating password";
        throw new AppError(errorMessage, 500);
    }
};

export const updatePhoneNumber = async ( id : string, phone_no : string ) => {
    const query = `UPDATE users SET phone_no = $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, phone_no, email;`;

    try {
        const res = await Query( query, [ phone_no , id ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while updating password";
        throw new AppError(errorMessage, 500);
    }
};

export const updateEmail = async ( id : string, email : string ) => {
    const query = `UPDATE users SET email = $1,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, phone_no, email, verified;`;

    try {
        const res = await Query( query, [ email  , id ]);
        return res.rows[0] || null;
    } catch (error : unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong while updating password";
        throw new AppError(errorMessage, 500);
    }
};

