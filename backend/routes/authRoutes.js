import express from "express";

const router = express.Router()


import * as authControllers from "../controllers/authController.js"
import { isAuthenticated } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/multer.js";
import { authLimiter, registerLimiter, forgotPasswordLimiter } from "../middlewares/rateLimit.js";


router.post("/register", registerLimiter, authControllers.registerController);
router.post("/login", authLimiter, authControllers.loginController);
router.post("/refresh-token", authControllers.refreshTokenController)
router.get("/user", isAuthenticated,authControllers.getUserController);
router.post("/logout", authControllers.logoutController);
router.post("/forgot-password", forgotPasswordLimiter, authControllers.forgotPasswordController);
router.put("/password/reset/:token", authLimiter, authControllers.resetPasswordController);
router.put("/password/change", isAuthenticated, authControllers.changePasswordController);
router.patch("/profile/update", isAuthenticated, upload.single("avatar"), authControllers.updateProfileController);
router.get("/google", authControllers.googleLoginController);
router.get("/google/callback", authControllers.googleCallbackController);


export default router