import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API,
    secure: true,
});

export const connectCloudinary = async () => {
    try {
        const config = cloudinary.config();
        if (!config.cloud_name || !config.api_key || !config.api_secret) {
            console.warn(
                "Cloudinary credentials missing or incomplete. Please check your environment variables."
            );
            return;
        }
        await cloudinary.api.ping();
        console.log("Cloudinary connection established successfully");
    } catch (error) {
        console.error("Cloudinary connection error:", error);
    }
};

export { cloudinary };
export default cloudinary;
