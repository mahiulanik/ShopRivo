import asyncErrorsHandler from "../middlewares/asyncErrorsHandler.js";

import * as paymentService from "../services/paymentService.js";


export const stripeWebhookController = asyncErrorsHandler(async (req, res) => {

    await paymentService.handleStripeWebhook(
        req.body,
        req.headers["stripe-signature"]
    );

    return res.status(200).json({
        success: true,
        received: true,
    });
});