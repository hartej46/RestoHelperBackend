import nodemailer from "nodemailer";
import AppError from "./error";

const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: gmailUser ?? "",
        pass: gmailAppPassword ?? ""
    }
});

const sendOtpEmail = async ( recipientEmail: string, otp: number, expiresInMinutes: number ): Promise<void> => {
    if (!gmailUser || !gmailAppPassword) {
        throw new AppError("Gmail credentials are not configured", 500);
    }

    try {
        await transporter.sendMail({
            from: gmailUser,
            to: recipientEmail,
            subject: "Verify your Restro Helper account",
            text: `Your Restro Helper verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
            html: `
                <div style="margin: 0; padding: 32px 16px; background-color: #f1f5f9; font-family: Arial, sans-serif; color: #1e293b;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="padding: 28px 32px; background-color: #0f766e; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 26px;">Restro Helper</h1>
                                <p style="margin: 8px 0 0; color: #ccfbf1; font-size: 14px;">Account verification</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 36px 32px; text-align: center;">
                                <h2 style="margin: 0 0 12px; color: #134e4a; font-size: 22px;">Verify your email</h2>
                                <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">Use the verification code below to complete your Restro Helper registration.</p>
                                <div style="display: inline-block; margin: 28px 0; padding: 16px 28px; background-color: #ccfbf1; border: 2px solid #14b8a6; border-radius: 12px;">
                                    <span style="color: #115e59; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
                                </div>
                                <p style="margin: 0; color: #f97316; font-size: 14px; font-weight: bold;">This code expires in ${expiresInMinutes} minutes.</p>
                                <p style="margin: 24px 0 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">If you did not request this code, you can safely ignore this email.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 16px 32px; background-color: #f8fafc; text-align: center;">
                                <p style="margin: 0; color: #94a3b8; font-size: 12px;">This is an automated message. Please do not reply.</p>
                            </td>
                        </tr>
                    </table>
                </div>`
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error
            ? error.message
            : "Something went wrong while sending the OTP email";
        throw new AppError(errorMessage, 500);
    }
};

export default sendOtpEmail;
