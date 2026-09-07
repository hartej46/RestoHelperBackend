import { Pool, type PoolConfig } from 'pg';
import 'dotenv/config';

declare const process: {
    env: Record<string, string | undefined>;
};


// connection string is a string;
const connectionString: string | undefined = process.env.CONNECTION_STRING;


if (!connectionString) {
    throw new Error('CONNECTION_STRING is not defined in environment variables.');
}


// Determine SSL connection
const isProduction: boolean = process.env.NODE_ENV === 'production';
const hasSslQuery: boolean = (connectionString.includes('sslmode=require') || connectionString.includes('ssl=true'));
const forceSsl = process.env.DB_SSL === 'true';


const sslConfig: PoolConfig['ssl'] = (isProduction || hasSslQuery || forceSsl)
    ? { rejectUnauthorized: false }
    : false;


const pool = new Pool({
    connectionString,
    ssl: sslConfig
});

export const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log("The connection have been established");
        client.release();
    } catch (error) {
        console.log("Error:", error)
    }
}

export default pool;