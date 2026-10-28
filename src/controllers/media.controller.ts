import asyncHandler from "../utils/asyncHandler.ts";
import AppError from "../utils/error.ts";
import {
    getUploadSignature,
    deleteMediaByPublicId,
    uploadMediaFromBase64,
} from "../services/media.service.ts";

export const getUploadSignatureController = asyncHandler(async (req, res) => {
    const folder = typeof req.query.folder === "string" ? req.query.folder : undefined;
    const signatureData = getUploadSignature(folder);

    return res.status(200).json({
        success: true,
        message: "Upload signature generated successfully",
        data: signatureData,
    });
});

export const uploadMediaController = asyncHandler(async (req, res) => {
    const { image, folder } = req.body;
    if (!image) {
        throw new AppError("Image data is required", 400);
    }

    const uploadResult = await uploadMediaFromBase64(image, folder);

    return res.status(201).json({
        success: true,
        message: "Media uploaded successfully",
        data: uploadResult,
    });
});

export const deleteMediaController = asyncHandler(async (req, res) => {
    const publicId = (req.params.publicId || req.query.publicId) as string;
    if (!publicId) {
        throw new AppError("publicId parameter is required", 400);
    }

    const result = await deleteMediaByPublicId(publicId);

    return res.status(200).json({
        success: true,
        message: "Media deleted successfully",
        data: result,
    });
});
