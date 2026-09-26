import jwt from "jsonwebtoken";
import AppError from "./error";
import crypto from "node:crypto";

const generateAccessToken = (userId : string, sessionId : string, email: string, name: string) => {
    if ( !process.env.ACCESS_TOKEN_GENERATOR || !process.env.ACCESS_TOKEN_EXPIRY) {
        throw new AppError("No env file found", 500)
    }
    return jwt.sign({
            userId: userId,
            email: email,
            name: name,
            sessionId : sessionId
        },
        process.env.ACCESS_TOKEN_GENERATOR,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
        }
    )
};

const generateRefreshToken = (userId : string, sessionId : string, email: string, name: string) => {
    if ( !process.env.REFRESH_TOKEN_GENERATOR || !process.env.REFRESH_TOKEN_EXPIRY) {
        throw new AppError("No env file found", 500)
    }
    return jwt.sign({
            user_id: userId,
            email: email,
            name: name,
            sessionId: sessionId
        },
        process.env.REFRESH_TOKEN_GENERATOR,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
        }
    )
};

const verifyAccessToken = (token : string) => {
    const res = jwt.verify(token, process.env.ACCESS_TOKEN_GENERATOR!);
    return res;
};

const verifyRefreshToken = (token : string) => {
    const res = jwt.verify(token, process.env.REFRESH_TOKEN_GENERATOR!);
    return res;
};

const generateCsrfToken = ( token : string, key : string ) => {
    const csrfToken = crypto.createHmac("sha256", key)
        .update( token )
        .digest("hex");

        return csrfToken
}

const isCsrfTokenValid = ( csrfHeader : string, csrfCookie : string, csrf_secret : string , token : string ) => {
    const expectedCsrfToken = crypto
            .createHmac("sha256", csrf_secret)
            .update( token )
            .digest("hex");
    
        const expectedCsrfBuffer = Buffer.from(expectedCsrfToken);
        const headerCsrfBuffer = Buffer.from(csrfHeader);
        const cookieCsrfBuffer = Buffer.from(csrfCookie);
        if (expectedCsrfBuffer.length !== headerCsrfBuffer.length || expectedCsrfBuffer.length !== cookieCsrfBuffer.length) {
            return false;
        }

        return crypto.timingSafeEqual( expectedCsrfBuffer, headerCsrfBuffer) && crypto.timingSafeEqual( expectedCsrfBuffer, cookieCsrfBuffer );
}

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateCsrfToken,
    isCsrfTokenValid
};