import pool from "./db.ts";

const Query = async (text: string, params: string[]) => {

    const startTime = Date.now();
    try {
        const res = await pool.query(text, params);
        console.log(`Time required to complete query is ${Date.now() - startTime}`);
        return res;
    } catch (error: unknown) {
        console.log(`Error: ${error}, \n Time: ${Date.now() - startTime}`);
        throw error;
    }
}

export default Query;