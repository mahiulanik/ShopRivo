import cloudinary from "../config/cloudinary.js";

export const uploadImage = (fileBuffer, folder) => {
    return new Promise((resolve, reject) => {

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            }
        );

        uploadStream.end(fileBuffer);
    });
};

export const deleteImage = async (publicId) => {
    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId);
};