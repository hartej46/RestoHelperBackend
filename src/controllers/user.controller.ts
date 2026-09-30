import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import {
    requestBodyCreateUser,
    validateOtpSchema,
    validateLoginSchema
} from "../schema/user.schema.ts";
import { User } from "../models/User.model.ts";
import { getUserByEmail, getUserByPhoneNumber, createUser } from "../repository/User.repository.ts";
import redisKeyGenerator from "../redis/redisKeyGenerator.ts";
import { setRedisHash, getRedisHash } from "../redis/redisHash.ts";
import { hashPassword } from "../utils/password.ts";
import sendOtpEmail from "../utils/emailSender.ts";
import { generateAccessToken, generateRefreshToken, generateCsrfToken } from "../utils/token.ts";
import { createSession } from "../repository/Session.repository.ts";
import crypto from "node:crypto";
import { Session } from "../models/Session.model.ts";
import { csrfTokenOptions, refreshTokenOption } from "../constant.ts";

const newUserSignUp = asyncHandler(async (req, res) => {
    const body: requestBodyCreateUser = req.body;
    const name = body.name.trim();
    const email = body.email.trim();
    const password = body.password.trim();
    const phone_no = body.phone_no.trim();

    const userByEmail: User = await getUserByEmail(email);
    const userByPhoneNumber: User = await getUserByPhoneNumber(phone_no);

    if (userByEmail?.verified) throw new AppError("User already exists using this email", 400);

    if (userByPhoneNumber?.verified)
        throw new AppError("User already exists using this phone number", 400);

    const redisKey = redisKeyGenerator(email);
    const hashedPassword = await hashPassword(password);
    const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    const data = {
        name: name,
        email: email,
        password: hashedPassword,
        phone_no: phone_no,
        otp: otp,
    };

    const expiresInMinutes = 5;
    const expiresInSeconds = expiresInMinutes * 60;
    await setRedisHash(redisKey, data, expiresInSeconds);
    await sendOtpEmail(email, otp, expiresInMinutes);

    return res.status(201).json({
        success: true,
        message: "OTP was sent successfully",
    });
});

const validateOtp = asyncHandler(async (req, res) => {
    const validatedBody = validateOtpSchema.safeParse(req.body);

    if (!validatedBody.success) {
        throw new AppError(validatedBody.error.issues[0].message, 400);
    }

    const email = validatedBody.data.email;
    const otp = validatedBody.data.otp;

    const redisKey = redisKeyGenerator(email);
    const userData = await getRedisHash(redisKey);

    if (otp != userData.otp) throw new AppError("Invalid OTP", 401);

    const newUser = (await createUser(
        userData.name,
        userData.phone_no,
        userData.email,
        userData.password,
        true
    )) as User;

    const secret_key = crypto.randomBytes(32).toString("hex");
    const today = new Date();
    const expires_at = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const userAgentString = req.get("user-agent");

    const newSession = (await createSession(
        newUser.id,
        req.ip!,
        secret_key,
        expires_at,
        userAgentString
    )) as Session;

    const accessToken = generateAccessToken(newUser.id, newSession.id, newUser.email, newUser.name);
    const refreshToken = generateRefreshToken(
        newUser.id,
        newSession.id,
        newUser.email,
        newUser.name
    );
    const csrfToken = generateCsrfToken(refreshToken, secret_key);

    res.set("Authorization", "Bearer " + accessToken);
    res.cookie("csrfToken", csrfToken, csrfTokenOptions).cookie(
        "refreshToken",
        refreshToken,
        refreshTokenOption
    );

    return res.status(200).json({
        success: true,
        message: "New User created successfully",
        user: newUser,
    });
});
