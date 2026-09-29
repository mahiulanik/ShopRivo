import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";
import * as productReviewService from "../services/productReviewService.js";


export const postProductReviewController = asyncErrorsHandler(async (req, res) => {

    const result = await productReviewService.postProductReview(
        req.user.user_id,
        req.params.productId,
        req.body
    );

    return res.status(200).json({
        success: true,
        message: result.isUpdated
            ? "Review updated successfully."
            : "Review posted successfully.",
        review: result.review,
        product: result.product,
    });
});


export const deleteReviewController = asyncErrorsHandler(async (req, res) => {

    const result = await productReviewService.deleteReview(
        req.user.user_id,
        req.params.productId
    );

    return res.status(200).json({
        success: true,
        message: "Your review has been deleted.",
        review: result.review,
        product: result.product,
    });
});