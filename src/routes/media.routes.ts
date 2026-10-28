import { Router } from "express";
import {
    getUploadSignatureController,
    uploadMediaController,
    deleteMediaController,
} from "../controllers/media.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";

const mediaRouter = Router();

mediaRouter.get("/signature", authentication, getUploadSignatureController);
mediaRouter.post("/upload", authentication, uploadMediaController);
mediaRouter.delete("/:publicId(*)", authentication, deleteMediaController);

export default mediaRouter;
