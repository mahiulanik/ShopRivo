import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as authService from "../services/authService.js"



export const registerController = asyncErrorsHandler(async(req, res) => {
  
    const user = await authService.register(req.body);

    return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user,
    });
});


export const loginController = asyncErrorsHandler(async(req, res) => {
   
    const {accessToken, refreshToken} = await authService.login(req.body);

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000,
        path: "/api",
    });

    return res.status(200).json({
        success: true,
        message: "Logged in successfully",
        accessToken,
    });
})


export const refreshTokenController = asyncErrorsHandler(async (req, res) => {

    const refreshToken = req.cookies.refreshToken;

    const accessToken = await authService.refreshAccessToken(refreshToken);

    return res.status(200).json({
        success: true,
        accessToken,
        });
  });


export const getUserController = asyncErrorsHandler(async(req, res) => {

    const user = await authService.getUser(req.user.user_id);

    return res.status(200).json({
        success: true,
        user,
    });
});


export const logoutController = asyncErrorsHandler(async(req, res) => {

    const refreshToken = req.cookies.refreshToken;

    const result = await authService.logout(refreshToken);

    res.clearCookie("refreshToken",
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/api",
      }
    );

    return res.status(200).json(result);
  });


export const forgotPasswordController = asyncErrorsHandler(async (req, res) => {
    const { email } = req.body;
    const { frontendUrl } = req.query;

    const result = await authService.forgotPassword(email, frontendUrl);

    return res.status(200).json({
        success: true,
        message: result.message,
    });
});


export const resetPasswordController = asyncErrorsHandler(async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    const result = await authService.resetPassword(token, password, confirmPassword);

    return res.status(200).json({
        success: true,
        message: result.message,
    });
});


export const changePasswordController = asyncErrorsHandler(async (req, res) => {

    const user_id = req.user.user_id;

    const result = await authService.changePassword(user_id, req.body);

    return res.status(200).json({
        success: true,
        message: result.message,
    });
});


export const updateProfileController = asyncErrorsHandler(async (req, res) => {

        const user_id = req.user.user_id;

        const result = await authService.updateProfile(
            user_id,
            req.body,
            req.file
        );

        return res.status(200).json({
            success: true,
            message: result.message,
            user: result.user
        });
    }
);


export const googleLoginController = asyncErrorsHandler(async (req, res) => {

    const url = authService.getGoogleAuthUrl();

    return res.redirect(url);
});


export const googleCallbackController = asyncErrorsHandler(async (req, res) => {

    const { code } = req.query;

    const { accessToken, refreshToken } =
        await authService.googleLogin(code);


    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        maxAge: 15 * 24 * 60 * 60 * 1000,
        path: "/api",
    });


    const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";


    return res.redirect(
        `${frontendUrl}/oauth-success?token=${accessToken}`
    );
});