import ErrorHandler from "../middlewares/errorMiddleware.js";
import database from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} from "../utils/jwtToken.js";
import hashToken from "../utils/hashToken.js";
import generateEmailTemplate from "../utils/forgotPassEmailTemp.js";
import sendEmail from "../utils/sendEmail.js";
import { uploadImage, deleteImage } from "./cloudinaryService.js";
import { google } from "googleapis";
import googleOAuthClient from "../config/googleOAuth.js";


export const register = async (data) => {

    const { name, email, password } = data;

    if (!name || !email || !password) {
        throw new ErrorHandler("Please provide all required fields.", 400);
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
        throw new ErrorHandler("Name and email cannot be empty.", 400);
    }

    if (password.length < 8 || password.length > 16) {
        throw new ErrorHandler("Password must be between 8 and 16 characters.", 400);
    }

    const existingUser = await database.query(
        `SELECT id
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [normalizedEmail]
    );

    if (existingUser.rows.length > 0) {
        throw new ErrorHandler("User already registered with this email.", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await database.query(
        `INSERT INTO users
            (name, email, password)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role`,
        [normalizedName, normalizedEmail, hashedPassword]
    );

    return result.rows[0];
};


export const login = async (data) => {

    const { email, password } = data;

    if (!email || !password) {
        throw new ErrorHandler("Please provide email and password.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
        throw new ErrorHandler("Please provide email and password.", 400);
    }

    const result = await database.query(
        `SELECT id, password, role
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [normalizedEmail]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Invalid email or password.", 401);
    }

    const user = result.rows[0];

    const isPasswordMatch = await bcrypt.compare(
        password,
        user.password
    );

    if (!isPasswordMatch) {
        throw new ErrorHandler("Invalid email or password.", 401);
    }

    const accessToken = generateAccessToken(
        user.id,
        user.role
    );

    const refreshToken = generateRefreshToken(user.id);
    const tokenHash = hashToken(refreshToken);

    await database.query(
        `INSERT INTO refresh_sessions
            (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '15 days')`,
        [user.id, tokenHash]
    );

    return {
        accessToken,
        refreshToken,
    };
};


export const refreshAccessToken = async (refreshToken) => {

    if (!refreshToken) {
        throw new ErrorHandler("Refresh token not found.", 401);
    }

    let decoded;

    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
        throw new ErrorHandler("Invalid or expired refresh token.", 401);
    }

    const tokenHash = hashToken(refreshToken);

    const result = await database.query(
        `SELECT
            refresh_sessions.user_id,
            users.role
         FROM refresh_sessions
         JOIN users
         ON users.id = refresh_sessions.user_id
         WHERE refresh_sessions.token_hash = $1
         AND refresh_sessions.user_id = $2
         AND refresh_sessions.expires_at > NOW()
         LIMIT 1`,
        [tokenHash, decoded.user_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler(
            "Refresh session is invalid or expired.",
            401
        );
    }

    const session = result.rows[0];

    return generateAccessToken(
        session.user_id,
        session.role
    );
};


