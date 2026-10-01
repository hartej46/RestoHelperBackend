import AppError from "./error";

const whatsappPhoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
const whatsappAccessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;
const whatsappTemplateName = process.env.META_WHATSAPP_TEMPLATE_NAME;
const whatsappTemplateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE ?? "en_US";
const graphApiVersion = process.env.META_GRAPH_API_VERSION ?? "v22.0";

const sendOtpWhatsApp = async (
    recipientPhoneNumber: string,
    otp: number,
    expiresInMinutes: number
) => {
    if (!whatsappPhoneNumberId || !whatsappAccessToken || !whatsappTemplateName) {
        throw new AppError("WhatsApp credentials are not configured", 500);
    }

    try {
        const response = await fetch(
            `https://graph.facebook.com/${graphApiVersion}/${whatsappPhoneNumberId}/messages`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${whatsappAccessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messaging_product: "whatsapp",
                    to: recipientPhoneNumber,
                    type: "template",
                    template: {
                        name: whatsappTemplateName,
                        language: { code: whatsappTemplateLanguage },
                        components: [
                            {
                                type: "body",
                                parameters: [
                                    { type: "text", text: String(otp) },
                                    { type: "text", text: String(expiresInMinutes) },
                                ],
                            },
                        ],
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(errorMessage || "WhatsApp API rejected the OTP request");
        }
    } catch (error: unknown) {
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Something went wrong while sending the WhatsApp OTP";
        throw new AppError(errorMessage, 500);
    }
};

export default sendOtpWhatsApp;
