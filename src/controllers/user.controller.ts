import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import {
    getPhoneVerificationKey,
    phoneVerificationTtl,
    whatsappOtpVerifier,
} from "../utils/angelos.ts";
import {
    requestBodyCreateUser,
    validateOtpSchema,
    validateLoginSchema,
    resetPasswordOtpSchema,
    resetPasswordSchema,
} from "../schema/user.schema.ts";
import { User, UserWithPassword } from "../models/User.model.ts";
import {
    getUserByEmail,
    getUserByPhoneNumber,
    getUserByEmailPhoneWithPassword,
    deleteUser,
    getUserDetailsById,
    updatePassword,
    updatePhoneNumber,
    updateEmail,
    createUserWithClient,
} from "../repository/User.repository.ts";
import { passwordResetKeyGenerator, redisKeyGenerator } from "../redis/redisKeyGenerator.ts";
import { setRedis, getRedis, deleteRedis } from "../redis/redisHash.ts";
import redisClient from "../db/redis.ts";
import { hashPassword } from "../utils/password.ts";
import sendOtpEmail, { sendPasswordResetOtpEmail } from "../utils/emailSender.ts";
import { generateAccessToken, generateRefreshToken, generateCsrfToken } from "../utils/token.ts";
import {
    createSession,
    revokeAllSessions,
    revokeSessionById,
} from "../repository/Session.repository.ts";
import crypto from "node:crypto";
import { Session } from "../models/Session.model.ts";
import { csrfTokenOptions, refreshTokenOption } from "../constant.ts";
import { verifyPassword } from "../utils/password.ts";
import { withTransaction } from "../db/db.ts";
import { createSessionWithClient } from "../repository/Session.repository.ts";
import { updateUserLoginWithClient } from "../repository/User.repository.ts";
import {
    getSessionIdFromRequest,
    getAuthenticatedUser,
    clearAuthenticationCookies,
} from "../services/user.service.ts";
import type { CreateSessionConfig } from "angelos";

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

    const data = {
        name: name,
        email: email,
        password: hashedPassword,
        phone_no: phone_no,
        emailOtp: emailOtp,
        emailVerified: false,
    };

    const expiresInMinutes = 5;
    const expiresInSeconds = expiresInMinutes * 60;
    await setRedis(redisKey, JSON.stringify(data), expiresInSeconds);
    await sendOtpEmail(email, emailOtp, expiresInMinutes);

    return res.status(201).json({
        success: true,
        message: "OTP was sent successfully",
    });
});

const validateEmailOtp = asyncHandler(async (req, res) => {
    const validatedBody = validateOtpSchema.safeParse(req.body);

    if (!validatedBody.success) {
        throw new AppError(validatedBody.error.issues[0].message, 400);
    }

    const email = validatedBody.data.email;
    const emailOtp = validatedBody.data.emailOtp;

    const redisKey = redisKeyGenerator(email);
    const userData = await getRedis(redisKey);

    if (emailOtp !== String(userData.emailOtp)) {
        console.log(emailOtp, userData.emailOtp);
        throw new AppError("Invalid OTP", 401);
    }

    const updatedUserData = {
        ...userData,
        emailVerified: true,
    };

    const expiresInSeconds = 5 * 60;

    await setRedis(redisKey, JSON.stringify(updatedUserData), expiresInSeconds);

    const config: CreateSessionConfig = {
        phoneNumber: updatedUserData.phone_no,
    };

    const session = await whatsappOtpVerifier.createSession(config);
    const verificationKey = getPhoneVerificationKey(session.id);
    const verificationData = {
        type: "SIGNUP" as const,
        status: "PENDING" as const,
        sessionId: session.id,
        email: updatedUserData.email,
        phone_no: updatedUserData.phone_no,
    };

    await redisClient.set(verificationKey, JSON.stringify(verificationData), {
        EX: phoneVerificationTtl,
    });

    const storedVerification = await redisClient.get(verificationKey);
    if (!storedVerification) {
        throw new AppError("Unable to create WhatsApp verification session", 500);
    }

    return res.status(201).json({
        success: true,
        message: "QR generated successfully",
        data: {
            sessionId: session.id,
            webUrl: session.deepLink,
            qrSvg: session.qrSvg,
            expiresAt: session.expiresAt,
        },
    });
});

