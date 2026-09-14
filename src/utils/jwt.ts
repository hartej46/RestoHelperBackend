import jwt from "jsonwebtoken";
import AppError from "./error";

const generateAccessToken = (id: string, email: string, name: string) => {
    if ( !process.env.ACCESS_TOKEN_GENERATOR || !process.env.ACCESS_TOKEN_EXPIRY) {
        throw new AppError("No env file found", 500)
    }
    return jwt.sign({
            id: id,
            email: email,
            name: name
        },
        process.env.ACCESS_TOKEN_GENERATOR,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY as jwt.SignOptions["expiresIn"]
        }
    )
};

const generateRefreshToken = (id: string, email: string, name: string) => {
    if ( !process.env.REFRESH_TOKEN_GENERATOR || !process.env.REFRESH_TOKEN_EXPIRY) {
        throw new AppError("No env file found", 500)
    }
    return jwt.sign({
            id: id,
            email: email,
            name: name
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

export {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};