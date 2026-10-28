import { cloudinary } from "../db/cloudinary.ts";
import AppError from "../utils/error.ts";

export interface UploadSignatureResponse {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
}

export const getUploadSignature = (
    folder: string = "restro_helper/restaurant_logos"
): UploadSignatureResponse => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiSecret = process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;

    if (!apiSecret || !apiKey || !cloudName) {
        throw new AppError(
            "Cloudinary credentials missing in environment variables. Ensure CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API/CLOUDINARY_API_SECRET are set.",
            500
        );
    }

    const paramsToSign: Record<string, string | number> = {
        folder,
        timestamp,
    };

    const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);

    return {
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
    };
};

export const deleteMediaByPublicId = async (publicId: string) => {
    if (!publicId) {
        throw new AppError("Public ID is required to delete media", 400);
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
};

export const uploadMediaFromBase64 = async (
    base64Data: string,
    folder: string = "restro_helper/restaurant_logos"
) => {
    if (!base64Data) {
        throw new AppError("Image data is required", 400);
    }

    const result = await cloudinary.uploader.upload(base64Data, {
        folder,
        resource_type: "auto",
    });

    return {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        bytes: result.bytes,
    };
};