const getSignupPhoneVerificationEvents = asyncHandler(async (req, res) => {
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId.trim() : "";

    if (!sessionId) throw new AppError("Session id is required", 400);

    const key = getPhoneVerificationKey(sessionId);
    const verification = await redisClient.get(key);

    if (typeof verification !== "string" || !verification) {
        throw new AppError("Verification session not found", 404);
    }

    const verificationData = JSON.parse(verification) as {
        type?: "SIGNUP";
        status: "PENDING" | "VERIFIED";
        sessionId: string;
        userId?: string;
    };

    if (verificationData.type !== "SIGNUP" || verificationData.sessionId !== sessionId) {
        throw new AppError("Verification session not found", 404);
    }

    res.status(200);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let closed = false;
    let interval: NodeJS.Timeout | undefined;
    const closeStream = () => {
        if (closed) return;
        closed = true;
        if (interval) clearInterval(interval);
        res.end();
    };

    const sendStatus = async () => {
        if (closed) return;

        const currentValue = await redisClient.get(key);
        if (typeof currentValue !== "string" || !currentValue) {
            res.write(
                `event: expired\ndata: ${JSON.stringify({ success: false, status: "EXPIRED" })}\n\n`
            );
            closeStream();
            return;
        }

        const currentData = JSON.parse(currentValue) as typeof verificationData;
        if (currentData.status === "VERIFIED") {
            res.write(
                `event: verified\ndata: ${JSON.stringify({
                    success: true,
                    status: "VERIFIED",
                    userId: currentData.userId,
                })}\n\n`
            );
            closeStream();
            return;
        }

        res.write(
            `event: pending\ndata: ${JSON.stringify({ success: true, status: "PENDING" })}\n\n`
        );
    };

    req.on("close", closeStream);
    await sendStatus();
    if (!closed) {
        interval = setInterval(() => {
            sendStatus().catch(() => closeStream());
        }, 1000);
    }
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

        await setRedis(resetKey, JSON.stringify({ email, otp }), expiresInMinutes * 60);
        await sendPasswordResetOtpEmail(email, otp, expiresInMinutes);
    }

    return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset OTP was sent",
    });
});

// const resetPassword = asyncHandler(async (req, res) => {
//     const validatedBody = resetPasswordSchema.safeParse(req.body);

//     if (!validatedBody.success) {
//         throw new AppError(validatedBody.error.issues[0].message, 400);
//     }

//     const { email, otp, password } = validatedBody.data;
//     const resetKey = passwordResetKeyGenerator(email);
//     const resetData = await getRedis(resetKey);

//     if (String(otp) !== resetData.otp) throw new AppError("Invalid OTP", 401);

//     const user = await getUserByEmail(email);
//     if (!user) throw new AppError("No user found with this email", 404);

//     await updatePassword(user.id, password);
//     await deleteRedis(resetKey);

//     return res.status(200).json({
//         success: true,
//         message: "Password reset successfully",
//     });
// });

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const userDetails = await getUserDetailsById(user.id);

    if (!userDetails) throw new AppError("No user found", 404);

    return res.status(200).json({
        success: true,
        user: userDetails,
    });
});

const logoutUser = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const sessionId = getSessionIdFromRequest(req);
    const revokedSession = await revokeSessionById(sessionId, user.id);

    if (!revokedSession) throw new AppError("Session not found", 404);

    clearAuthenticationCookies(res);

    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
});

const logoutAllUsers = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    await revokeAllSessions(user.id);
    clearAuthenticationCookies(res);

    return res.status(200).json({
        success: true,
        message: "Logged out from all devices",
    });
});

const deleteUserAccount = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const deletedUser = await deleteUser(user.id);

    if (!deletedUser) throw new AppError("No user found", 404);

    clearAuthenticationCookies(res);

    return res.status(200).json({
        success: true,
        message: "User account deleted successfully",
    });
});

const revokeUserSession = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const sessionId = typeof req.params.sessionId === "string" ? req.params.sessionId : "";

    const revokedSession = await revokeSessionById(sessionId, user.id);

    if (!revokedSession) throw new AppError("Session not found", 404);

    if (sessionId === getSessionIdFromRequest(req)) clearAuthenticationCookies(res);

    return res.status(200).json({
        success: true,
        message: "Session revoked successfully",
    });
});

const updateUserPhoneNumber = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const phone_no = req.body.phone_no?.trim();

    if (!phone_no || !/^\+?[1-9]\d{1,14}$/.test(phone_no)) {
        throw new AppError("Invalid phone number format", 400);
    }

    const existingUser = await getUserByPhoneNumber(phone_no);
    if (existingUser && String(existingUser.id) !== String(user.id)) {
        throw new AppError("User already exists using this phone number", 400);
    }

    const session = await whatsappOtpVerifier.createSession({
        phoneNumber: phone_no,
        ttl: phoneVerificationTtl,
    });

    await redisClient.set(
        getPhoneVerificationKey(session.id),
        JSON.stringify({ userId: user.id, phone_no, status: "PENDING" }),
        { EX: phoneVerificationTtl }
    );

    return res.status(200).json({
        success: true,
        message: "WhatsApp verification session created",
        sessionId: session.id,
        qrCode: session.qrLink,
        deepLink: session.deepLink,
        appLink: session.deepLink,
        expiresAt: session.expiresAt,
    });
});

const getPhoneVerificationStatus = asyncHandler(async (req, res) => {
    const user = getAuthenticatedUser(req);
    const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : "";

    if (!sessionId) throw new AppError("Session id is required", 400);

    const key = getPhoneVerificationKey(sessionId);
    const verification = await redisClient.get(key);

    if (typeof verification !== "string" || !verification) {
        throw new AppError("Verification session not found", 404);
    }

    const verificationData = JSON.parse(verification) as {
        userId?: string;
        phone_no: string;
        status: "PENDING" | "VERIFIED";
        email?: string;
    };

    if (verificationData.userId !== user.id) {
        throw new AppError("Verification session not found", 404);
    }

    if (verificationData.status === "VERIFIED") {
        const updatedUser = await getUserDetailsById(user.id);
        await redisClient.del(key);

        return res.status(200).json({
            success: true,
            status: "VERIFIED",
            message: "Phone number updated successfully",
            user: updatedUser,
        });
    }

    return res.status(200).json({
        success: true,
        status: "PENDING",
    });
});

