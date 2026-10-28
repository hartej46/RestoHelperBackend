import { Router } from "express";
import {
    deleteUserAccount,
    getCurrentUser,
    loginUser,
    logoutAllUsers,
    logoutUser,
    newUserSignUp,
    // resetPassword,
    resetPasswordOtp,
    revokeUserSession,
    updateUserEmail,
    updateUserPhoneNumber,
    validateEmailOtp,
    // validateOtp,
    verifyWhatsAppWebhook,
    verifyWhatsAppWebhookHandshake,
    getPhoneVerificationStatus,
    getSignupPhoneVerificationEvents,
} from "../controllers/user.controller.ts";
import { authentication } from "../middlewares/auth.middleware.ts";
import { validateNewUser } from "../middlewares/validateBody.ts";

const userRouter = Router();

userRouter.post("/signup", validateNewUser, newUserSignUp);
userRouter.post("/verify-otp", validateEmailOtp);
userRouter.post("/login", loginUser);
userRouter.post("/reset-password/otp", resetPasswordOtp);
// userRouter.post("/reset-password", resetPassword);
userRouter.get("/webhook/whatsapp", verifyWhatsAppWebhookHandshake);
userRouter.post("/webhook/whatsapp", verifyWhatsAppWebhook);
userRouter.get("/me", authentication, getCurrentUser);
userRouter.post("/logout", authentication, logoutUser);
userRouter.post("/logout-all", authentication, logoutAllUsers);
userRouter.delete("/me", authentication, deleteUserAccount);
userRouter.delete("/sessions/:sessionId", authentication, revokeUserSession);
userRouter.patch("/phone-number", authentication, updateUserPhoneNumber);
userRouter.get("/phone-number/verification", authentication, getPhoneVerificationStatus);
userRouter.get("/signup/phone-verification/events", getSignupPhoneVerificationEvents);
userRouter.patch("/email", authentication, updateUserEmail);

export default userRouter;
