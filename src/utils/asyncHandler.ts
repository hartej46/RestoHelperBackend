import { Request , Response, NextFunction } from 'express';

const asyncHandler = (fn : (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            return await fn(req, res, next);
        } catch (error : any) {
            const statusCode = error.statuscode || error.status || 500;
            return res.status(statusCode).json({
                success: false,
                message: error.message || "Something went wrong"
            });
        }
    }
}

export default asyncHandler;