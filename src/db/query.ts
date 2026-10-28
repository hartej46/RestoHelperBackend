import pool from "./db.ts";

type QueryParam = string | number | boolean | Date | null | string[] | number[];

const Query = async (text: string, params: QueryParam[]) => {
    const startTime = Date.now();
    try {
        const res = await pool.query(text, params);
        console.log(`Time required to complete query is ${Date.now() - startTime}`);
        return res;
    } catch (error: unknown) {
        console.log(`Error: ${error}, \n Time: ${Date.now() - startTime}`);
        throw error;
    }
};

export default Query;
