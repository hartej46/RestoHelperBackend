import { Request, Response } from "express";

const errorHandler = (error: any, req: Request, res: Response ) => {
    const statusCode = error.statusCode || 500;

    return res.status(statusCode).json({
        success: false,
        message: error.message || "Something went wrong",
    });
};

export default errorHandler;