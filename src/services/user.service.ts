import { Request, Response } from "express";
import AppError from "../utils/error.ts";
import { JwtTokenPayload, User } from "../models/User.model.ts";
import { verifyAccessToken, verifyRefreshToken } from "../utils/token.ts";
import { csrfTokenOptions, refreshTokenOption } from "../constant.ts";

export const getSessionIdFromRequest = (req: Request) => {
    const accessToken = req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : undefined;

    try {
        const payload = verifyAccessToken(accessToken ?? "") as JwtTokenPayload;
        if (payload.sessionId) return payload.sessionId;
    } catch (error: unknown) {
        const refreshToken = req.cookies?.refreshToken;

        try {
            const payload = verifyRefreshToken(refreshToken ?? "") as JwtTokenPayload;
            if (payload.sessionId) return payload.sessionId;
        } catch (refreshError: unknown) {
            throw new AppError("Authentication is required", 401);
        }
    }

    throw new AppError("Authentication is required", 401);
};

export const clearAuthenticationCookies = (res: Response) => {
    res.clearCookie("csrfToken", csrfTokenOptions);
    res.clearCookie("refreshToken", refreshTokenOption);
};

export const getAuthenticatedUser = (req: Request) => {
    const user = (req as typeof req & { user?: User }).user;
    if (!user) throw new AppError("Authentication is required", 401);
    return user;
};