const verifyWhatsAppWebhook = asyncHandler(async (req, res) => {
    const rawBody = (req as typeof req & { rawBody?: Buffer }).rawBody;
    const signature = req.headers["x-hub-signature-256"];

    console.info("Received WhatsApp webhook", {
        hasRawBody: Boolean(rawBody),
        rawBodyLength: rawBody?.length ?? 0,
        hasSignature: typeof signature === "string" && signature.length > 0,
    });

    const result = await whatsappOtpVerifier.verifySession({
        rawBody: rawBody!,
        signature: typeof signature === "string" ? signature : "",
        jsonData: req.body,
    });

    if (!result.success || !result.parsedData) {
        console.warn("WhatsApp verification rejected", {
            message: result.message,
        });
        return res.status(200).send("EVENT_RECEIVED");
    }

    const sessionId = result.parsedData.text.trim().split(" ")[1];
    if (!sessionId) {
        console.warn("WhatsApp verification message did not contain a session ID");
        return res.status(200).send("EVENT_RECEIVED");
    }

    const key = getPhoneVerificationKey(sessionId);
    const verification = await redisClient.get(key);
    if (typeof verification !== "string" || !verification) {
        console.warn("WhatsApp verification status record not found", { sessionId });
        return res.status(200).send("EVENT_RECEIVED");
    }

    const verificationData = JSON.parse(verification) as {
        type?: "SIGNUP" | "PHONE_UPDATE";
        userId?: string;
        phone_no: string;
        status: "PENDING" | "VERIFIED";
        email?: string;
    };

    if (verificationData.type === "SIGNUP") {
        if (!verificationData.email) {
            throw new AppError("Signup verification data is incomplete", 400);
        }

        const signupData = await getRedis(redisKeyGenerator(verificationData.email));
        const csrfSecret = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const userAgent = req.get("user-agent") ?? null;

        const user = await withTransaction(async (client) => {
            const newUser = (await createUserWithClient(
                client,
                signupData.name,
                signupData.phone_no,
                signupData.email,
                signupData.password,
                true
            )) as User;

            await createSessionWithClient(
                client,
                newUser.id,
                req.ip ?? "0.0.0.0",
                csrfSecret,
                expiresAt,
                userAgent
            );

            return newUser;
        });

        await redisClient.set(
            key,
            JSON.stringify({
                ...verificationData,
                status: "VERIFIED",
                userId: user.id,
            }),
            {
                EX: phoneVerificationTtl,
            }
        );
        await redisClient.del(redisKeyGenerator(signupData.email));
        return res.status(200).send("EVENT_RECEIVED");
    }

    if (verificationData.status === "PENDING") {
        if (!verificationData.userId) {
            throw new AppError("Phone verification data is incomplete", 400);
        }

        await updatePhoneNumber(verificationData.userId, verificationData.phone_no);
        await redisClient.set(key, JSON.stringify({ ...verificationData, status: "VERIFIED" }), {
            EX: phoneVerificationTtl,
        });
    }

    return res.status(200).send("EVENT_RECEIVED");
});

const verifyWhatsAppWebhookHandshake = asyncHandler(async (req, res) => {
    const result = whatsappOtpVerifier.handleWebhookVerification(
        req.query as {
            "hub.mode": string;
            "hub.verify_token": string;
            "hub.challenge": string;
        }
    );

    if (!result.success || !result.challenge) return res.sendStatus(403);

    return res.status(200).send(result.challenge);
});

const updateUserEmail = asyncHandler(async (req, res) => {
    const user = (req as typeof req & { user?: User }).user;
    if (!user) throw new AppError("Authentication is required", 401);

    const email = req.body.email?.trim().toLowerCase();
    const validatedEmail = resetPasswordOtpSchema.safeParse({ email });

    if (!validatedEmail.success) {
        throw new AppError(validatedEmail.error.issues[0].message, 400);
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser && String(existingUser.id) !== String(user.id)) {
        throw new AppError("User already exists using this email", 400);
    }

    const updatedUser = await updateEmail(user.id, email);

    return res.status(200).json({
        success: true,
        message: "Email updated successfully",
        user: updatedUser,
    });
});

export {
    newUserSignUp,
    validateEmailOtp,
    loginUser,
    resetPasswordOtp,
    // resetPassword,
    getCurrentUser,
    logoutUser,
    logoutAllUsers,
    deleteUserAccount,
    revokeUserSession,
    updateUserPhoneNumber,
    getPhoneVerificationStatus,
    getSignupPhoneVerificationEvents,
    verifyWhatsAppWebhook,
    verifyWhatsAppWebhookHandshake,
    updateUserEmail,
};
