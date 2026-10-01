import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import {
    requestBodyCreateUser,
    validateOtpSchema,
    validateLoginSchema,
    resetPasswordOtpSchema,
    resetPasswordSchema,
} from "../schema/user.schema.ts";
import { User, UserWithPassword } from "../models/User.model.ts";
import { getUserByEmail, getUserByPhoneNumber, createUser, getUserByEmailPhoneWithPassword, updatePassword } from "../repository/User.repository.ts";
import redisKeyGenerator, { passwordResetKeyGenerator } from "../redis/redisKeyGenerator.ts";
import { setRedisHash, getRedisHash, deleteRedisHash } from "../redis/redisHash.ts";
import { hashPassword } from "../utils/password.ts";
import sendOtpEmail, { sendPasswordResetOtpEmail } from "../utils/emailSender.ts";
import sendOtpWhatsApp from "../utils/whatsappSender.ts";
import { generateAccessToken, generateRefreshToken, generateCsrfToken } from "../utils/token.ts";
import { createSession } from "../repository/Session.repository.ts";
import crypto from "node:crypto";
import { Session } from "../models/Session.model.ts";
import { csrfTokenOptions, refreshTokenOption } from "../constant.ts";
import { verifyPassword } from "../utils/password.ts";
import { withTransaction } from "../db/db.ts";
import { createSessionWithClient } from "../repository/Session.repository.ts";
import { updateUserLoginWithClient } from "../repository/User.repository.ts";

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
    const emailOtp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const whatsappOtp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

    const data = {
        name: name,
        email: email,
        password: hashedPassword,
        phone_no: phone_no,
        emailOtp: emailOtp,
        whatsappOtp: whatsappOtp,
    };

    const expiresInMinutes = 5;
    const expiresInSeconds = expiresInMinutes * 60;
    await setRedisHash(redisKey, data, expiresInSeconds);
    await sendOtpEmail(email, emailOtp, expiresInMinutes);
    await sendOtpWhatsApp(phone_no, whatsappOtp, expiresInMinutes);

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
    const emailOtp = validatedBody.data.emailOtp;
    const whatsappOtp = validatedBody.data.whatsappOtp;

    const redisKey = redisKeyGenerator(email);
    const userData = await getRedisHash(redisKey);

    if (emailOtp !== userData.emailOtp || whatsappOtp !== userData.whatsappOtp) {
        throw new AppError("Invalid OTP", 401);
    }

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

const loginUser = asyncHandler(async (req, res) => {
    const validatedBody = validateLoginSchema.safeParse(req.body);

    if (!validatedBody.success) throw new AppError(validatedBody.error.message, 401);

    const email = validatedBody.data.email;
    const phone_no = validatedBody.data.phoneNumber;
    const password = validatedBody.data.password;

    const userData: UserWithPassword = await getUserByEmailPhoneWithPassword(email, phone_no);

    if (!userData) throw new AppError("No user found with this email", 401);

    const isPasswordValid = await verifyPassword(password, userData.password);
    if (!isPasswordValid) throw new AppError("Password is not valid, please try again later", 401);

    const csrfSecret = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const userAgent = req.get("user-agent") ?? null;

    const { session, user } = await withTransaction(async (client) => {
        const session = (await createSessionWithClient(
            client,
            userData.id,
            req.ip!,
            csrfSecret,
            expiresAt,
            userAgent
        )) as Session;

        const user = await updateUserLoginWithClient(client, userData.id);

        return { session, user };
    });

    const accessToken = generateAccessToken(user.id, session.id, user.email, user.name);
    const refreshToken = generateRefreshToken(user.id, session.id, user.email, user.name);
    const csrfToken = generateCsrfToken(refreshToken, csrfSecret);

    res.set("Authorization", "Bearer " + accessToken);
    res.cookie("csrfToken", csrfToken, csrfTokenOptions).cookie(
        "refreshToken",
        refreshToken,
        refreshTokenOption
    );

    return res.status(200).json({
        success: true,
        message: "Login successful",
        user,
    });
});

const resetPasswordOtp = asyncHandler(async (req, res) => {
    const validatedBody = resetPasswordOtpSchema.safeParse(req.body);

    if (!validatedBody.success) {
        throw new AppError(validatedBody.error.issues[0].message, 400);
    }

    const email = validatedBody.data.email;
    const user = await getUserByEmail(email);

    if (user) {
        const otp = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
        const expiresInMinutes = 5;
        const resetKey = passwordResetKeyGenerator(email);

        await setRedisHash(resetKey, { email, otp }, expiresInMinutes * 60);
        await sendPasswordResetOtpEmail(email, otp, expiresInMinutes);
    }

    return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset OTP was sent",
    });
});

const resetPassword = asyncHandler(async (req, res) => {
    const validatedBody = resetPasswordSchema.safeParse(req.body);

    if (!validatedBody.success) {
        throw new AppError(validatedBody.error.issues[0].message, 400);
    }

    const { email, otp, password } = validatedBody.data;
    const resetKey = passwordResetKeyGenerator(email);
    const resetData = await getRedisHash(resetKey);

    if (String(otp) !== resetData.otp) throw new AppError("Invalid OTP", 401);

    const user = await getUserByEmail(email);
    if (!user) throw new AppError("No user found with this email", 404);

    await updatePassword(user.id, password);
    await deleteRedisHash(resetKey);

    return res.status(200).json({
        success: true,
        message: "Password reset successfully",
    });
});