export const getUser = async (user_id) => {

    const result = await database.query(
        `SELECT id, name, email, role, avatar
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [user_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("User not found.", 404);
    }

    return result.rows[0];
};


export const logout = async (refreshToken) => {

    if (refreshToken) {

        const tokenHash = hashToken(refreshToken);

        await database.query(
            `DELETE FROM refresh_sessions
             WHERE token_hash = $1`,
            [tokenHash]
        );
    }

    return {
        message: "Logout successful."
    };
};


export const forgotPassword = async (email, frontendUrl) => {

    if (!email) {
        throw new ErrorHandler("Email is required.", 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await database.query(
        `SELECT id, email
         FROM users
         WHERE email = $1
         LIMIT 1`,
        [normalizedEmail]
    );

    if (existingUser.rows.length === 0) {
        throw new ErrorHandler(
            "User not found with this email.",
            404
        );
    }

    const user = existingUser.rows[0];

    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = hashToken(resetToken);

    const resetPasswordExpireTime =
        Date.now() + 5 * 60 * 1000;

    await database.query(
        `UPDATE users
         SET reset_password_token = $1,
             reset_password_expire = to_timestamp($2)
         WHERE id = $3`,
        [
            hashedToken,
            resetPasswordExpireTime / 1000,
            user.id
        ]
    );

    const resetPasswordUrl =
        `${frontendUrl}/password/reset/${resetToken}`;

    const message = generateEmailTemplate(
        resetPasswordUrl
    );

    try {

        await sendEmail(
            user.email,
            "ShopRiva - Password Recovery",
            message
        );

    } catch (error) {

        await database.query(
            `UPDATE users
             SET reset_password_token = NULL,
                 reset_password_expire = NULL
             WHERE id = $1`,
            [user.id]
        );

        throw new ErrorHandler(
            "Email could not be sent.",
            500
        );
    }

    return {
        message: `Email sent to ${user.email} successfully.`
    };
};


export const resetPassword = async (
    token,
    password,
    confirmPassword
) => {

    if (!token) {
        throw new ErrorHandler("Reset token is required.", 400);
    }

    if (!password || !confirmPassword) {
        throw new ErrorHandler("Password and confirm password are required.", 400);
    }

    if (password !== confirmPassword) {
        throw new ErrorHandler("Passwords do not match.", 400);
    }

    if (password.length < 8 || password.length > 16) {
        throw new ErrorHandler("Password must be between 8 and 16 characters.", 400);
    }

    const hashedToken = hashToken(token);

    const existingUser = await database.query(
        `SELECT id
         FROM users
         WHERE reset_password_token = $1
         AND reset_password_expire > NOW()
         LIMIT 1`,
        [hashedToken]
    );

    if (existingUser.rows.length === 0) {
        throw new ErrorHandler("Invalid or expired reset token.", 400);
    }

    const user = existingUser.rows[0];

    const hashedPassword = await bcrypt.hash(
        password,
        10
    );

    await database.query(
        `UPDATE users
         SET password = $1,
             reset_password_token = NULL,
             reset_password_expire = NULL
         WHERE id = $2`,
        [hashedPassword, user.id]
    );

    await database.query(
        `DELETE FROM refresh_sessions
         WHERE user_id = $1`,
        [user.id]
    );

    return {
        message: "Password reset successfully."
    };
};


export const changePassword = async (user_id, data) => {

    const {currentPassword, newPassword, confirmNewPassword} = data;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        throw new ErrorHandler("Please provide all required fields.", 400);
    }

    if (newPassword !== confirmNewPassword) {
        throw new ErrorHandler("New passwords do not match.", 400);
    }

    if (newPassword.length < 8 || newPassword.length > 16) {
        throw new ErrorHandler("Password must be between 8 and 16 characters.", 400);
    }

    const existingUser = await database.query(
        `SELECT id, password
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [user_id]
    );

    if (existingUser.rows.length === 0) {
        throw new ErrorHandler("User not found.", 404);
    }

    const user = existingUser.rows[0];

    const isPasswordMatch = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if (!isPasswordMatch) {
        throw new ErrorHandler("Current password is incorrect.", 401);
    }

    const isSamePassword = await bcrypt.compare(
        newPassword,
        user.password
    );

    if (isSamePassword) {
        throw new ErrorHandler("New password must be different from current password.", 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await database.query(
        `UPDATE users
         SET password = $1
         WHERE id = $2`,
        [hashedPassword, user_id]
    );

    await database.query(
        `DELETE FROM refresh_sessions
         WHERE user_id = $1`,
        [user_id]
    );

    return {
        message: "Password changed successfully."
    };
};


export const updateProfile = async (user_id, data, file) => {

    const { name, email } = data;

    if (!name || !email) {
        throw new ErrorHandler("Please provide all required fields.", 400);
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
        throw new ErrorHandler("Name and email cannot be empty.", 400);
    }

    const existingUser = await database.query(
        `SELECT id, avatar
         FROM users
         WHERE id = $1
         LIMIT 1`,
        [user_id]
    );

    if (existingUser.rows.length === 0) {
        throw new ErrorHandler("User not found.", 404);
    }

    const user = existingUser.rows[0];

    const duplicateEmail = await database.query(
        `SELECT id
         FROM users
         WHERE email = $1
         AND id <> $2
         LIMIT 1`,
        [normalizedEmail, user_id]
    );

    if (duplicateEmail.rows.length > 0) {
        throw new ErrorHandler("Email is already in use.", 409);
    }

    let avatar = user.avatar;
    let newImage = null;

    try {

        if (file) {

            newImage = await uploadImage(
                file.buffer,
                "ecommerce/avatars"
            );

            avatar = {
                public_id: newImage.public_id,
                url: newImage.secure_url
            };
        }

        const result = await database.query(
            `UPDATE users
             SET name = $1,
                 email = $2,
                 avatar = $3
             WHERE id = $4
             RETURNING
                id,
                name,
                email,
                role,
                avatar,
                created_at`,
            [
                normalizedName,
                normalizedEmail,
                avatar,
                user_id
            ]
        );

        if (
            file &&
            user.avatar?.public_id &&
            user.avatar.public_id !== avatar.public_id
        ) {
            try {
                await deleteImage(user.avatar.public_id);
            } catch (error) {
                console.error(
                    "Failed to delete old profile image:",
                    error.message
                );
            }
        }

        return {
            message: "Profile updated successfully.",
            user: result.rows[0]
        };

    } catch (error) {

        if (newImage?.public_id) {
            try {
                await deleteImage(newImage.public_id);
            } catch (deleteError) {
                console.error(
                    "Failed to cleanup new profile image:",
                    deleteError.message
                );
            }
        }

        throw error;
    }
};


export const getGoogleAuthUrl = () => {

    return googleOAuthClient.generateAuthUrl({
        access_type: "online",
        scope: [
            "openid",
            "email",
            "profile",
        ],
        prompt: "select_account",
    });
};


export const googleLogin = async (code) => {

    if (!code) {
        throw new ErrorHandler("Google authorization code is missing.", 400);
    }


    const { tokens } = await googleOAuthClient.getToken(code);

    googleOAuthClient.setCredentials(tokens);


    const oauth2 = google.oauth2({
        version: "v2",
        auth: googleOAuthClient,
    });


    const { data } = await oauth2.userinfo.get();

    const {
        id: googleId,
        email,
        name,
        picture,
    } = data;


    if (!email) {
        throw new ErrorHandler("Google account email not found.", 400);
    }


    let result = await database.query(
        `SELECT *
         FROM users
         WHERE google_id = $1
         OR email = $2
         LIMIT 1`,
        [
            googleId,
            email,
        ]
    );


    let user = result.rows[0];


    if (!user) {

        result = await database.query(
            `INSERT INTO users
             (
                name,
                email,
                google_id,
                auth_provider,
                avatar
             )
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [
                name,
                email,
                googleId,
                "google",
                picture
                    ? JSON.stringify({ url: picture })
                    : null,
            ]
        );

        user = result.rows[0];
    }


    const accessToken =
        generateAccessToken(user.id, user.role);

    const refreshToken =
        generateRefreshToken(user.id);

    const tokenHash =
        hashToken(refreshToken);


    await database.query(
        `INSERT INTO refresh_sessions
         (
            user_id,
            token_hash,
            expires_at
         )
         VALUES ($1, $2, NOW() + INTERVAL '15 days')`,
        [
            user.id,
            tokenHash,
        ]
    );


    return {
        accessToken,
        refreshToken,
    };
};