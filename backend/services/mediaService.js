import database from "../config/db.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { deleteImage } from "./cloudinaryService.js";


export const getAllMedia = async () => {

    const result = await database.query(
        `SELECT id, public_id, url, created_at
         FROM media
         ORDER BY created_at DESC`
    );

    return result.rows;
};


export const deleteMedia = async (media_id) => {

    const result = await database.query(
        `SELECT id, public_id
         FROM media
         WHERE id = $1
         LIMIT 1`,
        [media_id]
    );

    if (result.rows.length === 0) {
        throw new ErrorHandler("Media not found.", 404);
    }

    const media = result.rows[0];

    try {
        await deleteImage(media.public_id);
    } catch (error) {
        console.error(
            "Failed to delete media from Cloudinary:",
            error.message
        );

        throw new ErrorHandler("Failed to delete image from storage.", 500);
    }

    await database.query(
        `DELETE FROM media
         WHERE id = $1`,
        [media_id]
    );
};