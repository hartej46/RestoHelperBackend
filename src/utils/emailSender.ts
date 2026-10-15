import nodemailer from "nodemailer";
import AppError from "./error";

const smtpHost = process.env.SMTP_HOST ?? "smtp.gmail.com";
const smtpPort = Number(process.env.SMTP_PORT ?? 587);
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASS;

const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    requireTLS: true,
    auth: {
        user: smtpUser ?? "",
        pass: smtpPassword ?? "",
    },
});

const sendEmail = async (
    recipientEmail: string,
    subject: string,
    text: string,
    html: string
): Promise<void> => {
    if (!smtpUser || !smtpPassword) {
        throw new AppError("SMTP credentials are not configured", 500);
    }

    try {
        const delivery = await transporter.sendMail({
            from: `Security Team <${smtpUser}>`,
            to: recipientEmail,
            subject,
            text,
            html,
        });
        console.info("Email accepted by SMTP server", {
            messageId: delivery.messageId,
            accepted: delivery.accepted,
            rejected: delivery.rejected,
        });
    } catch (error: unknown) {
        if (error && typeof error === "object" && "code" in error) {
            const code = (error as { code?: string }).code;
            if (code === "EAUTH") {
                throw new AppError(
                    "Failed to authenticate with Gmail. Verify the SMTP App Password.",
                    500
                );
            }
        }

        const errorMessage = error instanceof Error ? error.message : "SMTP email delivery failed";
        throw new AppError(errorMessage, 500);
    }
};

const createOtpHtml = (otp: number, expiresInMinutes: number, title: string): string => `
                <div style="margin: 0; padding: 32px 16px; background-color: #f1f5f9; font-family: Arial, sans-serif; color: #1e293b;">
                    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden;">
                        <tr>
                            <td style="padding: 28px 32px; background-color: #0f766e; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 26px;">Restro Helper</h1>
                                <p style="margin: 8px 0 0; color: #ccfbf1; font-size: 14px;">${title}</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 36px 32px; text-align: center;">
                                <h2 style="margin: 0 0 12px; color: #134e4a; font-size: 22px;">${title}</h2>
                                <p style="margin: 0; color: #64748b; font-size: 15px; line-height: 1.6;">Use the verification code below to continue.</p>
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
                </div>`;

const sendOtpEmail = async (
    recipientEmail: string,
    otp: number,
    expiresInMinutes: number
): Promise<void> =>
    sendEmail(
        recipientEmail,
        "Verify your Restro Helper account",
        `Your Restro Helper verification code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        createOtpHtml(otp, expiresInMinutes, "Account verification")
    );

export const sendPasswordResetOtpEmail = async (
    recipientEmail: string,
    otp: number,
    expiresInMinutes: number
): Promise<void> =>
    sendEmail(
        recipientEmail,
        "Reset your Restro Helper password",
        `Your Restro Helper password reset code is ${otp}. It expires in ${expiresInMinutes} minutes.`,
        createOtpHtml(otp, expiresInMinutes, "Password reset")
    );

export default sendOtpEmail;
