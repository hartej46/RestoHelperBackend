import { CookieOptions } from "express";
export const DB_NAME = "Restro_helper";

export const refreshTokenOption : CookieOptions = {
    httpOnly: true,
    secure: true,
    sameSite: "lax"
};

export const csrfTokenOptions :  CookieOptions = {
    httpOnly: false,
    secure: true,
    sameSite: "lax"
};