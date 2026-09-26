import asyncHandler from '../utils/asyncHandler.ts';
import jwt from "jsonwebtoken";
import { getUserDetailsById } from '../repository/User.repository.ts';
import { JwtTokenPayload, User } from '../models/User.model.ts';
import AppError from '../utils/error.ts';
import { Request } from 'express';
import {
    generateAccessToken,
    generateRefreshToken,
    generateCsrfToken,
    isCsrfTokenValid
} from '../utils/token.ts';
import { getSessionById, updateSessionById } from "../repository/Session.repository.ts";
import { Session } from '../models/Session.model.ts';
import { refreshTokenOption, csrfTokenOptions } from "../constant.ts";
import crypto from 'node:crypto';

interface customRequest extends Request {
    user?: User
}

interface tokenVerificationResponse {
    success: boolean,
    message: string
    user: User | null,
    session? : Session
}

/**
 * Authenticates incoming requests using an access token.
 * The access token is the primary authentication mechanism.

 * When it is valid, the associated user is loaded and attached to `req.user`.

 * If access-token validation fails, the middleware attempts session-based
 * re-authentication using the refresh token and CSRF protection. On success,
 * the session credentials are rotated and a new access token is returned
 * through the response header.
 */

export const authentication = asyncHandler( async (req: customRequest , res , next) => {
    const authHeader = req.headers.authorization;

    const accessToken = authHeader && authHeader.startsWith('Bearer ') 
        ? authHeader.split(' ')[1]
        : "";

        let decodedAccessToken : JwtTokenPayload;

        try {

            decodedAccessToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_GENERATOR!) as JwtTokenPayload;

        } catch ( error : unknown ) {

            if (!(error instanceof jwt.TokenExpiredError)) {
                throw new AppError("Invalid token", 401)
            }
            const csrfHeader = req.headers['x-csrf-token'] as string;
            const csrfCookie = req.cookies.csrfToken;
            const refreshToken = req.cookies.refreshToken;
            
            const isTokenValid = await tokenVerification( refreshToken, csrfHeader, csrfCookie);
            if( !isTokenValid.success || !isTokenValid.user ) {
                throw new AppError("Tokens are not Valid", 401)
            };
            
            const secret_key = crypto.randomBytes(32).toString('hex');

            const expiry_date = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
            )

            try {
                const updatedSession = await updateSessionById( isTokenValid.user.id, secret_key, expiry_date);
            } catch (error) {
                throw new AppError("Tokens are not Valid", 401);
            }

            const newCsrfToken = generateCsrfToken( isTokenValid.user.id, secret_key )
            const newAccessToken = generateAccessToken( isTokenValid.user.id, isTokenValid.user.email, isTokenValid.user.name, isTokenValid.session?.id! );
            const newRefreshToken = generateRefreshToken( isTokenValid.user.id, isTokenValid.user.email, isTokenValid.user.name, isTokenValid.session?.id!  );

            res.setHeader("x-Access-Token", newAccessToken);
            res.cookie("refreshToken", newRefreshToken, refreshTokenOption).cookie('csrfToken', newCsrfToken, csrfTokenOptions);
            req.user = isTokenValid.user;
            next();
            return;
        }
        
        const user = await getUserDetailsById( decodedAccessToken.userId ) as User;

        if (!user) {
            throw new AppError("No user found", 404);
        }
        
        req.user = user;
        next();
        return;
});

const tokenVerification = async ( token : string, csrfHeader : string, csrfCookie : string ) : Promise<tokenVerificationResponse> => {
    let decodedRefreshToken : JwtTokenPayload;
    try {
        decodedRefreshToken = jwt.verify( token, process.env.REFRESH_TOKEN_GENERATOR! ) as JwtTokenPayload;
    } catch ( error : unknown ) {
        return {
        success: false,
        message: "Invalid refresh token",
        user: null
        }
    }

    const user = await getUserDetailsById( decodedRefreshToken.userId ) as User;

    if ( !user ) return {
        success: false,
        message: "No user found",
        user: null
    };
    
    const session = await getSessionById( decodedRefreshToken.sessionId ) as Session;

    if (!session || new Date(session.expires_at) < new Date() || session.revoked_at ) {
        return {
            success: false,
            message: "Session not found",
            user: null
        };
    }

    if (!(isCsrfTokenValid( csrfHeader, csrfCookie, session.csrf_secret, token )))  return {
        success: false,
        message: "Invalid Csrf token",
        user: null
    };;

    return {
        success: true,
        message: "Valid csrf token",
        user: user,
        session: session
    };
    
};