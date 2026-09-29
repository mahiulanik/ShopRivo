import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as mediaService from "../services/mediaService.js";


export const getAllMediaController = asyncErrorsHandler(async (req, res) => {

    const media = await mediaService.getAllMedia();

    return res.status(200).json({
        success: true,
        media,
    });
});


export const deleteMediaController = asyncErrorsHandler(async (req, res) => {

    await mediaService.deleteMedia(req.params.id);

    return res.status(200).json({
        success: true,
        message: "Media deleted permanently.",
    });
});