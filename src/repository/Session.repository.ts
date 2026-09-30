import Query from "../db/query.ts";
import AppError from "../utils/error.ts";
import type { PoolClient } from "pg";

export const createSessionTable = async () => {
    const query = `CREATE TABLE IF NOT EXISTS sessions(
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        users_id INTEGER NOT NULL,
        ip_address INET NOT NULL,
        user_agent TEXT,
        device_name VARCHAR(100),

        csrf_secret TEXT NOT NULL,

        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        last_used_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,

        revoked_reason TEXT,
        
        CONSTRAINT fk_sessions_user
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id
        ON sessions(users_id);

    CREATE INDEX IF NOT EXISTS idx_sessions_active
        ON sessions(users_id, expires_at)
        WHERE revoked_at IS NULL;`;

    try {
        await Query(query, []);
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while creating table sessions";
        throw new AppError(errorMessage, 500);
    }
};

export const createSession = async (
    users_id: string,
    ip_address: string,
    csrf_secret: string,
    expires_at: Date,
    user_agent: string | null = null,
    device_name: string | null = null
) => {
    const query = `
        INSERT INTO sessions(
            users_id, ip_address, user_agent, device_name, csrf_secret, expires_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6
        ) RETURNING *;
    `;

    try {
        const res = await Query(query, [
            users_id,
            ip_address,
            user_agent,
            device_name,
            csrf_secret,
            expires_at,
        ]);
        return res.rows[0] || null;
    } catch (error) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while inserting values in table sessions";
        throw new AppError(errorMessage, 500);
    }
};

export const createSessionWithClient = async (
    client: PoolClient,
    users_id: string,
    ip_address: string,
    csrf_secret: string,
    expires_at: Date,
    user_agent: string | null = null,
    device_name: string | null = null
) => {
    const query = `
        INSERT INTO sessions(
            users_id, ip_address, user_agent, device_name, csrf_secret, expires_at
        ) VALUES (
            $1, $2, $3, $4, $5, $6
        ) RETURNING *;
    `;

    const res = await client.query(query, [
        users_id,
        ip_address,
        user_agent,
        device_name,
        csrf_secret,
        expires_at,
    ]);

    return res.rows[0] || null;
};

export const getSessionByUserId = async (users_id: string) => {
    const query = `SELECT * FROM sessions WHERE users_id = $1 ORDER BY created_at DESC;`;

    try {
        const res = await Query(query, [users_id]);
        return res.rows;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while getting values in table sessions";
        throw new AppError(errorMessage, 500);
    }
};

export const getSessionById = async (id: string, users_id?: string) => {
    const query = users_id
        ? `SELECT * FROM sessions WHERE id = $1 AND users_id = $2;`
        : `SELECT * FROM sessions WHERE id = $1;`;

    try {
        const res = await Query(query, users_id ? [id, users_id] : [id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while getting values in table sessions";
        throw new AppError(errorMessage, 500);
    }
};

export const updateSessionById = async (
    id: string,
    users_id: string,
    csrf_secret: string,
    expires_at: Date
) => {
    const query = `UPDATE sessions SET csrf_secret = $1,
        expires_at = $2,
        last_used_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $3 AND users_id = $4 AND revoked_at IS NULL
        RETURNING *;
    `;

    try {
        const res = await Query(query, [csrf_secret, expires_at, id, users_id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while updating values in table sessions";
        throw new AppError(errorMessage, 500);
    }
};

export const revokeSessionById = async (id: string, users_id: string, reason = "logout") => {
    const query = `UPDATE sessions
        SET revoked_at = CURRENT_TIMESTAMP,
            revoked_reason = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND users_id = $3 AND revoked_at IS NULL
        RETURNING *;`;

    try {
        const res = await Query(query, [reason, id, users_id]);
        return res.rows[0] || null;
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error ? error.message : "Something went wrong while revoking session";
        throw new AppError(errorMessage, 500);
    }
};
