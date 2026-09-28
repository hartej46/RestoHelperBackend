import asyncHandler from "../utils/asyncHandler";
import AppError from "../utils/error";
import {
    requestBodyCreateUser,
    requestBodyValidateOtp,
    validateOtpSchema,
} from "../schema/user.schema";
import { User } from "../models/User.model";
import { getUserByEmail, getUserByPhoneNumber, createUser } from "../repository/User.repository";
import redisKeyGenerator from "../redis/redisKeyGenerator";
import setRedisHash from "../redis/redisHash";
import { hashPassword } from "../utils/password";
import sendOtpEmail from "../utils/emailSender";

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

