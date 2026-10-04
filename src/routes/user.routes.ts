import { Router } from "express";
import {
    loginUser,
    newUserSignUp,
    resetPassword,
    resetPasswordOtp,
    updateUserEmail,
    updateUserPhoneNumber,
    validateOtp,
} from "../controllers/user.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import { validateNewUser } from "../middlewares/validateBody.ts";

const userRouter = Router();

userRouter.post("/signup", validateNewUser, newUserSignUp);
userRouter.post("/verify-otp", validateOtp);
userRouter.post("/login", loginUser);
userRouter.post("/reset-password/otp", resetPasswordOtp);
userRouter.post("/reset-password", resetPassword);
userRouter.patch("/phone-number", authentication, updateUserPhoneNumber);
userRouter.patch("/email", authentication, updateUserEmail);

export default userRouter;